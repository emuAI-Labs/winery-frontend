import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { ReportType } from '../../../../shared/salesTypes';
import { useCreateReportDefinition } from '../hooks/useReportDefinitions';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'sales_summary', label: 'Sales summary' },
  { value: 'top_sellers', label: 'Top sellers' },
  { value: 'peak_hours', label: 'Peak hours' },
  { value: 'profitability', label: 'Profitability' },
  { value: 'shift_variance', label: 'Shift variance' },
  { value: 'expense_summary', label: 'Expense summary' },
  { value: 'customer_trends', label: 'Customer trends' },
  { value: 'dashboard', label: 'Cross-branch dashboard' },
  { value: 'reconciliation', label: 'Does it tally up?' },
];

interface CreateDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateDefinitionDialog({
  open,
  onOpenChange,
}: CreateDefinitionDialogProps) {
  const { branches } = useBranches();
  const createDefinition = useCreateReportDefinition();

  const [name, setName] = useState('');
  const [reportType, setReportType] = useState<ReportType>('sales_summary');
  const [branchId, setBranchId] = useState<string>('__all__');
  const [limit, setLimit] = useState('');
  const [minVisits, setMinVisits] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setReportType('sales_summary');
    setBranchId('__all__');
    setLimit('');
    setMinVisits('');
    setError(null);
  }, [open]);

  const showsBranch = reportType !== 'dashboard';
  const showsLimit =
    reportType === 'top_sellers' || reportType === 'customer_trends';
  const showsMinVisits = reportType === 'customer_trends';

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Give the report a name.');
      return;
    }
    const filters: Record<string, unknown> = {};
    if (showsLimit && limit) filters.limit = parseInt(limit, 10);
    if (showsMinVisits && minVisits)
      filters.minVisits = parseInt(minVisits, 10);

    try {
      await createDefinition.mutateAsync({
        name,
        reportType,
        branchId: showsBranch && branchId !== '__all__' ? branchId : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      toast.success('Report saved');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save a report</DialogTitle>
          <DialogDescription>
            Saves this configuration so you can re-run it later — it does not
            run anything now.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="definitionName">Name</Label>
            <Input
              id="definitionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Branch weekly sales"
            />
          </div>
          <div className="space-y-2">
            <Label>Report type</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showsBranch && (
            <div className="space-y-2">
              <Label>Branch (optional — all branches if unset)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showsLimit && (
            <div className="space-y-2">
              <Label htmlFor="filterLimit">Limit (optional)</Label>
              <Input
                id="filterLimit"
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="10"
              />
            </div>
          )}
          {showsMinVisits && (
            <div className="space-y-2">
              <Label htmlFor="filterMinVisits">
                Minimum visits (optional, default 2)
              </Label>
              <Input
                id="filterMinVisits"
                type="number"
                min="1"
                value={minVisits}
                onChange={(e) => setMinVisits(e.target.value)}
                placeholder="2"
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createDefinition.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createDefinition.isPending}>
            {createDefinition.isPending ? 'Saving…' : 'Save report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
