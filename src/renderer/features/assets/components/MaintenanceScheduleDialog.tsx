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
import { Asset } from '../../../../shared/assetsTypes';
import { useCreateMaintenanceSchedule } from '../hooks/useMaintenance';

interface MaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
}

export default function MaintenanceScheduleDialog({
  open,
  onOpenChange,
  assets,
}: MaintenanceScheduleDialogProps) {
  const createSchedule = useCreateMaintenanceSchedule();
  const [assetId, setAssetId] = useState('');
  const [title, setTitle] = useState('');
  const [intervalDays, setIntervalDays] = useState('30');
  const [nextDueDate, setNextDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAssetId(assets[0]?.id ?? '');
    setTitle('');
    setIntervalDays('30');
    setNextDueDate('');
    setError(null);
  }, [open, assets]);

  const handleSubmit = async () => {
    setError(null);
    if (!assetId || !title || !intervalDays || !nextDueDate) {
      setError('Asset, title, interval, and next due date are required.');
      return;
    }
    try {
      await createSchedule.mutateAsync({
        assetId,
        title,
        intervalDays: parseInt(intervalDays, 10),
        nextDueDate,
      });
      toast.success('Maintenance schedule added');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add maintenance schedule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduleTitle">What needs doing</Label>
            <Input
              id="scheduleTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deep clean and gas check"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intervalDays">Repeats every (days)</Label>
              <Input
                id="intervalDays"
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">Next due</Label>
              <Input
                id="nextDueDate"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createSchedule.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createSchedule.isPending}>
            {createSchedule.isPending ? 'Saving…' : 'Add schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
