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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { DISCOUNT_REASONS } from '@/lib/salesReasonCodes';
import { Bill, DiscountType } from '../../../../shared/salesTypes';
import { useApplyDiscount } from '../hooks/useBills';

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  bill: Bill | null;
}

export default function DiscountDialog({
  open,
  onOpenChange,
  orderId,
  bill,
}: DiscountDialogProps) {
  const applyDiscount = useApplyDiscount(orderId, bill?.id ?? '');
  const [type, setType] = useState<DiscountType>('percent');
  const [value, setValue] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType('percent');
    setValue('');
    setReasonCode('');
    setError(null);
  }, [open]);

  if (!bill) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!reasonCode) {
      setError('Choose a reason.');
      return;
    }
    if (type !== 'comp' && !value) {
      setError('Enter a value.');
      return;
    }
    try {
      await applyDiscount.mutateAsync({
        type,
        reasonCode,
        valuePercent: type === 'percent' ? parseFloat(value) : undefined,
        valueCents:
          type === 'fixed' ? Math.round(parseFloat(value) * 100) : undefined,
      });
      toast.success('Discount applied');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply discount</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as DiscountType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage off</SelectItem>
                <SelectItem value="fixed">Fixed amount off</SelectItem>
                <SelectItem value="comp">Complimentary (zero out)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type !== 'comp' && (
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {type === 'percent' ? 'Percent off' : 'Amount off'}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                step={type === 'percent' ? '1' : '0.01'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applyDiscount.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={applyDiscount.isPending}>
            {applyDiscount.isPending ? 'Applying…' : 'Apply discount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
