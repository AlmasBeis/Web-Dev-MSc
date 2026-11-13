import { Check, ensureObjectBody } from './common.js';
import { isValidIsoDate } from '../utils.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmployee(body, today = new Date().toLocaleDateString('en-CA')) {
  ensureObjectBody(body);
  const check = new Check();
  const firstName = check.string(body, 'firstName', { max: 50, message: 'Имя: 1–50 символов' });
  const lastName = check.string(body, 'lastName', { max: 50, message: 'Фамилия: 1–50 символов' });
  const position = check.string(body, 'position', { min: 2, max: 100, message: 'Должность: 2–100 символов' });

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (email.length > 254 || !EMAIL.test(email)) check.fail('email', 'Некорректный email');

  if (!isValidIsoDate(body.hireDate)) check.fail('hireDate', 'Дата приёма в формате ГГГГ-ММ-ДД');
  else if (body.hireDate > today) check.fail('hireDate', 'Дата приёма не может быть в будущем');

  const departmentId = body.departmentId;
  if (!Number.isInteger(departmentId) || departmentId < 1) {
    check.fail('departmentId', 'Укажите id отдела (целое число)');
  }

  check.throwIfFailed();
  return { firstName, lastName, position, email, hireDate: body.hireDate, departmentId };
}
