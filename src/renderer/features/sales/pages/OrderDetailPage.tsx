import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Pause, Play, MapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QueryState from '@/features/inventory/components/QueryState';
import { ApiError } from '@/lib/apiClient';
import {
  useOrder,
  useHoldOrder,
  useResumeOrder,
  useCloseOrder,
  useTransferOrder,
} from '../hooks/useOrders';
import MenuGrid from '../components/MenuGrid';
import OrderLinesList from '../components/OrderLinesList';
import BillsPanel from '../components/BillsPanel';
import { OrderStatus } from '../../../../shared/salesTypes';

const STATUS_VARIANT: Record<
  OrderStatus,
  'success' | 'warning' | 'secondary' | 'destructive'
> = {
  open: 'success',
  held: 'warning',
  closed: 'secondary',
  cancelled: 'destructive',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useOrder(id);
  const hold = useHoldOrder();
  const resume = useResumeOrder();
  const close = useCloseOrder();
  const transfer = useTransferOrder();
  const [transferOpen, setTransferOpen] = useState(false);
  const [tableLabel, setTableLabel] = useState('');
  const [seatLabel, setSeatLabel] = useState('');

  const order = data?.order;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const unpaidBills = order?.bills.filter((b) => b.status === 'open') ?? [];
  const canClose =
    !!order && order.bills.length > 0 && unpaidBills.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/till"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to till
      </Link>

      <QueryState isLoading={isLoading} error={error}>
        {order && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">
                    {order.tableLabel ? `Table ${order.tableLabel}` : 'Walk-in'}
                    {order.seatLabel ? ` · ${order.seatLabel}` : ''}
                  </h1>
                  <Badge
                    variant={STATUS_VARIANT[order.status]}
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm capitalize text-muted-foreground">
                  {order.orderType.replace('_', ' ')}
                  {order.guestCount ? ` · ${order.guestCount} guests` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {order.status === 'open' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      run(() => hold.mutateAsync(order.id), 'Order held')
                    }
                  >
                    <Pause className="mr-1 h-4 w-4" /> Hold
                  </Button>
                )}
                {order.status === 'held' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      run(() => resume.mutateAsync(order.id), 'Order resumed')
                    }
                  >
                    <Play className="mr-1 h-4 w-4" /> Resume
                  </Button>
                )}
                {(order.status === 'open' || order.status === 'held') && (
                  <Button
                    variant="outline"
                    onClick={() => setTransferOpen(true)}
                  >
                    <MapPinned className="mr-1 h-4 w-4" /> Transfer
                  </Button>
                )}
                {order.status !== 'closed' && order.status !== 'cancelled' && (
                  <Button
                    disabled={!canClose}
                    title={
                      !canClose
                        ? 'Every bill must be paid or void first'
                        : undefined
                    }
                    onClick={() =>
                      run(() => close.mutateAsync(order.id), 'Tab closed')
                    }
                  >
                    Close tab
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Menu
                </h2>
                <MenuGrid
                  orderId={order.id}
                  disabled={order.status !== 'open'}
                />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Items
                  </h2>
                  <OrderLinesList order={order} />
                </div>
                <BillsPanel order={order} />
              </div>
            </div>
          </>
        )}
      </QueryState>

      {order && (
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer tab</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newTable">New table</Label>
                <Input
                  id="newTable"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newSeat">New seat</Label>
                <Input
                  id="newSeat"
                  value={seatLabel}
                  onChange={(e) => setSeatLabel(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!tableLabel && !seatLabel) {
                    toast.error('Enter a new table or seat.');
                    return;
                  }
                  await run(
                    () =>
                      transfer.mutateAsync({
                        id: order.id,
                        tableLabel: tableLabel || undefined,
                        seatLabel: seatLabel || undefined,
                      }),
                    'Tab transferred',
                  );
                  setTransferOpen(false);
                  setTableLabel('');
                  setSeatLabel('');
                }}
              >
                Transfer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
