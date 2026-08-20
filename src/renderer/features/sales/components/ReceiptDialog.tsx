import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCents, formatDateTime } from '@/lib/format';
import { useReceipt } from '../hooks/useBills';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string | null;
}

/** The API returns receipt data only — no server-side rendering, printing,
 * or emailing. This renders it and hands off to the OS print dialog; email
 * is left as a "copy the summary" affordance since there's no send-email
 * endpoint to call. */
export default function ReceiptDialog({
  open,
  onOpenChange,
  billId,
}: ReceiptDialogProps) {
  const { data } = useReceipt(billId ?? undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        {data && (
          <div id="receipt-print-area" className="space-y-3 text-sm">
            <div className="text-center text-xs text-muted-foreground">
              {formatDateTime(data.order.createdAt)}
              {data.order.tableLabel ? ` · Table ${data.order.tableLabel}` : ''}
            </div>
            <div className="space-y-1 border-y py-2">
              {data.lines
                .filter((l) => l.billId === data.bill.id && l.status !== 'void')
                .map((line) => (
                  <div key={line.id} className="flex justify-between">
                    <span>
                      {line.quantity}× {line.menuItem?.name ?? line.menuItemId}
                    </span>
                    <span>{formatCents(line.lineTotalCents)}</span>
                  </div>
                ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCents(data.bill.subtotalCents)}</span>
              </div>
              {data.bill.discountCents > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{formatCents(data.bill.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCents(data.bill.totalCents)}</span>
              </div>
            </div>
            <div className="space-y-1 border-t pt-2">
              {data.payments
                .filter((p) => !p.isVoided)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="capitalize">{p.method}</span>
                    <span className="flex items-center gap-1">
                      {formatCents(p.amountCents)}
                      {p.method === 'mpesa' &&
                        p.mpesaStatus === 'pending_confirmation' && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
        <Button onClick={() => window.print()} disabled={!data}>
          Print
        </Button>
      </DialogContent>
    </Dialog>
  );
}
