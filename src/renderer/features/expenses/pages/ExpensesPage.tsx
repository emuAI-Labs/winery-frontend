import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, AlertTriangle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import BranchSelect from '@/components/inventory/BranchSelect';
import { useBranches } from '@/context/BranchContext';
import QueryState from '@/features/inventory/components/QueryState';
import { formatCents, formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { ApiError } from '@/lib/apiClient';
import {
  useExpenses,
  useExpensesDue,
  useMarkExpensePaid,
} from '../hooks/useExpenses';
import ExpenseFormDialog from '../components/ExpenseFormDialog';
import { ExpenseStatus } from '../../../../shared/salesTypes';

const STATUS_FILTERS: (ExpenseStatus | 'all')[] = ['all', 'pending', 'paid'];

export default function ExpensesPage() {
  const { selectedBranchId } = useBranches();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user?.role, 'expenses:manage');

  const [status, setStatus] = useState<ExpenseStatus | 'all'>('pending');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, error } = useExpenses({
    branchId: selectedBranchId ?? undefined,
    status: status === 'all' ? undefined : status,
  });
  const { data: due } = useExpensesDue(7);
  const markPaid = useMarkExpensePaid();

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync({ id });
      toast.success('Marked as paid');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses & utilities</h1>
          <p className="text-sm text-muted-foreground">
            Recurring and ad-hoc costs, with due-date visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchSelect />
          {canManage && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Record expense
            </Button>
          )}
        </div>
      </div>

      {due && due.expenses.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {due.expenses.length} expense{due.expenses.length === 1 ? '' : 's'}{' '}
            due within 7 days —{' '}
            {due.expenses.map((e) => e.description).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as ExpenseStatus | 'all')}
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
        isEmpty={(data?.expenses.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              {canManage && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div className="font-medium">{expense.description}</div>
                  {expense.supplierName && (
                    <div className="text-xs text-muted-foreground">
                      {expense.supplierName}
                    </div>
                  )}
                </TableCell>
                <TableCell className="capitalize">{expense.category}</TableCell>
                <TableCell>{formatCents(expense.amountCents)}</TableCell>
                <TableCell>{formatDate(expense.dueDate)}</TableCell>
                <TableCell>
                  <Badge
                    variant={expense.status === 'paid' ? 'success' : 'warning'}
                    className="capitalize"
                  >
                    {expense.status}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {expense.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(expense.id)}
                        disabled={markPaid.isPending}
                      >
                        Mark paid
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
