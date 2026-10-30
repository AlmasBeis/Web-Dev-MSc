import { Check, ensureObjectBody } from './common.js';

const DEPARTMENT_ID = /^[a-z][a-z0-9-]{1,19}$/;

function readParentId(check, body) {
  const value = body.parentId ?? null;
  if (value !== null && (typeof value !== 'string' || value.trim() === '')) {
    check.fail('parentId', 'Родительское подразделение не найдено');
    return undefined;
  }
  return value === null ? null : value.trim();
}

export function validateDepartmentCreate(body) {
  ensureObjectBody(body);
  const check = new Check();
  const id = check.pattern(
    body,
    'id',
    DEPARTMENT_ID,
    'Код подразделения: латиница в нижнем регистре, 2–20 символов',
  );
  const name = check.string(body, 'name', { min: 2, max: 100, message: 'Укажите название' });
  const parentId = readParentId(check, body);
  check.throwIfFailed();
  return { id, name, parentId };
}

export function validateDepartmentUpdate(body) {
  ensureObjectBody(body);
  const check = new Check();
  const name = check.string(body, 'name', { min: 2, max: 100, message: 'Укажите название' });
  const parentId = readParentId(check, body);
  check.throwIfFailed();
  return { name, parentId };
}
