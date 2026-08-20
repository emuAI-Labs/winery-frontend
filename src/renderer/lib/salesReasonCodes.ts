/** No server-side enum for these reason codes either (same gap as inventory
 * losses) — keeping a small, fixed frontend vocabulary is what makes later
 * reporting on "why was this voided" meaningful. */
export const VOID_LINE_REASONS = [
  { value: 'guest_changed_mind', label: 'Guest changed their mind' },
  { value: 'kitchen_error', label: 'Kitchen/bar error' },
  { value: 'made_wrong_drink', label: 'Made wrong drink' },
  { value: 'guest_complaint', label: 'Guest complaint' },
  { value: 'other', label: 'Other (see notes)' },
];

export const VOID_PAYMENT_REASONS = [
  { value: 'wrong_amount_entered', label: 'Wrong amount entered' },
  { value: 'wrong_method_entered', label: 'Wrong payment method entered' },
  { value: 'duplicate_payment', label: 'Duplicate payment' },
  { value: 'other', label: 'Other (see notes)' },
];

export const DISCOUNT_REASONS = [
  { value: 'loyal_customer', label: 'Loyal customer' },
  { value: 'price_match', label: 'Price match' },
  { value: 'manager_comp', label: 'Manager comp' },
  { value: 'staff_drink', label: 'Staff drink' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'other', label: 'Other (see notes)' },
];
