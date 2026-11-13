// Ошибки, которые сервисы бросают, а errorHandler превращает в HTTP-ответ.

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends HttpError {
  constructor(message) {
    super(400, 'BAD_REQUEST', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message) {
    super(409, 'CONFLICT', message);
  }
}

export class ValidationError extends HttpError {
  constructor(details, message = 'Проверьте введённые данные') {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}
