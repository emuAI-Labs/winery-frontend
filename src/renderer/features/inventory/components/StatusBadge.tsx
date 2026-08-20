import { Badge } from '@/components/ui/badge';
import {
  RequisitionStatus,
  StockCountStatus,
  TransferStatus,
} from '../../../../shared/inventoryTypes';

const TRANSFER_VARIANT: Record<
  TransferStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  requested: 'warning',
  approved: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
};

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  return (
    <Badge variant={TRANSFER_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}

const REQUISITION_VARIANT: Record<RequisitionStatus, 'warning' | 'success'> = {
  pending: 'warning',
  approved: 'success',
};

export function RequisitionStatusBadge({
  status,
}: {
  status: RequisitionStatus;
}) {
  return (
    <Badge variant={REQUISITION_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}

const COUNT_VARIANT: Record<StockCountStatus, 'warning' | 'success'> = {
  open: 'warning',
  submitted: 'success',
};

export function StockCountStatusBadge({
  status,
}: {
  status: StockCountStatus;
}) {
  return (
    <Badge variant={COUNT_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}
