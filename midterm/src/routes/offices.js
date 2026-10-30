import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as offices from '../services/offices.js';

export const officesRouter = Router();

officesRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await offices.list());
}));

officesRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await offices.get(req.params.id));
}));

officesRouter.post('/', asyncHandler(async (req, res) => {
  const office = await offices.create(req.body);
  res.status(201).location(`/api/offices/${office.id}`).json(office);
}));

officesRouter.put('/:id', asyncHandler(async (req, res) => {
  res.json(await offices.update(req.params.id, req.body));
}));

officesRouter.delete('/:id', asyncHandler(async (req, res) => {
  await offices.remove(req.params.id);
  res.status(204).end();
}));
