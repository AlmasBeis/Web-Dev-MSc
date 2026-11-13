import { Check, ensureObjectBody } from './common.js';

export function validateCourse(body) {
  ensureObjectBody(body);
  const check = new Check();
  const title = check.string(body, 'title', { min: 2, max: 150, message: 'Название: 2–150 символов' });

  const raw = body.description ?? '';
  let description = '';
  if (typeof raw !== 'string' || raw.trim().length > 500) {
    check.fail('description', 'Описание — не больше 500 символов');
  } else {
    description = raw.trim();
  }

  if (!Number.isInteger(body.hours) || body.hours < 1 || body.hours > 500) {
    check.fail('hours', 'Длительность — целое число часов от 1 до 500');
  }

  check.throwIfFailed();
  return { title, description, hours: body.hours };
}
