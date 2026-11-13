import { pool } from '../db/pool.js';

const FIELDS = 'id, title, description, hours, created_at AS "createdAt"';

export async function list() {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM courses ORDER BY title`);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${FIELDS} FROM courses WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insert(c) {
  const { rows } = await pool.query(
    `INSERT INTO courses (title, description, hours) VALUES ($1, $2, $3) RETURNING ${FIELDS}`,
    [c.title, c.description, c.hours],
  );
  return rows[0];
}

export async function update(id, c) {
  const { rows } = await pool.query(
    `UPDATE courses SET title = $2, description = $3, hours = $4 WHERE id = $1 RETURNING ${FIELDS}`,
    [id, c.title, c.description, c.hours],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM courses WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function countEnrollments(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM enrollments WHERE course_id = $1',
    [id],
  );
  return rows[0].n;
}
