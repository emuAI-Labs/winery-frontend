import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatCents } from '@/lib/format';
import { ApiError } from '@/lib/apiClient';
import { useMpesaPending } from '../hooks/useMpesaPending';
import { useConfirmMpesa } from '../hooks/usePayments';

export default function MpesaReconciliationPage() {
  const { selectedBranchId } = useBranches();
  const {
    data: rows,
    isLoading,
    error,
  } = useMpesaPending(selectedBranchId ?? undefined);
  const confirmMpesa = useConfirmMpesa();

  const handleConfirm = async (
    paymentId: string,
    status: 'confirmed' | 'failed',
  ) => {
    try {
      await confirmMpesa.mutateAsync({ paymentId, status });
      toast.success(
        status === 'confirmed' ? 'Payment confirmed' : 'Payment marked failed',
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not update payment.',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">M-PESA reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Codes taken at face value during checkout — confirm each against
            your M-PESA statement.
          </p>
        </div>
        <BranchSelect />
      </div>

      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        Only pending codes on currently open or held tabs are listed — there is
        no endpoint yet to list payments on a tab that has already been closed.
        If you need to reconcile one of those, look it up by order.
      </p>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(rows?.length ?? 0) === 0}
        emptyMessage="Nothing pending — all caught up."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows?.map(({ payment, orderId, tableLabel }) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Link
                    to={`/till/${orderId}`}
                    className="text-primary hover:underline"
                  >
                    {tableLabel ? `Table ${tableLabel}` : orderId.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell className="font-mono">{payment.mpesaCode}</TableCell>
                <TableCell>{formatCents(payment.amountCents)}</TableCell>
                <TableCell>
                  {new Date(payment.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(payment.id, 'confirmed')}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleConfirm(payment.id, 'failed')}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Failed
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}
