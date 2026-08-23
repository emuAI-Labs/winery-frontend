export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  itemId: string | null;
  recipeId: string | null;
  priceCents: number;
  isActive: boolean;
}

export type PricingRuleType = 'happy_hour' | 'quantity_discount';

export interface PricingRule {
  id: string;
  menuItemId: string;
  type: PricingRuleType;
  startTime?: string | null;
  endTime?: string | null;
  daysOfWeek?: number[] | null;
  discountPercent: number;
  minQuantity?: number | null;
  isActive: boolean;
}

export type OrderType = 'dine_in' | 'bar' | 'takeaway';
export type OrderStatus = 'open' | 'held' | 'closed' | 'cancelled';
export type OrderLineStatus = 'pending' | 'sent' | 'served' | 'void';
export type BillStatus = 'open' | 'paid' | 'void';

export interface OrderLine {
  id: string;
  menuItemId: string;
  billId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  status: OrderLineStatus;
  appliedRuleId: string | null;
  seatLabel?: string | null;
  notes?: string | null;
  servedAt?: string | null;
  menuItem?: MenuItem;
  /** true when this line was added offline and its price is a client-side
   * estimate — corrected automatically once it syncs */
  estimated?: boolean;
}

export interface Bill {
  id: string;
  status: BillStatus;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export interface OrderSummary {
  id: string;
  branchId: string;
  status: OrderStatus;
  orderType: OrderType;
  tableLabel?: string | null;
  seatLabel?: string | null;
  guestCount?: number | null;
  createdAt: string;
}

/** The shape returned by GET /orders/:id (and only that endpoint) — every
 * other endpoint that touches an order (list, create, hold/resume/close/
 * transfer) returns OrderSummary, without lines/bills. Always re-fetch the
 * detail endpoint rather than assuming a mutation response carries them. */
export interface Order extends OrderSummary {
  lines: OrderLine[];
  bills: Bill[];
}

export type DiscountType = 'percent' | 'fixed' | 'comp';

export interface Discount {
  id: string;
  billId: string;
  orderLineId?: string | null;
  type: DiscountType;
  valuePercent?: number | null;
  valueCents?: number | null;
  reasonCode: string;
  notes?: string | null;
  amountCents: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mpesa';
export type MpesaStatus = 'pending_confirmation' | 'confirmed' | 'failed';

export interface Payment {
  id: string;
  billId: string;
  method: PaymentMethod;
  amountCents: number;
  mpesaCode?: string | null;
  mpesaStatus?: MpesaStatus | null;
  /** the API has no isVoided boolean — voided state is voidedAt being set */
  voidedAt?: string | null;
  createdAt: string;
  /** true when this payment was recorded offline and hasn't reached the
   * server yet */
  unsynced?: boolean;
}

export interface ReceiptData {
  bill: Bill;
  order: Order;
  lines: OrderLine[];
  discounts: Discount[];
  payments: Payment[];
}

export type ShiftStatus = 'open' | 'closed';

export interface Shift {
  id: string;
  branchId: string;
  userId: string;
  status: ShiftStatus;
  openingFloatCents: number;
  expectedCashCents?: number | null;
  countedCashCents?: number | null;
  varianceCents?: number | null;
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  user?: { id: string; fullName: string };
}

export type ExpenseCategory =
  | 'electricity'
  | 'water'
  | 'gas'
  | 'rent'
  | 'waste'
  | 'licence'
  | 'salaries'
  | 'maintenance'
  | 'other';

export type ExpenseStatus = 'pending' | 'paid';

export interface Expense {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  description: string;
  amountCents: number;
  dueDate: string;
  supplierName?: string | null;
  status: ExpenseStatus;
  paidDate?: string | null;
  frequency?: 'one_off' | 'recurring' | null;
  recurrenceIntervalDays?: number | null;
}

export interface ProfitabilityRow {
  menuItemId: string;
  name: string;
  priceCents: number;
  costCents: number;
  marginCents: number;
  marginPercent: number;
  quantitySold: number;
  revenueCents: number;
}

export interface ShiftVarianceRow {
  id: string;
  openedBy: string;
  varianceCents: number;
  expectedCashCents: number;
  countedCashCents: number;
}

export interface ExpenseSummaryRow {
  category: ExpenseCategory;
  totalCents: number;
  count: number;
}

export interface SalesSummary {
  totalRevenueCents: number;
  paidBillCount: number;
  orderCount: number;
  averageBillCents: number;
}

export interface TopSellerRow {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenueCents: number;
}

/** dayOfWeek here is Postgres EXTRACT(dow): 0 = Sunday .. 6 = Saturday —
 * deliberately NOT the same convention as PricingRule.daysOfWeek (ISO,
 * 1 = Monday .. 7 = Sunday). Never reuse one "day of week" util for both. */
export interface PeakHourRow {
  dayOfWeek: number;
  hour: number;
  orderCount: number;
}

export interface CustomerTrendRow {
  customerRef: string;
  visitCount: number;
  totalSpentCents: number;
  averageSpendCents: number;
}

export interface BranchSalesSummary extends SalesSummary {
  branchId: string;
  branchName: string;
}

export type ReportType =
  | 'sales_summary'
  | 'top_sellers'
  | 'peak_hours'
  | 'profitability'
  | 'shift_variance'
  | 'expense_summary'
  | 'customer_trends'
  | 'dashboard'
  | 'reconciliation';

export interface ReportDefinition {
  id: string;
  name: string;
  reportType: ReportType;
  branchId?: string | null;
  filters?: Record<string, unknown> | null;
  createdAt: string;
}

export type ReportScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export type ReportScheduleRunStatus = 'sent' | 'skipped' | 'failed' | null;

export interface ReportSchedule {
  id: string;
  reportDefinitionId: string;
  frequency: ReportScheduleFrequency;
  recipientEmails: string[];
  nextRunAt: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: ReportScheduleRunStatus;
  lastRunError: string | null;
}

export interface DepletionGapRow {
  menuItemId: string;
  name: string;
  incompleteLineCount: number;
  estimatedValueCents: number;
}

export interface StockShortfallRow {
  itemId: string;
  name: string;
  shortfallCount: number;
  totalShortfallValueCents: number;
}

export interface MarginGapRow {
  menuItemId: string;
  name: string;
  quantitySold: number;
  catalogueMarginCents: number;
  realizedMarginCents: number;
  gapCents: number;
}

export interface ReconciliationSection<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReconciliationReport {
  depletionGaps: ReconciliationSection<DepletionGapRow> & {
    lineCount: number;
    estimatedValueCents: number;
  };
  stockShortfalls: ReconciliationSection<StockShortfallRow> & {
    totalShortfallValueCents: number;
  };
  marginGaps: ReconciliationSection<MarginGapRow>;
}
