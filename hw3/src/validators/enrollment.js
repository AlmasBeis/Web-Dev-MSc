import { Check, ensureObjectBody } from './common.js';

export const STATUSES = ['ENROLLED', 'COMPLETED', 'DROPPED'];

const isId = (v) => Number.isInteger(v) && v >= 1;

export function validateEnrollmentCreate(body) {
  ensureObjectBody(body);
  const check = new Check();
  if (!isId(body.employeeId)) check.fail('employeeId', 'Укажите id сотрудника (целое число)');
  if (!isId(body.courseId)) check.fail('courseId', 'Укажите id курса (целое число)');
  check.throwIfFailed();
  return { employeeId: body.employeeId, courseId: body.courseId };
}

export function validateEnrollmentPatch(body) {
  ensureObjectBody(body);
  const check = new Check();
  const { status, score } = body;
  if (status === undefined && score === undefined) {
    check.fail('body', 'Передайте status и/или score');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    check.fail('status', `status: ${STATUSES.join(' | ')}`);
  }
  if (score !== undefined && (!Number.isInteger(score) || score < 0 || score > 100)) {
    check.fail('score', 'Оценка — целое число от 0 до 100');
  }
  check.throwIfFailed();
  return { status, score };
}
