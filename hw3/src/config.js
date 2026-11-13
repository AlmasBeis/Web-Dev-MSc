function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Не задана переменная окружения ${name}`);
  }
  return value;
}

function toPort(name, value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} должен быть номером порта, получено: ${value}`);
  }
  return port;
}

export const config = Object.freeze({
  env: process.env.NODE_ENV ?? 'development',
  port: toPort('PORT', process.env.PORT ?? '3000'),
  db: Object.freeze({
    host: required('DB_HOST'),
    port: toPort('DB_PORT', process.env.DB_PORT ?? '5432'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  }),
});

export const isDevelopment = config.env === 'development';
