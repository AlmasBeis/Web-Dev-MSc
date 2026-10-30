import * as employees from '../repositories/employees.js';
import * as departments from '../repositories/departments.js';
import * as offices from '../repositories/offices.js';
import { withTransaction } from '../db/tx.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors.js';
import { validateEmployee } from '../validators/employee.js';
import { today } from '../utils/dates.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function optionalString(query, name) {
  const value = query[name];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') throw new BadRequestError(`Параметр ${name} указан несколько раз`);
  return value.trim();
}

function integerParam(query, name, { min, max, fallback }) {
  const raw = optionalString(query, name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestError(`Параметр ${name} должен быть целым числом от ${min} до ${max}`);
  }
  return value;
}

export function list(query) {
  const filters = {
    q: optionalString(query, 'q'),
    departmentId: optionalString(query, 'departmentId'),
    officeId: optionalString(query, 'officeId'),
    managerId: optionalString(query, 'managerId'),
  };
  const paging = {
    limit: integerParam(query, 'limit', { min: 1, max: MAX_LIMIT, fallback: DEFAULT_LIMIT }),
    offset: integerParam(query, 'offset', { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
  };
  return employees.list(filters, paging);
}

export async function get(id) {
  const employee = await employees.findById(id);
  if (!employee) throw new NotFoundError('Сотрудник не найден');
  return employee;
}

async function prepare(body, id) {
  const { data, check } = validateEmployee(body, today());

  if (data.departmentId && !check.errors.departmentId
    && !(await departments.findById(data.departmentId))) {
    check.fail('departmentId', 'Подразделение не найдено');
  }
  if (data.officeId && !check.errors.officeId && !(await offices.findById(data.officeId))) {
    check.fail('officeId', 'Офис не найден');
  }
  if (data.managerId && !check.errors.managerId) {
    if (data.managerId === id) {
      check.fail('managerId', 'Сотрудник не может быть руководителем сам себе');
    } else if (!(await employees.exists(data.managerId))) {
      check.fail('managerId', 'Руководитель не найден');
    } else if (id && (await employees.managerChainContains(data.managerId, id))) {
      check.fail('managerId', 'Цикл в подчинении: этот руководитель сам подчиняется сотруднику');
    }
  }
  check.throwIfFailed();

  if (await employees.emailTaken(data.email, id)) {
    throw new ConflictError('Сотрудник с таким email уже есть');
  }
  return data;
}

export async function create(body) {
  const data = await prepare(body, null);
  const id = await withTransaction((client) => employees.insert(client, data));
  return get(id);
}

export async function update(id, body) {
  if (!(await employees.exists(id))) throw new NotFoundError('Сотрудник не найден');
  const data = await prepare(body, id);
  await withTransaction((client) => employees.update(client, id, data));
  return get(id);
}

export async function remove(id) {
  await get(id);
  const subordinates = await employees.countSubordinates(id);
  if (subordinates > 0) {
    throw new ConflictError(`У сотрудника есть подчинённые: ${subordinates}`);
  }
  const approvals = await employees.countApprovals(id);
  if (approvals > 0) {
    throw new ConflictError(`Сотрудник назначен согласующим в заявках на отпуск: ${approvals}`);
  }
  await employees.remove(id);
}
