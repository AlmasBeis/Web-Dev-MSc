import { Check, ensureObjectBody } from './common.js';

const OFFICE_ID = /^[A-Z]{3}$/;

function readFields(check, body) {
  return {
    city: check.string(body, 'city', { min: 2, max: 100, message: 'Укажите город' }),
    address: check.string(body, 'address', { min: 5, max: 200, message: 'Укажите адрес' }),
  };
}

export function validateOfficeCreate(body) {
  ensureObjectBody(body);
  const check = new Check();
  const id = check.pattern(body, 'id', OFFICE_ID, 'Код офиса: 3 заглавные латинские буквы');
  const fields = readFields(check, body);
  check.throwIfFailed();
  return { id, ...fields };
}

export function validateOfficeUpdate(body) {
  ensureObjectBody(body);
  const check = new Check();
  const fields = readFields(check, body);
  check.throwIfFailed();
  return fields;
}
