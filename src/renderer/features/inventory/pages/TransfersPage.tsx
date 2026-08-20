import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import { ApiError } from '@/lib/apiClient';
import {
  useApproveTransfer,
  useCancelTransfer,
  useCompleteTransfer,
  useTransfers,
} from '../hooks/useTransfers';
import { TransferStatusBadge } from '../components/StatusBadge';
import TransferFormDialog from '../components/TransferFormDialog';
import QueryState from '../components/QueryState';
import { TransferStatus } from '../../../../shared/inventoryTypes';

const STATUS_FILTERS: (TransferStatus | 'all')[] = [
  'all',
  'requested',
  'approved',
  'completed',
  'cancelled',
];

export default function TransfersPage() {
  const { selectedBranchId, branches } = useBranches();
  const user = useAuthStore((s) => s.user);
  const canTransfer = hasPermission(user?.role, 'inventory:transfer');

  const [status, setStatus] = useState<TransferStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useTransfers({
    branchId: selectedBranchId ?? undefined,
    status: status === 'all' ? undefined : status,
  });

  const approve = useApproveTransfer();
  const complete = useCompleteTransfer();
  const cancel = useCancelTransfer();

  const runAction = async (
    mutation: typeof approve | typeof complete | typeof cancel,
    id: string,
    successMessage: string,
  ) => {
    try {
      await mutation.mutateAsync(id);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const branchName = (id: string) =>
    branches.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inter-branch transfers</h1>
          <p className="text-sm text-muted-foreground">
            Showing transfers into or out of the selected branch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchSelect />
          {canTransfer && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> New transfer
            </Button>
          )}
        </div>
      </div>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as TransferStatus | 'all')}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s === 'all' ? 'All statuses' : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.transfers.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From → To</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              {canTransfer && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  {branchName(t.fromBranchId)} → {branchName(t.toBranchId)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.lines.length} line{t.lines.length === 1 ? '' : 's'}
                </TableCell>
                <TableCell>
                  <TransferStatusBadge status={t.status} />
                </TableCell>
                <TableCell>{formatDateTime(t.createdAt)}</TableCell>
                {canTransfer && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {t.status === 'requested' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              runAction(approve, t.id, 'Transfer approved')
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              runAction(cancel, t.id, 'Transfer rejected')
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {t.status === 'approved' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              runAction(complete, t.id, 'Transfer completed')
                            }
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              runAction(cancel, t.id, 'Transfer cancelled')
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      <TransferFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
