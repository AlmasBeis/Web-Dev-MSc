import { Check, ensureObjectBody } from './common.js';

export function validateDepartment(body) {
  ensureObjectBody(body);
  const check = new Check();
  const name = check.string(body, 'name', { min: 2, max: 100, message: 'Название: 2–100 символов' });
  check.throwIfFailed();
  return { name };
}
