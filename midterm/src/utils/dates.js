const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function today() {
  return new Date().toLocaleDateString('en-CA');
}

/** Строго YYYY-MM-DD и реально существующая дата (31 февраля — нет). */
export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const MS_PER_DAY = 86_400_000;
const utc = (isoDate) => Date.parse(`${isoDate}T00:00:00Z`);

export function daysInclusive(start, end) {
  return Math.round((utc(end) - utc(start)) / MS_PER_DAY) + 1;
}

export function formatShort(isoDate) {
  const [, month, day] = isoDate.split('-');
  return `${day}.${month}`;
}

export function addDays(isoDate, n) {
  return new Date(utc(isoDate) + n * MS_PER_DAY).toISOString().slice(0, 10);
}
