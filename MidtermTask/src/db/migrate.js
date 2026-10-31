import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const LOCK_KEY = 727355;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        err.message = `Миграция ${file} не применена: ${err.message}`;
        throw err;
      }
      console.log(`Applied migration ${file}`);
      count += 1;
    }
    if (count === 0) console.log('Нет новых миграций');
  } finally {
    client.release();
  }
}

async function main() {
  const attempts = 5;
  for (let i = 1; ; i += 1) {
    try {
      await migrate();
      return;
    } catch (err) {
      if (i >= attempts || err.message.startsWith('Миграция')) throw err;
      console.error(`БД пока недоступна (${err.message}), попытка ${i}/${attempts}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  });
