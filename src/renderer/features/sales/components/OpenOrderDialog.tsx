import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useBranches } from '@/context/BranchContext';
import { OrderType } from '../../../../shared/salesTypes';
import { useOpenOrder } from '../hooks/useOrders';

interface OpenOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpenOrderDialog({
  open,
  onOpenChange,
}: OpenOrderDialogProps) {
  const { selectedBranchId } = useBranches();
  const openOrder = useOpenOrder();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<OrderType>('bar');
  const [tableLabel, setTableLabel] = useState('');
  const [seatLabel, setSeatLabel] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOrderType('bar');
    setTableLabel('');
    setSeatLabel('');
    setGuestCount('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    try {
      const res = await openOrder.mutateAsync({
        branchId: selectedBranchId,
        orderType,
        tableLabel: tableLabel || undefined,
        seatLabel: seatLabel || undefined,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
      });
      onOpenChange(false);
      navigate(`/till/${res.order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a new tab</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Order type</Label>
            <Select
              value={orderType}
              onValueChange={(v) => setOrderType(v as OrderType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="dine_in">Dine in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableLabel">Table (opt.)</Label>
              <Input
                id="tableLabel"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seatLabel">Seat (opt.)</Label>
              <Input
                id="seatLabel"
                value={seatLabel}
                onChange={(e) => setSeatLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Guests (opt.)</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={openOrder.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={openOrder.isPending}>
            {openOrder.isPending ? 'Opening…' : 'Open tab'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
