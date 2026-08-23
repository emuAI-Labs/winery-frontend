import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import BranchSelect from '@/components/inventory/BranchSelect';
import { useBranches } from '@/context/BranchContext';
import { LOSS_REASON_CODES, LOSS_TYPE_LABEL } from '@/lib/lossReasonCodes';
import { formatMoney, formatDateTime } from '@/lib/format';
import { ApiError } from '@/lib/apiClient';
import { useAllItems } from '../hooks/useAllItems';
import ItemPicker from '../components/ItemPicker';
import { useRecordLoss } from '../hooks/useLosses';
import { LossRecord, LossType } from '../../../../shared/inventoryTypes';

const LOSS_TYPES = Object.keys(LOSS_TYPE_LABEL) as LossType[];

export default function LossesPage() {
  const { selectedBranchId } = useBranches();
  const { items } = useAllItems(selectedBranchId ?? undefined);
  const recordLoss = useRecordLoss();
  const qc = useQueryClient();
  const sessionLog =
    qc.getQueryData<LossRecord[]>(['losses-session-log']) ?? [];

  const [lossType, setLossType] = useState<LossType>('breakage');
  const [itemId, setItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [creditNoteRef, setCreditNoteRef] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reasonOptions = LOSS_REASON_CODES[lossType];

  const resetForm = () => {
    setItemId(null);
    setQuantity('');
    setReasonCode('');
    setCreditNoteRef('');
    setNotes('');
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    if (!itemId || !quantity || !reasonCode) {
      setError('Item, quantity, and a reason are required.');
      return;
    }
    try {
      const record = await recordLoss.mutateAsync({
        itemId,
        branchId: selectedBranchId,
        lossType,
        quantity: parseFloat(quantity),
        reasonCode,
        supplierCreditNoteRef:
          lossType === 'return_to_supplier'
            ? creditNoteRef || undefined
            : undefined,
        notes: notes || undefined,
      });
      toast.success(`Loss logged — ${formatMoney(record.valueLost)}`);
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Breakage & loss</h1>
          <p className="text-sm text-muted-foreground">
            Log breakage, spoilage, flat beer, and supplier returns as they
            happen.
          </p>
        </div>
        <BranchSelect />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loss type</Label>
              <Select
                value={lossType}
                onValueChange={(v) => {
                  setLossType(v as LossType);
                  setReasonCode('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOSS_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LOSS_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <ItemPicker items={items} value={itemId} onChange={setItemId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          {lossType === 'return_to_supplier' && (
            <div className="space-y-2">
              <Label htmlFor="creditNoteRef">
                Supplier credit-note reference
              </Label>
              <Input
                id="creditNoteRef"
                value={creditNoteRef}
                onChange={(e) => setCreditNoteRef(e.target.value)}
                placeholder="CN-0042"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={recordLoss.isPending}
            className="w-full"
          >
            {recordLoss.isPending ? 'Logging…' : 'Log loss'}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Logged this session ({sessionLog.length})
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          This only shows what you&apos;ve logged since you opened the app — it
          won&apos;t include older entries.
        </p>
        {sessionLog.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Value lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionLog.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDateTime(record.createdAt)}</TableCell>
                  <TableCell>{LOSS_TYPE_LABEL[record.lossType]}</TableCell>
                  <TableCell>{record.reasonCode}</TableCell>
                  <TableCell>{record.quantity}</TableCell>
                  <TableCell>{formatMoney(record.valueLost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
