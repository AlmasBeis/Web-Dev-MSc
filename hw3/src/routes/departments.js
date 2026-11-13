import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ConflictError, NotFoundError } from '../errors.js';
import { parseId } from '../utils.js';
import { validateDepartment } from '../validators/department.js';
import * as departments from '../repositories/departments.js';
import * as employees from '../repositories/employees.js';

export const departmentsRouter = Router();

async function getOr404(id) {
  const department = await departments.findById(id);
  if (!department) throw new NotFoundError('Отдел не найден');
  return department;
}

departmentsRouter.get('/', asyncHandler(async (req, res) => {
  const items = await departments.list();
  res.json({ items, total: items.length });
}));

departmentsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await getOr404(parseId(req.params.id)));
}));

// Связанные данные: сотрудники отдела
departmentsRouter.get('/:id/employees', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  const items = await employees.list({ departmentId: id });
  res.json({ items, total: items.length });
}));

departmentsRouter.post('/', asyncHandler(async (req, res) => {
  const department = await departments.insert(validateDepartment(req.body));
  res.status(201).location(`/api/departments/${department.id}`).json(department);
}));

departmentsRouter.put('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = validateDepartment(req.body);
  await getOr404(id);
  res.json(await departments.update(id, data));
}));

departmentsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  const count = await departments.countEmployees(id);
  if (count > 0) throw new ConflictError(`В отделе есть сотрудники: ${count}`);
  await departments.remove(id);
  res.status(204).end();
}));
