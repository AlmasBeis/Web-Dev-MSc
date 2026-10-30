import { pool } from '../db/pool.js';

const COLUMNS = 'id, city, address';

export async function list() {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM offices ORDER BY city, id`);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM offices WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insert({ id, city, address }) {
  const { rows } = await pool.query(
    `INSERT INTO offices (id, city, address) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
    [id, city, address],
  );
  return rows[0];
}

export async function update(id, { city, address }) {
  const { rows } = await pool.query(
    `UPDATE offices SET city = $2, address = $3 WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, city, address],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM offices WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function countEmployees(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM employees WHERE office_id = $1',
    [id],
  );
  return rows[0].n;
}
