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
}

export interface Bill {
  id: string;
  status: BillStatus;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export interface Order {
  id: string;
  branchId: string;
  status: OrderStatus;
  orderType: OrderType;
  tableLabel?: string | null;
  seatLabel?: string | null;
  guestCount?: number | null;
  lines: OrderLine[];
  bills: Bill[];
  createdAt: string;
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
  isVoided: boolean;
  createdAt: string;
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
  frequency?: 'recurring' | null;
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
