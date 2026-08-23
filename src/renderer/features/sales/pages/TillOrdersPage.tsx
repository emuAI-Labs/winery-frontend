import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useBranches } from '@/context/BranchContext';
import QueryState from '@/features/inventory/components/QueryState';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { useOrders } from '../hooks/useOrders';
import OpenOrderDialog from '../components/OpenOrderDialog';
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

export default function TillOrdersPage() {
  const { selectedBranchId } = useBranches();
  const [dialogOpen, setDialogOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canReviewMpesa = hasPermission(role, 'payments:confirm-mpesa');
  const {
    data: openOrders,
    isLoading,
    error,
  } = useOrders({ branchId: selectedBranchId ?? undefined, status: 'open' });
  const { data: heldOrders } = useOrders({
    branchId: selectedBranchId ?? undefined,
    status: 'held',
  });

  const orders = [...(openOrders?.orders ?? []), ...(heldOrders?.orders ?? [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Till</h1>
          <p className="text-sm text-muted-foreground">
            Open tabs at this branch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canReviewMpesa && (
            <Button variant="outline" asChild>
              <Link to="/sales/mpesa">
                <Smartphone className="mr-1 h-4 w-4" /> Review M-PESA payments
              </Link>
            </Button>
          )}
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!selectedBranchId}
          >
            <Plus className="mr-1 h-4 w-4" /> New tab
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={orders.length === 0}
        emptyMessage="No open tabs — start one above."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/till/${order.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {order.tableLabel
                        ? `Table ${order.tableLabel}`
                        : 'Walk-in'}
                      {order.seatLabel ? ` · ${order.seatLabel}` : ''}
                    </span>
                    <Badge
                      variant={STATUS_VARIANT[order.status]}
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="capitalize">
                      {order.orderType.replace('_', ' ')}
                    </span>
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </QueryState>

      <OpenOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
