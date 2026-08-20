import { StockUnit } from '../../shared/inventoryTypes';

const UNIT_LABEL: Record<StockUnit, { one: string; many: string }> = {
  bottle: { one: 'bottle', many: 'bottles' },
  can: { one: 'can', many: 'cans' },
  keg: { one: 'keg', many: 'kegs' },
  case: { one: 'case', many: 'cases' },
  unit: { one: 'unit', many: 'units' },
};

/** API quantities arrive as decimal strings ("7.5000") — never assume
 * integers, a pour depletes a fraction of a bottle. */
export function parseQty(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : parseFloat(value);
}

export function formatQty(
  value: string | number | null | undefined,
  unit: StockUnit,
  { decimals }: { decimals?: number } = {},
): string {
  const n = parseQty(value);
  const isWhole = Number.isInteger(n);
  const label = UNIT_LABEL[unit] ?? { one: unit, many: unit };
  const shown = n.toFixed(decimals ?? (isWhole ? 0 : 2));
  return `${shown} ${n === 1 ? label.one : label.many}`;
}

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return currencyFormatter.format(n);
}

/** Sales/billing money is always integer cents ("priceCents: 380000" =
 * 3,800.00) — a different convention from the inventory module's decimal
 * costPrice. Divide by 100 only at render time; never mix the two. */
export function formatCents(cents: number | null | undefined): string {
  return currencyFormatter.format((cents ?? 0) / 100);
}

const dateFormatter = new Intl.DateTimeFormat('en-KE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-KE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return dateTimeFormatter.format(new Date(value));
}

export function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}
