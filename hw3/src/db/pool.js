import pg from 'pg';
import { config } from '../config.js';

pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({
  ...config.db,
  max: 10,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Ошибка соединения с БД:', err.message);
});

export async function isDbAlive() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
