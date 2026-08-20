import { useState } from 'react';
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
import { formatCents, formatDateTime } from '@/lib/format';
import { useShifts } from '../hooks/useShifts';
import CloseShiftDialog from '../components/CloseShiftDialog';
import { Shift, ShiftStatus } from '../../../../shared/salesTypes';

const STATUS_FILTERS: (ShiftStatus | 'all')[] = ['all', 'open', 'closed'];

export default function ShiftsOversightPage() {
  const { selectedBranchId } = useBranches();
  const [status, setStatus] = useState<ShiftStatus | 'all'>('all');
  const { data, isLoading, error } = useShifts({
    branchId: selectedBranchId ?? undefined,
    status: status === 'all' ? undefined : status,
  });
  const [closeTarget, setCloseTarget] = useState<Shift | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shifts</h1>
          <p className="text-sm text-muted-foreground">
            Till floats and cash-ups across staff.
          </p>
        </div>
        <BranchSelect />
      </div>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as ShiftStatus | 'all')}
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
        isEmpty={(data?.shifts.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cashier</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Float</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.shifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.user?.fullName ?? shift.userId}</TableCell>
                <TableCell>{formatDateTime(shift.openedAt)}</TableCell>
                <TableCell>{formatCents(shift.openingFloatCents)}</TableCell>
                <TableCell>
                  {shift.varianceCents === null ||
                  shift.varianceCents === undefined ? (
                    '—'
                  ) : (
                    <Badge
                      variant={
                        shift.varianceCents < 0 ? 'destructive' : 'success'
                      }
                    >
                      {shift.varianceCents >= 0 ? '+' : ''}
                      {formatCents(shift.varianceCents)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={shift.status === 'open' ? 'warning' : 'secondary'}
                    className="capitalize"
                  >
                    {shift.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {shift.status === 'open' && (
                    <Button size="sm" onClick={() => setCloseTarget(shift)}>
                      Close
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      <CloseShiftDialog
        open={!!closeTarget}
        onOpenChange={(v) => !v && setCloseTarget(null)}
        shift={closeTarget}
      />
    </div>
  );
}
