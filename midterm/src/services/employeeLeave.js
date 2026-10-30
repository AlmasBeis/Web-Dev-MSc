import * as employees from '../repositories/employees.js';
import * as leaveRequests from '../repositories/leaveRequests.js';
import { BadRequestError, NotFoundError } from '../errors.js';
import { buildLedger, LEDGER_TYPES } from './leaveLedger.js';
import { today } from '../utils/dates.js';

async function calculate(employeeId) {
  const employee = await employees.findById(employeeId);
  if (!employee) throw new NotFoundError('Сотрудник не найден');
  const requests = await leaveRequests.findByEmployee(employeeId);
  return buildLedger(employee, requests, today());
}

export async function getBalance(employeeId) {
  const { balance } = await calculate(employeeId);
  return { employeeId, ...balance };
}

export async function getLedger(employeeId, type) {
  if (type !== undefined && !LEDGER_TYPES.includes(type)) {
    throw new BadRequestError(`Параметр type должен быть одним из: ${LEDGER_TYPES.join(', ')}`);
  }
  const { entries } = await calculate(employeeId);
  const items = entries
    .filter((entry) => type === undefined || entry.type === type)
    .reverse()
    .map((entry) => ({ employeeId, ...entry }));
  return { items, total: items.length };
}
