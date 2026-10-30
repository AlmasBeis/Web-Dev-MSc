import { Router } from 'express';
import { BadRequestError } from '../errors.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as leaveRequests from '../services/leaveRequests.js';

export const leaveRequestsRouter = Router();

// id заявки serial (int4): всё, что не целое число в этом диапазоне, это 400, а не «не найдено».
leaveRequestsRouter.param('id', (req, res, next, value) => {
  const id = Number(value);
  if (!/^\d+$/.test(value) || id < 1 || id > 2_147_483_647) {
    return next(new BadRequestError('Некорректный id заявки'));
  }
  req.params.id = id;
  next();
});

leaveRequestsRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await leaveRequests.list(req.query));
}));

leaveRequestsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await leaveRequests.get(req.params.id));
}));

leaveRequestsRouter.post('/', asyncHandler(async (req, res) => {
  const request = await leaveRequests.create(req.body);
  res.status(201).location(`/api/leave-requests/${request.id}`).json(request);
}));

leaveRequestsRouter.put('/:id', asyncHandler(async (req, res) => {
  res.json(await leaveRequests.update(req.params.id, req.body));
}));

leaveRequestsRouter.delete('/:id', asyncHandler(async (req, res) => {
  await leaveRequests.remove(req.params.id);
  res.status(204).end();
}));

leaveRequestsRouter.post('/:id/approve', asyncHandler(async (req, res) => {
  res.json(await leaveRequests.approve(req.params.id, req.body));
}));

leaveRequestsRouter.post('/:id/reject', asyncHandler(async (req, res) => {
  res.json(await leaveRequests.reject(req.params.id, req.body));
}));

leaveRequestsRouter.post('/:id/cancel', asyncHandler(async (req, res) => {
  res.json(await leaveRequests.cancel(req.params.id));
}));
