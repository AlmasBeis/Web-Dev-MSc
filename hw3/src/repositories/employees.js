import { pool } from '../db/pool.js';

const FIELDS = `id, first_name AS "firstName", last_name AS "lastName", position, email,
  hire_date AS "hireDate", department_id AS "departmentId", created_at AS "createdAt"`;

export async function list({ departmentId, q } = {}) {
  const where = [];
  const params = [];
  if (departmentId !== undefined) {
    params.push(departmentId);
    where.push(`department_id = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(lower(first_name) LIKE $${params.length} OR lower(last_name) LIKE $${params.length})`);
  }
  const sql = `SELECT ${FIELDS} FROM employees ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY last_name, first_name, id`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM employees WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insert(e) {
  const { rows } = await pool.query(
    `INSERT INTO employees (first_name, last_name, position, email, hire_date, department_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${FIELDS}`,
    [e.firstName, e.lastName, e.position, e.email, e.hireDate, e.departmentId],
  );
  return rows[0];
}

export async function update(id, e) {
  const { rows } = await pool.query(
    `UPDATE employees SET first_name = $2, last_name = $3, position = $4, email = $5,
       hire_date = $6, department_id = $7 WHERE id = $1 RETURNING ${FIELDS}`,
    [id, e.firstName, e.lastName, e.position, e.email, e.hireDate, e.departmentId],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  return rowCount > 0;
}
