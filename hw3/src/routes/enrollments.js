import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from '../errors.js';
import { parseId, queryString } from '../utils.js';
import {
  STATUSES,
  validateEnrollmentCreate,
  validateEnrollmentPatch,
} from '../validators/enrollment.js';
import * as enrollments from '../repositories/enrollments.js';
import * as employees from '../repositories/employees.js';
import * as courses from '../repositories/courses.js';

export const enrollmentsRouter = Router();

async function getOr404(id) {
  const enrollment = await enrollments.findById(id);
  if (!enrollment) throw new NotFoundError('Запись не найдена');
  return enrollment;
}

enrollmentsRouter.get('/', asyncHandler(async (req, res) => {
  const filters = {};
  const status = queryString(req.query, 'status');
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new BadRequestError(`status: ${STATUSES.join(' | ')}`);
    filters.status = status;
  }
  const employeeId = queryString(req.query, 'employeeId');
  if (employeeId !== undefined) filters.employeeId = parseId(employeeId, 'employeeId');
  const courseId = queryString(req.query, 'courseId');
  if (courseId !== undefined) filters.courseId = parseId(courseId, 'courseId');
  const items = await enrollments.list(filters);
  res.json({ items, total: items.length });
}));

enrollmentsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await getOr404(parseId(req.params.id)));
}));

enrollmentsRouter.post('/', asyncHandler(async (req, res) => {
  const data = validateEnrollmentCreate(req.body);
  const errors = {};
  if (!(await employees.findById(data.employeeId))) errors.employeeId = 'Сотрудник не найден';
  if (!(await courses.findById(data.courseId))) errors.courseId = 'Курс не найден';
  if (Object.keys(errors).length) throw new ValidationError(errors);
  if (await enrollments.findPair(data.employeeId, data.courseId)) {
    throw new ConflictError('Сотрудник уже записан на этот курс');
  }
  const enrollment = await enrollments.insert(data);
  res.status(201).location(`/api/enrollments/${enrollment.id}`).json(enrollment);
}));

enrollmentsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const patch = validateEnrollmentPatch(req.body);
  const current = await getOr404(id);

  const status = patch.status ?? current.status;
  if (current.status !== 'ENROLLED' && status !== current.status) {
    throw new ConflictError(`Запись уже в статусе ${current.status}, статус менять нельзя`);
  }
  let score = patch.score ?? current.score;
  if (status !== 'COMPLETED') {
    if (patch.score !== undefined) {
      throw new ValidationError({ score: 'Оценку можно поставить только при статусе COMPLETED' });
    }
    score = null;
  }
  res.json(await enrollments.update(id, { status, score }));
}));

enrollmentsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await getOr404(id);
  await enrollments.remove(id);
  res.status(204).end();
}));
