import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/apiClient';
import { formatCents } from '@/lib/format';
import { Bill, PaymentMethod } from '../../../../shared/salesTypes';
import { useBillPayments, useRecordPayment } from '../hooks/usePayments';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  bill: Bill | null;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  orderId,
  bill,
}: PaymentDialogProps) {
  const { data: paymentsData } = useBillPayments(bill?.id);
  const recordPayment = useRecordPayment(orderId, bill?.id ?? '');

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const covered =
    paymentsData?.payments
      .filter((p) => !p.voidedAt)
      .reduce((sum, p) => sum + p.amountCents, 0) ?? 0;
  const remaining = Math.max((bill?.totalCents ?? 0) - covered, 0);

  useEffect(() => {
    if (!open) return;
    setMethod('cash');
    setAmount(remaining > 0 ? (remaining / 100).toFixed(2) : '');
    setMpesaCode('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the dialog opens
  }, [open]);

  if (!bill) return null;

  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const overpaying = amountCents > remaining;

  const handleSubmit = async () => {
    setError(null);
    if (!amountCents || amountCents <= 0) {
      setError('Enter an amount.');
      return;
    }
    if (overpaying) {
      setError(
        `Amount exceeds the remaining balance of ${formatCents(remaining)}.`,
      );
      return;
    }
    if (method === 'mpesa' && !mpesaCode.trim()) {
      setError('Enter the M-PESA confirmation code.');
      return;
    }
    try {
      await recordPayment.mutateAsync({
        method,
        amountCents,
        mpesaCode: method === 'mpesa' ? mpesaCode.trim() : undefined,
      });
      const newRemaining = remaining - amountCents;
      toast.success(
        newRemaining <= 0
          ? 'Bill paid in full'
          : `Payment recorded — ${formatCents(newRemaining)} remaining`,
      );
      if (newRemaining <= 0) {
        onOpenChange(false);
      } else {
        setAmount((newRemaining / 100).toFixed(2));
        setMpesaCode('');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Total {formatCents(bill.totalCents)} · Remaining{' '}
            {formatCents(remaining)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs
            value={method}
            onValueChange={(v) => setMethod(v as PaymentMethod)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="card">Card</TabsTrigger>
              <TabsTrigger value="mpesa">M-PESA</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Amount</Label>
            <Input
              id="paymentAmount"
              type="number"
              min="0"
              step="0.01"
              max={remaining / 100}
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {method === 'mpesa' && (
            <div className="space-y-2">
              <Label htmlFor="mpesaCode">M-PESA confirmation code</Label>
              <Input
                id="mpesaCode"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="QAX1B2C3D4"
              />
              <p className="text-xs text-muted-foreground">
                Recorded immediately and counts toward the bill — a manager
                reconciles the code afterwards, no need to wait here.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordPayment.isPending}
          >
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={recordPayment.isPending || remaining <= 0}
          >
            {recordPayment.isPending ? 'Recording…' : `Record ${method}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
