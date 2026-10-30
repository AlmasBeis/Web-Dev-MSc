import { pool } from '../db/pool.js';

const SELECT = 'SELECT id, name, parent_id AS "parentId" FROM departments';
const RETURNING = 'RETURNING id, name, parent_id AS "parentId"';

export async function list() {
  const { rows } = await pool.query(`${SELECT} ORDER BY name, id`);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`${SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insert({ id, name, parentId }) {
  const { rows } = await pool.query(
    `INSERT INTO departments (id, name, parent_id) VALUES ($1, $2, $3) ${RETURNING}`,
    [id, name, parentId],
  );
  return rows[0];
}

export async function update(id, { name, parentId }) {
  const { rows } = await pool.query(
    `UPDATE departments SET name = $2, parent_id = $3 WHERE id = $1 ${RETURNING}`,
    [id, name, parentId],
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM departments WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function isAncestorOrSelf(id, candidateParentId) {
  const { rowCount } = await pool.query(
    `WITH RECURSIVE chain AS (
       SELECT id, parent_id FROM departments WHERE id = $1
       UNION ALL
       SELECT d.id, d.parent_id FROM departments d JOIN chain c ON d.id = c.parent_id
     )
     SELECT 1 FROM chain WHERE id = $2`,
    [candidateParentId, id],
  );
  return rowCount > 0;
}

export async function countChildren(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM departments WHERE parent_id = $1',
    [id],
  );
  return rows[0].n;
}

export async function countEmployees(id) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM employees WHERE department_id = $1',
    [id],
  );
  return rows[0].n;
}
