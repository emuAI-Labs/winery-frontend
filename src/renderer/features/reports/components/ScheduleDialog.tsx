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
import { ReportScheduleFrequency } from '../../../../shared/salesTypes';
import { useCreateReportSchedule } from '../hooks/useReportDefinitions';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitionId: string;
}

export default function ScheduleDialog({
  open,
  onOpenChange,
  definitionId,
}: ScheduleDialogProps) {
  const createSchedule = useCreateReportSchedule(definitionId);
  const [frequency, setFrequency] = useState<ReportScheduleFrequency>('weekly');
  const [emails, setEmails] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFrequency('weekly');
    setEmails('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    const recipientEmails = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (recipientEmails.length === 0) {
      setError('Enter at least one recipient email.');
      return;
    }
    try {
      await createSchedule.mutateAsync({ frequency, recipientEmails });
      toast.success(
        `They'll get this report by email ${frequency === 'daily' ? 'every day' : frequency === 'weekly' ? 'every week' : 'every month'}`,
      );
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email this report automatically</DialogTitle>
          <DialogDescription>
            We&apos;ll email this report to the people below on the schedule you
            pick.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as ReportScheduleFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientEmails">
              Recipient emails (comma-separated)
            </Label>
            <Input
              id="recipientEmails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="owner@example.com, manager@example.com"
            />
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
            {createSchedule.isPending ? 'Saving…' : 'Save schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
