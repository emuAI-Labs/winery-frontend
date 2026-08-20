import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/apiClient';
import { formatCents } from '@/lib/format';
import { useMenuItems } from '../hooks/useMenu';
import { useAddOrderLine } from '../hooks/useOrderLines';

interface MenuGridProps {
  orderId: string;
  disabled?: boolean;
  seatLabel?: string;
}

/** Tap-to-order grid. Each tap adds one line for that quantity — there's no
 * "edit line quantity" endpoint, only adding new lines, which matches how a
 * bar actually rings up drinks (one tap per round, not an edit-in-place
 * quantity field). */
export default function MenuGrid({
  orderId,
  disabled,
  seatLabel,
}: MenuGridProps) {
  const [search, setSearch] = useState('');
  const { data } = useMenuItems({
    isActive: true,
    search: search || undefined,
  });
  const addLine = useAddOrderLine(orderId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAdd = async (menuItemId: string) => {
    setPendingId(menuItemId);
    try {
      await addLine.mutateAsync({
        menuItemId,
        quantity: 1,
        seatLabel: seatLabel || undefined,
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not add item.',
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search menu…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data?.items.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            disabled={disabled || pendingId === item.id}
            onClick={() => handleAdd(item.id)}
            className="h-auto flex-col items-start gap-1 whitespace-normal py-3 text-left"
          >
            <span className="flex w-full items-center justify-between gap-1 font-medium">
              {item.name}
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCents(item.priceCents)}
            </span>
          </Button>
        ))}
      </div>
      {data && data.items.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No menu items found.
        </p>
      )}
    </div>
  );
}
