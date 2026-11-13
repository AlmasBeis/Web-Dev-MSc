import { pool } from '../db/pool.js';

const FIELDS = `id, employee_id AS "employeeId", course_id AS "courseId", status, score,
  created_at AS "createdAt"`;

export async function list({ employeeId, courseId, status } = {}) {
  const where = [];
  const params = [];
  const add = (column, value) => {
    if (value === undefined) return;
    params.push(value);
    where.push(`${column} = $${params.length}`);
  };
  add('employee_id', employeeId);
  add('course_id', courseId);
  add('status', status);
  const sql = `SELECT ${FIELDS} FROM enrollments ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM enrollments WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findPair(employeeId, courseId) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM enrollments WHERE employee_id = $1 AND course_id = $2`,
    [employeeId, courseId],
  );
  return rows[0] ?? null;
}

export async function insert({ employeeId, courseId }) {
  const { rows } = await pool.query(
    `INSERT INTO enrollments (employee_id, course_id) VALUES ($1, $2) RETURNING ${FIELDS}`,
    [employeeId, courseId],
  );
  return rows[0];
}

export async function update(id, { status, score }) {
  const { rows } = await pool.query(
    `UPDATE enrollments SET status = $2, score = $3 WHERE id = $1 RETURNING ${FIELDS}`,
    [id, status, score],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM enrollments WHERE id = $1', [id]);
  return rowCount > 0;
}
