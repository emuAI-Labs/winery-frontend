export type AssetCategory =
  | 'fridge'
  | 'cooler'
  | 'furniture'
  | 'pos_hardware'
  | 'sound_system'
  | 'other';

export type AssetStatus = 'active' | 'under_maintenance' | 'disposed';

export interface Asset {
  id: string;
  branchId: string;
  name: string;
  category: AssetCategory;
  serialNumber?: string | null;
  location?: string | null;
  purchaseValueCents: number;
  purchaseDate: string;
  usefulLifeMonths: number;
  salvageValueCents: number;
  status: AssetStatus;
  notes?: string | null;
  /** server-computed straight-line depreciation, not stored */
  currentValueCents: number;
  createdAt: string;
}

export type ReusableAssetCategory =
  | 'glassware'
  | 'keg'
  | 'crate'
  | 'tool'
  | 'other';

export interface ReusableAssetType {
  id: string;
  name: string;
  category: ReusableAssetCategory;
  unitValueCents: number;
  isActive: boolean;
  /** only present when the list was fetched with a branchId filter */
  branchStock?: { branchId: string; quantityOnHand: number } | null;
}

export type ReusableAssetMovementType =
  | 'acquired'
  | 'lost'
  | 'broken'
  | 'returned_from_supplier'
  | 'count_adjustment';

export interface ReusableAssetMovement {
  id: string;
  assetTypeId: string;
  branchId: string;
  type: ReusableAssetMovementType;
  quantity: number;
  reasonCode?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface AssetLossRateRow {
  assetTypeId: string;
  name: string;
  unitValueCents: number;
  acquired: number;
  lost: number;
  broken: number;
  lossRatePercent: number;
  valueLostCents: number;
}

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  title: string;
  intervalDays: number;
  nextDueDate: string;
  isActive: boolean;
}

export interface MaintenanceLog {
  id: string;
  scheduleId?: string | null;
  assetId: string;
  performedAt: string;
  costCents?: number | null;
  notes?: string | null;
}
