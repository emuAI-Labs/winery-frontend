import { useState } from 'react';
import {
  CreditCard,
  Percent,
  Receipt as ReceiptIcon,
  Split,
  Combine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCents } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { Bill, Order } from '../../../../shared/salesTypes';
import PaymentDialog from './PaymentDialog';
import DiscountDialog from './DiscountDialog';
import SplitBillDialog from './SplitBillDialog';
import JoinBillsDialog from './JoinBillsDialog';
import ReceiptDialog from './ReceiptDialog';

const BILL_STATUS_LABEL: Record<Bill['status'], string> = {
  open: 'Open',
  paid: 'Paid',
  void: 'Void',
};

interface BillsPanelProps {
  order: Order;
}

export default function BillsPanel({ order }: BillsPanelProps) {
  const user = useAuthStore((s) => s.user);
  const canDiscount = hasPermission(user?.role, 'sales:discount');

  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [discountBill, setDiscountBill] = useState<Bill | null>(null);
  const [receiptBillId, setReceiptBillId] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const canSplit =
    order.status === 'open' &&
    order.lines.filter((l) => l.status !== 'void').length > 0;
  const canJoin = order.bills.filter((b) => b.status === 'open').length > 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Bills</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSplitOpen(true)}
            disabled={!canSplit}
          >
            <Split className="mr-1 h-3.5 w-3.5" /> Split
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setJoinOpen(true)}
            disabled={!canJoin}
          >
            <Combine className="mr-1 h-3.5 w-3.5" /> Join
          </Button>
        </div>
      </div>

      {order.bills.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No bill yet — add an item to start one.
        </p>
      )}

      {order.bills.map((bill, idx) => (
        <Card key={bill.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bill {idx + 1} · {BILL_STATUS_LABEL[bill.status]}
            </CardTitle>
            <span className="font-semibold">
              {formatCents(bill.totalCents)}
            </span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {bill.discountCents > 0 && (
              <p className="text-xs text-emerald-700">
                Discount applied: -{formatCents(bill.discountCents)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setPayBill(bill)}
                disabled={bill.status !== 'open'}
              >
                <CreditCard className="mr-1 h-3.5 w-3.5" /> Pay
              </Button>
              {canDiscount && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDiscountBill(bill)}
                  disabled={bill.status !== 'open'}
                >
                  <Percent className="mr-1 h-3.5 w-3.5" /> Discount
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReceiptBillId(bill.id)}
              >
                <ReceiptIcon className="mr-1 h-3.5 w-3.5" /> Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <PaymentDialog
        open={!!payBill}
        onOpenChange={(v) => !v && setPayBill(null)}
        orderId={order.id}
        bill={payBill}
      />
      <DiscountDialog
        open={!!discountBill}
        onOpenChange={(v) => !v && setDiscountBill(null)}
        orderId={order.id}
        bill={discountBill}
      />
      <ReceiptDialog
        open={!!receiptBillId}
        onOpenChange={(v) => !v && setReceiptBillId(null)}
        billId={receiptBillId}
      />
      {splitOpen && (
        <SplitBillDialog
          open={splitOpen}
          onOpenChange={setSplitOpen}
          order={order}
        />
      )}
      {joinOpen && (
        <JoinBillsDialog
          open={joinOpen}
          onOpenChange={setJoinOpen}
          order={order}
        />
      )}
    </div>
  );
}
