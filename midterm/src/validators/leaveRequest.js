import { Check, ensureObjectBody } from './common.js';
import { addDays, daysInclusive, formatShort, isValidIsoDate } from '../utils/dates.js';

export const LEAVE_TYPES = ['ANNUAL', 'UNPAID'];
export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
export const MAX_UNPAID_DAYS = 30;
export const MAX_COMMENT_LENGTH = 300;


export function parseLeaveRequestBody(body) {
  ensureObjectBody(body);
  const check = new Check();

  const type = LEAVE_TYPES.includes(body.type) ? body.type : undefined;
  if (!type) check.fail('type', 'Тип отпуска: ANNUAL или UNPAID');

  const startDate = isValidIsoDate(body.startDate) ? body.startDate : undefined;
  if (!startDate) check.fail('startDate', 'Выберите дату начала');
  const endDate = isValidIsoDate(body.endDate) ? body.endDate : undefined;
  if (!endDate) check.fail('endDate', 'Выберите дату окончания');

  let comment = '';
  if (body.comment !== undefined && body.comment !== null) {
    if (typeof body.comment === 'string') comment = body.comment.trim();
    else check.fail('comment', 'Комментарий должен быть строкой');
  }

  let substituteId = null;
  if (body.substituteId !== undefined && body.substituteId !== null) {
    if (typeof body.substituteId === 'string' && body.substituteId.trim() !== '') {
      substituteId = body.substituteId.trim();
    } else {
      check.fail('substituteId', 'Заместитель не найден');
    }
  }

  return { check, data: { type, startDate, endDate, substituteId, comment } };
}

function findOverlap(start, end, requests) {
  return requests
    .filter((r) => r.status === 'PENDING' || r.status === 'APPROVED')
    .find((r) => end >= r.startDate && start <= r.endDate);
}

/**
 * Бизнес-правила заявки — порт LeaveRequestValidator из мобильного приложения.
 * Чистая функция: все данные приходят в ctx.
 *
 * @param {{type?: string, startDate?: string, endDate?: string, comment: string}} input
 * @param {{today: string, available: number, ownRequests: object[]}} ctx
 *   ownRequests — другие заявки сотрудника (при редактировании без самой редактируемой)
 * @returns {Record<string, string>} ошибки по полям: startDate, endDate, period, comment
 */
export function validateLeaveRules(input, ctx) {
  const errors = {};
  const { type, startDate, endDate, comment } = input;

  if (!startDate) {
    errors.startDate = 'Выберите дату начала';
  } else if (startDate < addDays(ctx.today, 1)) {
    errors.startDate = 'Отпуск можно оформить начиная с завтрашнего дня';
  }

  if (!endDate) {
    errors.endDate = 'Выберите дату окончания';
  } else if (startDate && endDate < startDate) {
    errors.endDate = 'Дата окончания раньше даты начала';
  }

  if (type && startDate && endDate && endDate >= startDate) {
    const days = daysInclusive(startDate, endDate);
    const overlap = findOverlap(startDate, endDate, ctx.ownRequests);
    if (type === 'ANNUAL' && days > ctx.available) {
      errors.period = `Недостаточно дней: доступно ${ctx.available}, запрошено ${days}`;
    } else if (type === 'UNPAID' && days > MAX_UNPAID_DAYS) {
      errors.period = `Отпуск без сохранения з/п не больше ${MAX_UNPAID_DAYS} дней`;
    } else if (overlap) {
      errors.period = `Пересекается с заявкой ${formatShort(overlap.startDate)}–${formatShort(overlap.endDate)}`;
    }
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    errors.comment = `Не больше ${MAX_COMMENT_LENGTH} символов`;
  } else if (type === 'UNPAID' && comment === '') {
    errors.comment = 'Укажите причину';
  }
  return errors;
}

export function parseDecisionBody(body, { field, required }) {
  ensureObjectBody(body);
  const check = new Check();
  const raw = body[field];
  let text = null;

  if (raw !== undefined && raw !== null) {
    if (typeof raw !== 'string') {
      check.fail(field, required ? 'Причина отклонения обязательна' : 'Комментарий должен быть строкой');
    } else {
      text = raw.trim() === '' ? null : raw.trim();
    }
  }
  if (text === null && required) check.fail(field, 'Причина отклонения обязательна');
  if (text !== null && text.length > MAX_COMMENT_LENGTH) {
    check.fail(field, `Не больше ${MAX_COMMENT_LENGTH} символов`);
  }
  check.throwIfFailed();
  return text;
}
