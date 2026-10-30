import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as departments from '../services/departments.js';

export const departmentsRouter = Router();

departmentsRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await departments.list());
}));

departmentsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await departments.get(req.params.id));
}));

departmentsRouter.post('/', asyncHandler(async (req, res) => {
  const department = await departments.create(req.body);
  res.status(201).location(`/api/departments/${department.id}`).json(department);
}));

departmentsRouter.put('/:id', asyncHandler(async (req, res) => {
  res.json(await departments.update(req.params.id, req.body));
}));

departmentsRouter.delete('/:id', asyncHandler(async (req, res) => {
  await departments.remove(req.params.id);
  res.status(204).end();
}));
