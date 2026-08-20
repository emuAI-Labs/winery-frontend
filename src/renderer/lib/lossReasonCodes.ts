import { LossType } from '../../shared/inventoryTypes';

/** No server-side enum for reason codes — this frontend-owned list keeps the
 * vocabulary consistent so filtering/reporting on it later is meaningful. */
export const LOSS_REASON_CODES: Record<
  LossType,
  { value: string; label: string }[]
> = {
  breakage: [
    { value: 'dropped', label: 'Dropped' },
    { value: 'glass_shattered', label: 'Glass shattered' },
    { value: 'staff_accident', label: 'Staff accident' },
    { value: 'transport_damage', label: 'Damaged in transport' },
  ],
  spoilage: [
    { value: 'past_expiry', label: 'Past expiry date' },
    { value: 'temperature_failure', label: 'Temperature failure' },
    { value: 'contaminated', label: 'Contaminated' },
  ],
  flat_beer: [
    { value: 'keg_flat', label: 'Keg gone flat' },
    { value: 'bottle_flat', label: 'Bottle gone flat' },
    { value: 'line_fault', label: 'Line/tap fault' },
  ],
  return_to_supplier: [
    { value: 'damaged_on_delivery', label: 'Damaged on delivery' },
    { value: 'wrong_item', label: 'Wrong item delivered' },
    { value: 'quality_issue', label: 'Quality issue' },
  ],
  waste: [
    { value: 'over_pour_waste', label: 'Over-pour / spillage' },
    { value: 'unsellable', label: 'Unsellable' },
  ],
  other: [{ value: 'other', label: 'Other (see notes)' }],
};

export const LOSS_TYPE_LABEL: Record<LossType, string> = {
  breakage: 'Breakage',
  spoilage: 'Spoilage',
  flat_beer: 'Flat beer',
  return_to_supplier: 'Return to supplier',
  waste: 'Waste',
  other: 'Other',
};
