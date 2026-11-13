import { HttpError } from '../errors.js';
import { isDevelopment } from '../config.js';

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

function send(res, status, code, message, details) {
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return send(res, err.status, err.code, err.message, err.details);
  }
  if (err.type === 'entity.parse.failed') {
    return send(res, 400, 'BAD_REQUEST', 'Некорректный JSON в теле запроса');
  }
  if (err.type === 'entity.too.large') {
    return send(res, 400, 'BAD_REQUEST', 'Слишком большое тело запроса');
  }
  if (err.code === PG_UNIQUE_VIOLATION) {
    return send(res, 409, 'CONFLICT', 'Запись с такими данными уже существует');
  }
  if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    return send(res, 409, 'CONFLICT', 'Операция нарушает связи между данными');
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}
