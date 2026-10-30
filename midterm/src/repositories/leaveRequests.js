import { pool } from '../db/pool.js';

export async function findByEmployee(employeeId) {
  const { rows } = await pool.query(
    `SELECT id, employee_id AS "employeeId", type, status,
            start_date AS "startDate", end_date AS "endDate"
     FROM leave_requests
     WHERE employee_id = $1
     ORDER BY start_date, id`,
    [employeeId],
  );
  return rows;
}

const COLUMNS = `
  id,
  employee_id      AS "employeeId",
  approver_id      AS "approverId",
  type,
  start_date       AS "startDate",
  end_date         AS "endDate",
  substitute_id    AS "substituteId",
  comment,
  status,
  created_at       AS "createdAt",
  decided_at       AS "decidedAt",
  decision_comment AS "decisionComment"`;

export async function list({ employeeId, approverId, status, type }) {
  const params = [];
  const conditions = [];
  const add = (column, value) => {
    if (value === undefined) return;
    params.push(value);
    conditions.push(`${column} = $${params.length}`);
  };
  add('employee_id', employeeId);
  add('approver_id', approverId);
  add('status', status);
  add('type', type);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM leave_requests ${where} ORDER BY id`, params);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM leave_requests WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insert(d) {
  const { rows } = await pool.query(
    `INSERT INTO leave_requests
       (employee_id, approver_id, type, start_date, end_date, substitute_id, comment, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
     RETURNING ${COLUMNS}`,
    [d.employeeId, d.approverId, d.type, d.startDate, d.endDate, d.substituteId, d.comment, d.createdAt],
  );
  return rows[0];
}

export async function update(id, d) {
  const { rows } = await pool.query(
    `UPDATE leave_requests
     SET type = $2, start_date = $3, end_date = $4, substitute_id = $5, comment = $6, updated_at = now()
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [id, d.type, d.startDate, d.endDate, d.substituteId, d.comment],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM leave_requests WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function transitionFromPending(id, status, { decidedAt = null, decisionComment = null } = {}) {
  const { rows } = await pool.query(
    `UPDATE leave_requests
     SET status = $2, decided_at = $3, decision_comment = $4, updated_at = now()
     WHERE id = $1 AND status = 'PENDING'
     RETURNING ${COLUMNS}`,
    [id, status, decidedAt, decisionComment],
  );
  return rows[0] ?? null;
}
