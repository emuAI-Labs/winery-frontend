import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import BranchSelect from '@/components/inventory/BranchSelect';
import { useBranches } from '@/context/BranchContext';
import QueryState from '@/features/inventory/components/QueryState';
import { formatCents, formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { ApiError } from '@/lib/apiClient';
import { useAssets, useUpdateAsset } from '../hooks/useAssets';
import AssetFormDialog from '../components/AssetFormDialog';
import { AssetStatus } from '../../../../shared/assetsTypes';

const STATUS_FILTERS: (AssetStatus | 'all')[] = [
  'all',
  'active',
  'under_maintenance',
  'disposed',
];

const STATUS_LABEL: Record<AssetStatus, string> = {
  active: 'Active',
  under_maintenance: 'Under maintenance',
  disposed: 'Disposed',
};

const STATUS_BADGE: Record<AssetStatus, 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  under_maintenance: 'warning',
  disposed: 'secondary',
};

export default function AssetRegisterPage() {
  const { selectedBranchId } = useBranches();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user?.role, 'assets:manage');

  const [status, setStatus] = useState<AssetStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, error } = useAssets({
    branchId: selectedBranchId ?? undefined,
    status: status === 'all' ? undefined : status,
  });
  const updateAsset = useUpdateAsset();

  const handleStatusChange = async (id: string, newStatus: AssetStatus) => {
    try {
      await updateAsset.mutateAsync({ id, status: newStatus });
      toast.success(
        newStatus === 'disposed' ? 'Asset marked disposed' : 'Status updated',
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Asset register</h1>
          <p className="text-sm text-muted-foreground">
            Fridges, furniture, POS hardware, and other equipment, with
            depreciated value.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchSelect />
          {canManage && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add asset
            </Button>
          )}
        </div>
      </div>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as AssetStatus | 'all')}
      >
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'all' ? 'All statuses' : STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage={
          selectedBranchId
            ? 'No assets recorded for this branch yet.'
            : 'Select a branch to see its assets.'
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead>Current value</TableHead>
              <TableHead>Status</TableHead>
              {canManage && (
                <TableHead className="text-right">Update</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <div className="font-medium">{asset.name}</div>
                  {asset.serialNumber && (
                    <div className="text-xs text-muted-foreground">
                      S/N {asset.serialNumber}
                    </div>
                  )}
                </TableCell>
                <TableCell className="capitalize">
                  {asset.category.replace('_', ' ')}
                </TableCell>
                <TableCell>{asset.location ?? '—'}</TableCell>
                <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
                <TableCell>{formatCents(asset.currentValueCents)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[asset.status]}>
                    {STATUS_LABEL[asset.status]}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Select
                      value={asset.status}
                      onValueChange={(v) =>
                        handleStatusChange(asset.id, v as AssetStatus)
                      }
                    >
                      <SelectTrigger className="w-44 ml-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as AssetStatus[]).map(
                          (s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      <AssetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
