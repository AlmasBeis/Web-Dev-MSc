import * as leaveRequests from '../repositories/leaveRequests.js';
import * as employees from '../repositories/employees.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors.js';
import {
  LEAVE_STATUSES,
  LEAVE_TYPES,
  parseDecisionBody,
  parseLeaveRequestBody,
  validateLeaveRules,
} from '../validators/leaveRequest.js';
import { buildLedger } from './leaveLedger.js';
import { daysInclusive, today } from '../utils/dates.js';

const withDays = (request) => ({
  ...request,
  days: daysInclusive(request.startDate, request.endDate),
});

function oneOf(query, name, allowed) {
  const value = query[name];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new BadRequestError(`Параметр ${name} должен быть одним из: ${allowed.join(', ')}`);
  }
  return value;
}

function text(query, name) {
  const value = query[name];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') throw new BadRequestError(`Параметр ${name} указан несколько раз`);
  return value.trim();
}

export async function list(query) {
  const items = await leaveRequests.list({
    employeeId: text(query, 'employeeId'),
    approverId: text(query, 'approverId'),
    status: oneOf(query, 'status', LEAVE_STATUSES),
    type: oneOf(query, 'type', LEAVE_TYPES),
  });
  return { items: items.map(withDays), total: items.length };
}

export async function get(id) {
  const request = await leaveRequests.findById(id);
  if (!request) throw new NotFoundError('Заявка не найдена');
  return withDays(request);
}

async function prepare(body, employeeId, excludeId = null) {
  const { data, check } = parseLeaveRequestBody(body);

  const employee = await employees.findById(employeeId);
  if (!employee) {
    check.fail('employeeId', 'Сотрудник не найден');
  } else if (!employee.managerId) {
    check.fail('employeeId', 'У сотрудника нет руководителя — отпуск оформляется через HR-отдел');
  }

  if (data.substituteId && !check.errors.substituteId) {
    if (data.substituteId === employeeId) {
      check.fail('substituteId', 'Нельзя назначить заместителем себя');
    } else if (!(await employees.exists(data.substituteId))) {
      check.fail('substituteId', 'Заместитель не найден');
    }
  }

  if (employee) {
    const others = (await leaveRequests.findByEmployee(employeeId)).filter((r) => r.id !== excludeId);
    const now = today();
    const { balance } = buildLedger(employee, others, now);
    const rules = validateLeaveRules(data, { today: now, available: balance.available, ownRequests: others });
    for (const [field, message] of Object.entries(rules)) check.fail(field, message);
  }

  check.throwIfFailed();
  return { data, approverId: employee.managerId };
}

export async function create(body) {
  const employeeId = typeof body?.employeeId === 'string' ? body.employeeId.trim() : '';
  const { data, approverId } = await prepare(body, employeeId);
  const created = await leaveRequests.insert({
    ...data, employeeId, approverId, createdAt: today(),
  });
  return withDays(created);
}

export async function update(id, body) {
  const existing = await get(id);
  assertPending(existing);
  const { data } = await prepare(body, existing.employeeId, existing.id);
  return withDays(await leaveRequests.update(id, data));
}

export async function remove(id) {
  const existing = await get(id);
  if (existing.status === 'APPROVED') {
    throw new ConflictError('Согласованную заявку нельзя удалить');
  }
  await leaveRequests.remove(id);
}

export function assertPending(request) {
  if (request.status !== 'PENDING') {
    throw new ConflictError(`Заявка уже не на согласовании (статус: ${request.status})`);
  }
}

async function decide(id, status, details) {
  const changed = await leaveRequests.transitionFromPending(id, status, details);
  if (changed) return withDays(changed);

  assertPending(await get(id));
  throw new ConflictError('Не удалось изменить статус заявки, повторите запрос');
}

export function approve(id, body) {
  const decisionComment = parseDecisionBody(body, { field: 'comment', required: false });
  return decide(id, 'APPROVED', { decidedAt: today(), decisionComment });
}

export function reject(id, body) {
  const decisionComment = parseDecisionBody(body, { field: 'reason', required: true });
  return decide(id, 'REJECTED', { decidedAt: today(), decisionComment });
}

/** Отзыв сотрудником: как в мобилке, decidedAt не ставится — решения руководителя не было. */
export function cancel(id) {
  return decide(id, 'CANCELLED');
}
