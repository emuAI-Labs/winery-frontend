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
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { useOpenShift } from '../hooks/useShifts';

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpenShiftDialog({
  open,
  onOpenChange,
}: OpenShiftDialogProps) {
  const { selectedBranchId } = useBranches();
  const openShift = useOpenShift();
  const [floatAmount, setFloatAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFloatAmount('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    if (!floatAmount || parseFloat(floatAmount) < 0) {
      setError('Enter the opening cash float.');
      return;
    }
    try {
      await openShift.mutateAsync({
        branchId: selectedBranchId,
        openingFloatCents: Math.round(parseFloat(floatAmount) * 100),
      });
      toast.success('Shift opened');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open till shift</DialogTitle>
          <DialogDescription>
            Count the cash in the drawer before you start selling — this becomes
            your opening float for this shift&apos;s cash-up.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="openingFloat">Opening cash float</Label>
          <Input
            id="openingFloat"
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={floatAmount}
            onChange={(e) => setFloatAmount(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={openShift.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={openShift.isPending}>
            {openShift.isPending ? 'Opening…' : 'Open shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
