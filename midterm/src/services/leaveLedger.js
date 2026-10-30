import { daysInclusive, formatShort } from '../utils/dates.js';

export const ACCRUAL_PER_MONTH = 2;

export const LEDGER_TYPES = ['CARRY_OVER', 'ACCRUAL', 'USAGE'];

const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * @param {{hireDate: string, carryOverDays: number}} employee
 * @param {Array<{id: number, type: string, status: string, startDate: string, endDate: string}>} requests
 *   заявки этого сотрудника
 * @param {string} today YYYY-MM-DD
 * @returns {{entries: object[], balance: object}} entries — от старых к новым
 */
export function buildLedger(employee, requests, today) {
  const year = Number(today.slice(0, 4));
  const entries = [];

  entries.push({
    date: `${year}-01-01`,
    type: 'CARRY_OVER',
    days: employee.carryOverDays,
    title: `Перенос остатка с ${year - 1} года`,
    requestId: null,
  });

  // Начисляем с месяца приёма (сравнение строк YYYY-MM-DD корректно).
  const firstHireMonth = `${employee.hireDate.slice(0, 7)}-01`;
  for (let month = 1; month <= 12; month += 1) {
    const date = `${year}-${pad2(month)}-01`;
    if (date > today || date < firstHireMonth) continue;
    entries.push({
      date,
      type: 'ACCRUAL',
      days: ACCRUAL_PER_MONTH,
      title: `Начисление за ${MONTH_NAMES[month - 1]}`,
      requestId: null,
    });
  }

  const annual = requests.filter((r) => r.type === 'ANNUAL');
  const approved = annual.filter((r) => r.status === 'APPROVED');
  for (const r of approved) {
    entries.push({
      date: r.startDate,
      type: 'USAGE',
      days: -daysInclusive(r.startDate, r.endDate),
      title: `Отпуск ${formatShort(r.startDate)}–${formatShort(r.endDate)} (заявка №${r.id})`,
      requestId: r.id,
    });
  }

  let running = 0;
  const sorted = entries
    .sort((a, b) => a.date.localeCompare(b.date)
      || LEDGER_TYPES.indexOf(a.type) - LEDGER_TYPES.indexOf(b.type))
    .map((entry) => {
      running += entry.days;
      return { ...entry, balanceAfter: running };
    });

  const sumDays = (list) => list.reduce((sum, r) => sum + daysInclusive(r.startDate, r.endDate), 0);
  const accrued = employee.carryOverDays
    + sorted.filter((e) => e.type === 'ACCRUAL').reduce((sum, e) => sum + e.days, 0);
  const used = sumDays(approved);
  const reserved = sumDays(annual.filter((r) => r.status === 'PENDING'));

  return {
    entries: sorted,
    balance: { year, accrued, used, reserved, available: accrued - used - reserved },
  };
}
