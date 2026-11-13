import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors.js';
import { parseId, queryString } from '../utils.js';
import { validateCourse } from '../validators/course.js';
import { STATUSES } from '../validators/enrollment.js';
import * as courses from '../repositories/courses.js';
import * as enrollments from '../repositories/enrollments.js';

export const coursesRouter = Router();

async function getOr404(id) {
  const course = await courses.findById(id);
  if (!course) throw new NotFoundError('Курс не найден');
  return course;
}

coursesRouter.get('/', asyncHandler(async (req, res) => {
  const items = await courses.list();
  res.json({ items, total: items.length });
}));

coursesRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await getOr404(parseId(req.params.id)));
}));

// Связанные данные: кто записан на курс
coursesRouter.get('/:id/enrollments', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  const status = queryString(req.query, 'status');
  if (status !== undefined && !STATUSES.includes(status)) {
    throw new BadRequestError(`status: ${STATUSES.join(' | ')}`);
  }
  const items = await enrollments.list({ courseId: id, status });
  res.json({ items, total: items.length });
}));

coursesRouter.post('/', asyncHandler(async (req, res) => {
  const data = validateCourse(req.body);
  const course = await courses.insert(data);
  res.status(201).location(`/api/courses/${course.id}`).json(course);
}));

coursesRouter.put('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = validateCourse(req.body);
  await getOr404(id);
  res.json(await courses.update(id, data));
}));

coursesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  const count = await courses.countEnrollments(id);
  if (count > 0) throw new ConflictError(`На курс есть записи: ${count}`);
  await courses.remove(id);
  res.status(204).end();
}));
