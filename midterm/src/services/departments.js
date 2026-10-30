import * as departments from '../repositories/departments.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';
import {
  validateDepartmentCreate,
  validateDepartmentUpdate,
} from '../validators/department.js';

async function checkParent(id, parentId) {
  if (parentId === null) return;
  if (parentId === id) {
    throw new ValidationError({
      parentId: 'Подразделение не может быть вложено само в себя',
    });
  }
  if (!(await departments.findById(parentId))) {
    throw new ValidationError({ parentId: 'Родительское подразделение не найдено' });
  }
  if (await departments.isAncestorOrSelf(id, parentId)) {
    throw new ValidationError({
      parentId: 'Подразделение не может быть вложено в своё дочернее',
    });
  }
}

export async function list() {
  const items = await departments.list();
  return { items, total: items.length };
}

export async function get(id) {
  const department = await departments.findById(id);
  if (!department) throw new NotFoundError('Подразделение не найдено');
  return department;
}

export async function create(body) {
  const data = validateDepartmentCreate(body);
  if (await departments.findById(data.id)) {
    throw new ConflictError(`Подразделение с кодом ${data.id} уже существует`);
  }
  await checkParent(data.id, data.parentId);
  return departments.insert(data);
}

export async function update(id, body) {
  const data = validateDepartmentUpdate(body);
  await get(id);
  await checkParent(id, data.parentId);
  return departments.update(id, data);
}

export async function remove(id) {
  await get(id);
  const children = await departments.countChildren(id);
  if (children > 0) {
    throw new ConflictError(`У подразделения есть дочерние подразделения: ${children}`);
  }
  const employees = await departments.countEmployees(id);
  if (employees > 0) {
    throw new ConflictError(`В подразделении есть сотрудники: ${employees}`);
  }
  await departments.remove(id);
}
