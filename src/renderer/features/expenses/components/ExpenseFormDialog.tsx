import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { ExpenseCategory } from '../../../../shared/salesTypes';
import { useCreateExpense } from '../hooks/useExpenses';

const CATEGORIES: ExpenseCategory[] = [
  'electricity',
  'water',
  'gas',
  'rent',
  'waste',
  'licence',
  'salaries',
  'maintenance',
  'other',
];

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExpenseFormDialog({
  open,
  onOpenChange,
}: ExpenseFormDialogProps) {
  const { selectedBranchId } = useBranches();
  const createExpense = useCreateExpense();

  const [category, setCategory] = useState<ExpenseCategory>('electricity');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalDays, setIntervalDays] = useState('30');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategory('electricity');
    setDescription('');
    setAmount('');
    setDueDate('');
    setSupplierName('');
    setIsRecurring(false);
    setIntervalDays('30');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    if (!description || !amount || !dueDate) {
      setError('Description, amount, and due date are required.');
      return;
    }
    try {
      await createExpense.mutateAsync({
        branchId: selectedBranchId,
        category,
        description,
        amountCents: Math.round(parseFloat(amount) * 100),
        dueDate,
        supplierName: supplierName || undefined,
        frequency: isRecurring ? 'recurring' : undefined,
        recurrenceIntervalDays: isRecurring
          ? parseInt(intervalDays, 10)
          : undefined,
      });
      toast.success('Expense recorded');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseAmount">Amount</Label>
              <Input
                id="expenseAmount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseDescription">Description</Label>
            <Input
              id="expenseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="KPLC bill — June"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier (optional)</Label>
              <Input
                id="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isRecurring"
              checked={isRecurring}
              onCheckedChange={(v) => setIsRecurring(v === true)}
            />
            <Label htmlFor="isRecurring">Recurring expense</Label>
          </div>
          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="intervalDays">Repeats every (days)</Label>
              <Input
                id="intervalDays"
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Marking this recurring does not auto-create the next occurrence
                — each period still needs to be entered manually today.
              </p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createExpense.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createExpense.isPending}>
            {createExpense.isPending ? 'Saving…' : 'Record expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
