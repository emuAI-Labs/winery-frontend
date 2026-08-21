import { useState } from 'react';
import { toast } from 'sonner';
import { Send, GlassWater, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCents } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { ApiError } from '@/lib/apiClient';
import { VOID_LINE_REASONS } from '@/lib/salesReasonCodes';
import { Order, OrderLineStatus } from '../../../../shared/salesTypes';
import { useSendLine, useServeLine, useVoidLine } from '../hooks/useOrderLines';
import { useMenuItemLookup } from '../hooks/useMenuItemLookup';
import ReasonCodeDialog from './ReasonCodeDialog';

const STATUS_VARIANT: Record<
  OrderLineStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  pending: 'warning',
  sent: 'secondary',
  served: 'success',
  void: 'destructive',
};

interface OrderLinesListProps {
  order: Order;
}

export default function OrderLinesList({ order }: OrderLinesListProps) {
  const user = useAuthStore((s) => s.user);
  const sendLine = useSendLine(order.id);
  const serveLine = useServeLine(order.id);
  const voidLine = useVoidLine(order.id);
  const menuItemNames = useMenuItemLookup();
  const [voidTarget, setVoidTarget] = useState<string | null>(null);

  const canVoid = hasPermission(user?.role, 'sales:void');
  const orderEditable = order.status === 'open';

  const handleSend = async (lineId: string) => {
    try {
      await sendLine.mutateAsync(lineId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not send.');
    }
  };

  const handleServe = async (lineId: string) => {
    try {
      const res = await serveLine.mutateAsync({ lineId });
      const depletion =
        (res as { depletion?: { status: string }[] }).depletion ?? [];
      if (depletion.some((d) => d.status === 'skipped')) {
        toast.warning(
          'Served — but one ingredient is not stocked at this branch (manager should check inventory).',
        );
      } else {
        toast.success('Marked as served');
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not mark as served.',
      );
    }
  };

  return (
    <div className="space-y-2">
      {order.lines.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No items yet — tap something from the menu.
        </p>
      )}
      {order.lines.map((line) => (
        <div
          key={line.id}
          className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {line.quantity}×{' '}
                {menuItemNames.get(line.menuItemId) ?? line.menuItemId}
              </span>
              <Badge
                variant={STATUS_VARIANT[line.status]}
                className="capitalize"
              >
                {line.status}
              </Badge>
              {line.appliedRuleId && (
                <Badge variant="secondary">🎉 Promo</Badge>
              )}
              {line.seatLabel && (
                <span className="text-xs text-muted-foreground">
                  Seat {line.seatLabel}
                </span>
              )}
            </div>
            {line.notes && (
              <p className="text-xs text-muted-foreground">{line.notes}</p>
            )}
          </div>
          <span className="w-20 shrink-0 text-right">
            {formatCents(line.lineTotalCents)}
          </span>
          <div className="flex shrink-0 gap-1">
            {line.status === 'pending' && orderEditable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSend(line.id)}
              >
                <Send className="mr-1 h-3.5 w-3.5" /> Send
              </Button>
            )}
            {(line.status === 'pending' || line.status === 'sent') &&
              orderEditable && (
                <Button size="sm" onClick={() => handleServe(line.id)}>
                  <GlassWater className="mr-1 h-3.5 w-3.5" /> Serve
                </Button>
              )}
            {canVoid && line.status !== 'void' && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setVoidTarget(line.id)}
                title="Void line"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <ReasonCodeDialog
        open={!!voidTarget}
        onOpenChange={(v) => !v && setVoidTarget(null)}
        title="Void this line"
        description="Removes it from the bill total. If it was already served, the drink is not un-made — log a loss in Inventory if stock needs correcting."
        reasons={VOID_LINE_REASONS}
        destructive
        confirmLabel="Void line"
        onConfirm={async (reasonCode, notes) => {
          if (!voidTarget) return;
          await voidLine.mutateAsync({ lineId: voidTarget, reasonCode, notes });
          toast.success('Line voided');
        }}
      />
    </div>
  );
}
