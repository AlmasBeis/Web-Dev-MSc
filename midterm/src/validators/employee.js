import { Check, ensureObjectBody } from './common.js';
import { isValidIsoDate } from '../utils/dates.js';

export const LANGUAGE_LEVELS = ['родной', 'свободно', 'базовый', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MAX_LANGUAGES = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+7\d{10}$/;

function readMiddleName(check, body) {
  const value = body.middleName ?? null;
  if (value === null) return null;
  if (typeof value !== 'string' || value.trim().length > 50) {
    check.fail('middleName', 'Не больше 50 символов');
    return undefined;
  }
  return value.trim() === '' ? null : value.trim();
}

function readEmail(check, body) {
  const value = typeof body.email === 'string' ? body.email.trim() : '';
  if (value.length > 254 || !EMAIL.test(value)) {
    check.fail('email', 'Некорректный email');
    return undefined;
  }
  return value;
}

function readPhone(check, body) {
  const value = typeof body.phone === 'string' ? body.phone.trim() : '';
  // Пробелы допускаются где угодно
  if (!PHONE.test(value.replace(/\s/g, ''))) {
    check.fail('phone', 'Телефон в формате +7 XXX XXX XX XX');
    return undefined;
  }
  return value;
}

function readHireDate(check, body, today) {
  const value = body.hireDate;
  if (!isValidIsoDate(value)) {
    check.fail('hireDate', 'Дата приёма в формате ГГГГ-ММ-ДД');
    return undefined;
  }
  if (value > today) {
    check.fail('hireDate', 'Дата приёма не может быть в будущем');
    return undefined;
  }
  return value;
}

function readCarryOver(check, body) {
  const value = body.carryOverDays ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 60) {
    check.fail('carryOverDays', 'Перенос остатка — от 0 до 60 дней');
    return undefined;
  }
  return value;
}

function readLanguages(check, body) {
  const value = body.languages ?? [];
  if (!Array.isArray(value) || value.length > MAX_LANGUAGES) {
    check.fail('languages', `Языки — массив не длиннее ${MAX_LANGUAGES} элементов`);
    return undefined;
  }
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const language = typeof item?.language === 'string' ? item.language.trim() : '';
    if (language.length < 2 || language.length > 50) {
      check.fail('languages', 'Укажите название языка (2–50 символов)');
      return undefined;
    }
    if (!LANGUAGE_LEVELS.includes(item.level)) {
      check.fail('languages', 'Неизвестный уровень языка');
      return undefined;
    }
    if (seen.has(language.toLowerCase())) {
      check.fail('languages', 'Язык указан дважды');
      return undefined;
    }
    seen.add(language.toLowerCase());
    result.push({ language, level: item.level });
  }
  return result;
}

function readRef(check, body, field, emptyMessage) {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    check.fail(field, emptyMessage);
    return undefined;
  }
  return value.trim();
}

export function validateEmployee(body, today) {
  ensureObjectBody(body);
  const check = new Check();

  const data = {
    firstName: check.string(body, 'firstName', { max: 50, message: 'Укажите имя' }),
    lastName: check.string(body, 'lastName', { max: 50, message: 'Укажите фамилию' }),
    middleName: readMiddleName(check, body),
    position: check.string(body, 'position', { min: 2, max: 100, message: 'Укажите должность' }),
    departmentId: readRef(check, body, 'departmentId', 'Подразделение не найдено'),
    officeId: readRef(check, body, 'officeId', 'Офис не найден'),
    managerId: null,
    email: readEmail(check, body),
    phone: readPhone(check, body),
    hireDate: readHireDate(check, body, today),
    carryOverDays: readCarryOver(check, body),
    languages: readLanguages(check, body),
  };

  const manager = body.managerId ?? null;
  if (manager !== null && (typeof manager !== 'string' || manager.trim() === '')) {
    check.fail('managerId', 'Руководитель не найден');
  } else {
    data.managerId = manager === null ? null : manager.trim();
  }

  return { data, check };
}
