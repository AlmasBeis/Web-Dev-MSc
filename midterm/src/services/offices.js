import * as offices from '../repositories/offices.js';
import { ConflictError, NotFoundError } from '../errors.js';
import { validateOfficeCreate, validateOfficeUpdate } from '../validators/office.js';

export async function list() {
  const items = await offices.list();
  return { items, total: items.length };
}

export async function get(id) {
  const office = await offices.findById(id);
  if (!office) throw new NotFoundError('Офис не найден');
  return office;
}

export async function create(body) {
  const data = validateOfficeCreate(body);
  if (await offices.findById(data.id)) {
    throw new ConflictError(`Офис с кодом ${data.id} уже существует`);
  }
  return offices.insert(data);
}

export async function update(id, body) {
  const data = validateOfficeUpdate(body);
  const office = await offices.update(id, data);
  if (!office) throw new NotFoundError('Офис не найден');
  return office;
}

export async function remove(id) {
  await get(id);
  const employees = await offices.countEmployees(id);
  if (employees > 0) {
    throw new ConflictError(`В офисе есть сотрудники: ${employees}`);
  }
  await offices.remove(id);
}
