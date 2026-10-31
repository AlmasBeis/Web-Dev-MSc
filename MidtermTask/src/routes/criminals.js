import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError, NotFoundError } from '../errors.js';

export const criminalsRouter = Router();

const COLUMNS = `id, name, nickname, reward::float8 AS reward, last_lat, last_lon,
  last_location_note, difficulty, armed, has_crew, escape_master`;

function toBool(value, name) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new BadRequestError(`${name} должен быть true или false`);
}

function toNumber(value, name) {
  const n = Number(value);
  if (value === '' || Number.isNaN(n)) throw new BadRequestError(`${name} должен быть числом`);
  return n;
}

criminalsRouter.get('/', asyncHandler(async (req, res) => {
  const { min_reward, max_reward, sort } = req.query;
  const where = [];
  const params = [];

  if (min_reward !== undefined) {
    params.push(toNumber(min_reward, 'min_reward'));
    where.push(`reward >= $${params.length}`);
  }
  if (max_reward !== undefined) {
    params.push(toNumber(max_reward, 'max_reward'));
    where.push(`reward <= $${params.length}`);
  }
  for (const flag of ['armed', 'has_crew', 'escape_master']) {
    if (req.query[flag] !== undefined) {
      params.push(toBool(req.query[flag], flag));
      where.push(`${flag} = $${params.length}`);
    }
  }

  let order = 'id';
  if (sort === 'reward') order = 'reward ASC, id';
  else if (sort === '-reward') order = 'reward DESC, id';
  else if (sort !== undefined) throw new BadRequestError('sort: reward или -reward');

  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM wanted_criminals
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`,
    params,
  );
  res.json(rows);
}));

criminalsRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new BadRequestError('Некорректный id');
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM wanted_criminals WHERE id = $1`, [id]);
  if (!rows[0]) throw new NotFoundError('Преступник не найден');
  res.json(rows[0]);
}));
