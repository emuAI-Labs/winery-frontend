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
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/apiClient';
import { MaintenanceSchedule } from '../../../../shared/assetsTypes';
import { useLogMaintenance } from '../hooks/useMaintenance';

interface LogMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: MaintenanceSchedule | null;
}

export default function LogMaintenanceDialog({
  open,
  onOpenChange,
  schedule,
}: LogMaintenanceDialogProps) {
  const logMaintenance = useLogMaintenance();
  const [costCents, setCostCents] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCostCents('');
    setNotes('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!schedule) return;
    try {
      await logMaintenance.mutateAsync({
        scheduleId: schedule.id,
        assetId: schedule.assetId,
        costCents: costCents
          ? Math.round(parseFloat(costCents) * 100)
          : undefined,
        notes: notes || undefined,
      });
      toast.success('Logged — next due date moved out');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Log maintenance{schedule ? ` — ${schedule.title}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maintenanceCost">Cost (optional)</Label>
            <Input
              id="maintenanceCost"
              type="number"
              min="0"
              step="0.01"
              value={costCents}
              onChange={(e) => setCostCents(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenanceNotes">Notes (optional)</Label>
            <Textarea
              id="maintenanceNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={logMaintenance.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={logMaintenance.isPending}>
            {logMaintenance.isPending ? 'Saving…' : 'Log maintenance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
