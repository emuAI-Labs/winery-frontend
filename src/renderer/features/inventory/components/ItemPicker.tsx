import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryItem } from '../../../../shared/inventoryTypes';

interface ItemPickerProps {
  items: InventoryItem[];
  value: string | null;
  onChange: (itemId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** exclude items already chosen elsewhere (e.g. other lines in the same form) */
  excludeIds?: string[];
}

/** Search-as-you-type item selector. A plain shadcn Select doesn't scale to a
 * catalogue of hundreds of SKUs — bar staff need to type "jw" and find
 * Johnnie Walker, not scroll a giant list. */
export default function ItemPicker({
  items,
  value,
  onChange,
  placeholder = 'Search items…',
  disabled,
  excludeIds = [],
}: ItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = items.find((i) => i.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => !excludeIds.includes(i.id) || i.id === value)
      .filter(
        (i) =>
          !q ||
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [items, query, excludeIds, value]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? `${selected.name} (${selected.sku})` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-50 w-[--radix-popover-trigger-width] rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <div className="p-2">
            <Input
              autoFocus
              placeholder="Type a name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No items found.
              </p>
            )}
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                  item.id === value && 'bg-accent',
                )}
              >
                <span>
                  {item.name}{' '}
                  <span className="text-muted-foreground">({item.sku})</span>
                </span>
                {item.id === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
