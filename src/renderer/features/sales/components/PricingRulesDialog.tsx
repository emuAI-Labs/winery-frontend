import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { MenuItem, PricingRuleType } from '../../../../shared/salesTypes';
import { useCreatePricingRule, usePricingRules } from '../hooks/useMenu';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface PricingRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
}

export default function PricingRulesDialog({
  open,
  onOpenChange,
  menuItem,
}: PricingRulesDialogProps) {
  const { data: rules } = usePricingRules(menuItem?.id);
  const createRule = useCreatePricingRule(menuItem?.id ?? '');

  const [type, setType] = useState<PricingRuleType>('happy_hour');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [discountPercent, setDiscountPercent] = useState('20');
  const [minQuantity, setMinQuantity] = useState('2');
  const [error, setError] = useState<string | null>(null);

  if (!menuItem) return null;

  const toggleDay = (day: number) =>
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  const handleCreate = async () => {
    setError(null);
    if (!discountPercent) {
      setError('Enter a discount percentage.');
      return;
    }
    try {
      await createRule.mutateAsync({
        type,
        discountPercent: parseFloat(discountPercent),
        startTime: type === 'happy_hour' ? startTime : undefined,
        endTime: type === 'happy_hour' ? endTime : undefined,
        daysOfWeek: type === 'happy_hour' && days.length > 0 ? days : undefined,
        minQuantity:
          type === 'quantity_discount' ? parseInt(minQuantity, 10) : undefined,
      });
      toast.success('Pricing rule added');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pricing rules — {menuItem.name}</DialogTitle>
          <DialogDescription>
            At most one rule applies per line automatically — happy hour is
            checked before quantity discounts. No stacking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {(rules?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No rules yet.</p>
          )}
          {rules?.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <span>
                {rule.type === 'happy_hour'
                  ? `Happy hour ${rule.startTime}–${rule.endTime}`
                  : `${rule.minQuantity}+ qty`}{' '}
                — {rule.discountPercent}% off
              </span>
              <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                {rule.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label>New rule type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PricingRuleType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="happy_hour">
                  Happy hour (time-based)
                </SelectItem>
                <SelectItem value="quantity_discount">
                  Quantity discount
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'happy_hour' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleStart">Start time</Label>
                  <Input
                    id="ruleStart"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleEnd">End time</Label>
                  <Input
                    id="ruleEnd"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Days (none selected = every day)</Label>
                <div className="flex gap-1">
                  {DAY_LABELS.map((label, idx) => {
                    const day = idx + 1;
                    return (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={days.includes(day) ? 'default' : 'outline'}
                        onClick={() => toggleDay(day)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum quantity</Label>
              <Input
                id="minQuantity"
                type="number"
                min="2"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="discountPercent">Discount percent</Label>
            <Input
              id="discountPercent"
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={handleCreate}
            disabled={createRule.isPending}
            className="w-full"
          >
            {createRule.isPending ? 'Adding…' : 'Add rule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
