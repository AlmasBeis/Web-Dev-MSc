import { NotFoundError } from '../errors.js';

export function notFound(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.path} не найден`));
}
