import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError, NotFoundError, ValidationError } from '../errors.js';
import { parseId, queryString } from '../utils.js';
import { validateEmployee } from '../validators/employee.js';
import { STATUSES } from '../validators/enrollment.js';
import * as employees from '../repositories/employees.js';
import * as departments from '../repositories/departments.js';
import * as enrollments from '../repositories/enrollments.js';

export const employeesRouter = Router();

async function getOr404(id) {
  const employee = await employees.findById(id);
  if (!employee) throw new NotFoundError('Сотрудник не найден');
  return employee;
}

async function ensureDepartment(departmentId) {
  if (!(await departments.findById(departmentId))) {
    throw new ValidationError({ departmentId: 'Отдел не найден' });
  }
}

employeesRouter.get('/', asyncHandler(async (req, res) => {
  const departmentId = queryString(req.query, 'departmentId');
  const filters = { q: queryString(req.query, 'q')?.trim() };
  if (departmentId !== undefined) filters.departmentId = parseId(departmentId, 'departmentId');
  const items = await employees.list(filters);
  res.json({ items, total: items.length });
}));

employeesRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await getOr404(parseId(req.params.id)));
}));

// Связанные данные: обучение сотрудника
employeesRouter.get('/:id/enrollments', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  const status = queryString(req.query, 'status');
  if (status !== undefined && !STATUSES.includes(status)) {
    throw new BadRequestError(`status: ${STATUSES.join(' | ')}`);
  }
  const items = await enrollments.list({ employeeId: id, status });
  res.json({ items, total: items.length });
}));

employeesRouter.post('/', asyncHandler(async (req, res) => {
  const data = validateEmployee(req.body);
  await ensureDepartment(data.departmentId);
  const employee = await employees.insert(data);
  res.status(201).location(`/api/employees/${employee.id}`).json(employee);
}));

employeesRouter.put('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = validateEmployee(req.body);
  await getOr404(id);
  await ensureDepartment(data.departmentId);
  res.json(await employees.update(id, data));
}));

employeesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  await employees.remove(id); // записи на обучение удаляются каскадом
  res.status(204).end();
}));
