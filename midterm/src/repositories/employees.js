import { pool } from '../db/pool.js';

const COLUMNS = `
  e.id,
  e.first_name      AS "firstName",
  e.last_name       AS "lastName",
  e.middle_name     AS "middleName",
  e.position,
  e.department_id   AS "departmentId",
  e.office_id       AS "officeId",
  e.manager_id      AS "managerId",
  e.email,
  e.phone,
  e.hire_date       AS "hireDate",
  e.carry_over_days AS "carryOverDays"`;

const fullName = (e) => [e.lastName, e.firstName, e.middleName].filter(Boolean).join(' ');

function toApi(row) {
  return { ...row, fullName: fullName(row) };
}

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

export async function list({ q, departmentId, officeId, managerId }, { limit, offset }) {
  const params = [];
  const conditions = [];
  const p = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (q) {
    const like = p(`%${escapeLike(q.toLowerCase())}%`);
    conditions.push(`(
      lower(concat_ws(' ', e.last_name, e.first_name, e.middle_name)) LIKE ${like}
      OR lower(e.position) LIKE ${like}
      OR lower(e.email) LIKE ${like}
    )`);
  }
  if (departmentId) {
    // Подразделение вместе со всеми вложенными.
    conditions.push(`e.department_id IN (
      WITH RECURSIVE sub AS (
        SELECT id FROM departments WHERE id = ${p(departmentId)}
        UNION ALL
        SELECT d.id FROM departments d JOIN sub s ON d.parent_id = s.id
      ) SELECT id FROM sub
    )`);
  }
  if (officeId) conditions.push(`e.office_id = ${p(officeId)}`);
  if (managerId) conditions.push(`e.manager_id = ${p(managerId)}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = await pool.query(`SELECT count(*)::int AS n FROM employees e ${where}`, params);
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM employees e ${where}
     ORDER BY e.last_name, e.first_name, e.id
     LIMIT ${p(limit)} OFFSET ${p(offset)}`,
    params,
  );
  return { items: rows.map(toApi), total: total.rows[0].n };
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS},
            m.id AS "managerRefId", concat_ws(' ', m.last_name, m.first_name, m.middle_name) AS "managerName",
            (SELECT count(*)::int FROM employees s WHERE s.manager_id = e.id) AS "subordinatesCount"
     FROM employees e
     LEFT JOIN employees m ON m.id = e.manager_id
     WHERE e.id = $1`,
    [id],
  );
  if (!rows[0]) return null;

  const { managerRefId, managerName, ...employee } = rows[0];
  const langs = await pool.query(
    `SELECT language, level FROM employee_languages WHERE employee_id = $1 ORDER BY sort_order`,
    [id],
  );
  return {
    ...toApi(employee),
    manager: managerRefId ? { id: managerRefId, fullName: managerName } : null,
    languages: langs.rows,
  };
}

export async function exists(id) {
  const { rowCount } = await pool.query('SELECT 1 FROM employees WHERE id = $1', [id]);
  return rowCount > 0;
}

/** Занят ли email (без учёта регистра) другим сотрудником. */
export async function emailTaken(email, exceptId = null) {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM employees WHERE lower(email) = lower($1) AND id IS DISTINCT FROM $2',
    [email, exceptId],
  );
  return rowCount > 0;
}

export async function managerChainContains(managerId, id) {
  const { rowCount } = await pool.query(
    `WITH RECURSIVE chain AS (
       SELECT id, manager_id FROM employees WHERE id = $1
       UNION ALL
       SELECT e.id, e.manager_id FROM employees e JOIN chain c ON e.id = c.manager_id
     )
     SELECT 1 FROM chain WHERE id = $2`,
    [managerId, id],
  );
  return rowCount > 0;
}

async function replaceLanguages(client, id, languages) {
  await client.query('DELETE FROM employee_languages WHERE employee_id = $1', [id]);
  if (languages.length === 0) return;
  await client.query(
    `INSERT INTO employee_languages (employee_id, language, level, sort_order)
     SELECT $1, t.language, t.level, t.ord - 1
     FROM unnest($2::text[], $3::text[]) WITH ORDINALITY AS t(language, level, ord)`,
    [id, languages.map((l) => l.language), languages.map((l) => l.level)],
  );
}


export async function insert(client, d) {
  const { rows } = await client.query(
    `INSERT INTO employees
       (first_name, last_name, middle_name, position, department_id, manager_id,
        email, phone, office_id, hire_date, carry_over_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [d.firstName, d.lastName, d.middleName, d.position, d.departmentId, d.managerId,
      d.email, d.phone, d.officeId, d.hireDate, d.carryOverDays],
  );
  const { id } = rows[0];
  await replaceLanguages(client, id, d.languages);
  return id;
}

export async function update(client, id, d) {
  await client.query(
    `UPDATE employees SET
       first_name = $2, last_name = $3, middle_name = $4, position = $5,
       department_id = $6, manager_id = $7, email = $8, phone = $9,
       office_id = $10, hire_date = $11, carry_over_days = $12, updated_at = now()
     WHERE id = $1`,
    [id, d.firstName, d.lastName, d.middleName, d.position, d.departmentId, d.managerId,
      d.email, d.phone, d.officeId, d.hireDate, d.carryOverDays],
  );
  await replaceLanguages(client, id, d.languages);
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function countSubordinates(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM employees WHERE manager_id = $1',
    [id],
  );
  return rows[0].n;
}

export async function countApprovals(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM leave_requests WHERE approver_id = $1',
    [id],
  );
  return rows[0].n;
}
