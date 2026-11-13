import { pool } from '../db/pool.js';

const COLUMNS = 'id, name';

export async function list() {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM departments ORDER BY name`);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM departments WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insert({ name }) {
  const { rows } = await pool.query(
    `INSERT INTO departments (name) VALUES ($1) RETURNING ${COLUMNS}`,
    [name],
  );
  return rows[0];
}

export async function update(id, { name }) {
  const { rows } = await pool.query(
    `UPDATE departments SET name = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, name],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM departments WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function countEmployees(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM employees WHERE department_id = $1',
    [id],
  );
  return rows[0].n;
}
