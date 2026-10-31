import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError, NotFoundError, ValidationError } from '../errors.js';

export const huntsRouter = Router();

const COLUMNS = 'id, criminal_id, success, notes, created_at';

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new BadRequestError('Некорректный id');
  return id;
}

function ensureBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestError('Тело запроса должно быть JSON-объектом');
  }
}

huntsRouter.get('/', asyncHandler(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.criminal_id !== undefined) {
    params.push(parseId(req.query.criminal_id));
    where = 'WHERE criminal_id = $1';
  }
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM hunt_logs ${where} ORDER BY id`,
    params,
  );
  res.json(rows);
}));

huntsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM hunt_logs WHERE id = $1`,
    [parseId(req.params.id)],
  );
  if (!rows[0]) throw new NotFoundError('Запись не найдена');
  res.json(rows[0]);
}));

huntsRouter.post('/', asyncHandler(async (req, res) => {
  ensureBody(req.body);
  const { criminal_id, success, notes } = req.body;
  const errors = {};
  if (!Number.isInteger(criminal_id) || criminal_id < 1) errors.criminal_id = 'Укажите id преступника';
  if (typeof success !== 'boolean') errors.success = 'success должен быть boolean';
  if (typeof notes !== 'string' || notes.trim() === '') errors.notes = 'Укажите notes';
  if (Object.keys(errors).length) throw new ValidationError(errors);

  const exists = await pool.query('SELECT 1 FROM wanted_criminals WHERE id = $1', [criminal_id]);
  if (!exists.rowCount) throw new ValidationError({ criminal_id: 'Преступник не найден' });

  const { rows } = await pool.query(
    `INSERT INTO hunt_logs (criminal_id, success, notes) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
    [criminal_id, success, notes.trim()],
  );
  res.status(201).location(`/api/hunts/${rows[0].id}`).json(rows[0]);
}));

huntsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  ensureBody(req.body);
  const { success, notes } = req.body;
  const errors = {};
  if (success === undefined && notes === undefined) errors.body = 'Передайте success или notes';
  if (success !== undefined && typeof success !== 'boolean') errors.success = 'success должен быть boolean';
  if (notes !== undefined && (typeof notes !== 'string' || notes.trim() === '')) errors.notes = 'notes не может быть пустым';
  if (Object.keys(errors).length) throw new ValidationError(errors);

  const { rows } = await pool.query(
    `UPDATE hunt_logs SET success = COALESCE($2, success), notes = COALESCE($3, notes)
     WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, success ?? null, notes?.trim() ?? null],
  );
  if (!rows[0]) throw new NotFoundError('Запись не найдена');
  res.json(rows[0]);
}));

huntsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM hunt_logs WHERE id = $1', [parseId(req.params.id)]);
  if (!rowCount) throw new NotFoundError('Запись не найдена');
  res.status(204).end();
}));
