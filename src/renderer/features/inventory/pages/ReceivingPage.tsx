import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBranches } from '@/context/BranchContext';
import BranchSelect from '@/components/inventory/BranchSelect';
import { ApiError } from '@/lib/apiClient';
import { useAllItems } from '../hooks/useAllItems';
import { ReceiptLineInput, useReceiveStock } from '../hooks/useReceipts';
import ItemPicker from '../components/ItemPicker';

type DraftLine = Omit<ReceiptLineInput, 'itemId'> & {
  itemId: string | null;
  key: string;
};

let keyCounter = 0;
function newLine(): DraftLine {
  keyCounter += 1;
  return { key: `line-${keyCounter}`, itemId: null, quantity: 0 };
}

export default function ReceivingPage() {
  const { selectedBranchId } = useBranches();
  const { items } = useAllItems(selectedBranchId ?? undefined);
  const receiveStock = useReceiveStock();

  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const chosenIds = lines.map((l) => l.itemId).filter((v): v is string => !!v);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      setError('Add at least one line with an item and quantity.');
      return;
    }

    try {
      await receiveStock.mutateAsync({
        branchId: selectedBranchId,
        lines: validLines.map((l) => ({
          itemId: l.itemId as string,
          quantity: l.quantity,
          unitCost: l.unitCost,
          batchCode: l.batchCode || undefined,
          expiryDate: l.expiryDate || undefined,
          supplierName: l.supplierName || undefined,
        })),
      });
      toast.success('Stock received');
      setLines([newLine()]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not confirm this receipt reached the server — check stock levels before resubmitting rather than retrying blindly.',
      );
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Receive stock</h1>
          <p className="text-sm text-muted-foreground">
            Record a delivery against a branch.
          </p>
        </div>
        <BranchSelect />
      </div>

      <Alert>
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>
          Receiving is not safe to auto-retry. If this fails partway (e.g.
          network drop), check the item&apos;s stock before submitting again —
          do not resubmit blindly.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line) => {
            const item = items.find((i) => i.id === line.itemId);
            return (
              <div key={line.key} className="space-y-3 rounded-md border p-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="mb-1 block text-xs">Item</Label>
                    <ItemPicker
                      items={items}
                      value={line.itemId}
                      onChange={(id) => updateLine(line.key, { itemId: id })}
                      excludeIds={chosenIds}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="mb-1 block text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity || ''}
                      onChange={(e) =>
                        updateLine(line.key, {
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="w-32">
                    <Label className="mb-1 block text-xs">
                      Unit cost (opt.)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost ?? ''}
                      onChange={(e) =>
                        updateLine(line.key, {
                          unitCost: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {item?.expiryTracked && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="mb-1 block text-xs">Batch code</Label>
                      <Input
                        value={line.batchCode ?? ''}
                        onChange={(e) =>
                          updateLine(line.key, { batchCode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Expiry date</Label>
                      <Input
                        type="date"
                        value={line.expiryDate ?? ''}
                        onChange={(e) =>
                          updateLine(line.key, { expiryDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Supplier</Label>
                      <Input
                        value={line.supplierName ?? ''}
                        onChange={(e) =>
                          updateLine(line.key, { supplierName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((p) => [...p, newLine()])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add another line
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={receiveStock.isPending}
            className="w-full"
          >
            {receiveStock.isPending ? 'Recording…' : 'Record receipt'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
