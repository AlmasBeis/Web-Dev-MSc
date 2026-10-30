import { BadRequestError, ValidationError } from '../errors.js';

export function ensureObjectBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestError('Тело запроса должно быть JSON-объектом');
  }
  return body;
}

/** Копит ошибки по полям (по одной на поле) и бросает их все разом. */
export class Check {
  errors = {};

  fail(field, message) {
    this.errors[field] ??= message;
  }

  string(body, field, { min = 1, max, message }) {
    const value = body[field];
    if (typeof value !== 'string') {
      this.fail(field, message);
      return undefined;
    }
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) {
      this.fail(field, message);
      return undefined;
    }
    return trimmed;
  }

  pattern(body, field, regex, message) {
    const value = body[field];
    if (typeof value !== 'string' || !regex.test(value.trim())) {
      this.fail(field, message);
      return undefined;
    }
    return value.trim();
  }

  throwIfFailed() {
    if (Object.keys(this.errors).length > 0) throw new ValidationError(this.errors);
  }
}
