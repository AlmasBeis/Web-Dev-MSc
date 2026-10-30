import { Router } from 'express';
import { BadRequestError } from '../errors.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as employees from '../services/employees.js';
import * as employeeLeave from '../services/employeeLeave.js';

export const employeesRouter = Router();

employeesRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await employees.list(req.query));
}));

employeesRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await employees.get(req.params.id));
}));

employeesRouter.get('/:id/leave-balance', asyncHandler(async (req, res) => {
  res.json(await employeeLeave.getBalance(req.params.id));
}));

employeesRouter.get('/:id/leave-ledger', asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (type !== undefined && typeof type !== 'string') {
    throw new BadRequestError('Параметр type указан несколько раз');
  }
  res.json(await employeeLeave.getLedger(req.params.id, type));
}));

employeesRouter.post('/', asyncHandler(async (req, res) => {
  const employee = await employees.create(req.body);
  res.status(201).location(`/api/employees/${employee.id}`).json(employee);
}));

employeesRouter.put('/:id', asyncHandler(async (req, res) => {
  res.json(await employees.update(req.params.id, req.body));
}));

employeesRouter.delete('/:id', asyncHandler(async (req, res) => {
  await employees.remove(req.params.id);
  res.status(204).end();
}));
