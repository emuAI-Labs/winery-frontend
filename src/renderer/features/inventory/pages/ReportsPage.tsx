import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { daysUntil, formatDate, formatDateTime, formatQty } from '@/lib/format';
import { useAllItems } from '../hooks/useAllItems';
import ItemPicker from '../components/ItemPicker';
import {
  useDeadStock,
  useExpiryWarnings,
  useForecast,
  usePourVariances,
} from '../hooks/useStockReports';
import QueryState from '../components/QueryState';

function ExpiryTab() {
  const { selectedBranchId } = useBranches();
  const [withinDays, setWithinDays] = useState(30);
  const { data, isLoading, error } = useExpiryWarnings(
    selectedBranchId ?? undefined,
    withinDays,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="withinDays" className="text-sm">
          Within
        </Label>
        <Input
          id="withinDays"
          type="number"
          min="1"
          className="w-20"
          value={withinDays}
          onChange={(e) => setWithinDays(parseInt(e.target.value, 10) || 30)}
        />
        <span className="text-sm text-muted-foreground">days</span>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.warnings.length ?? 0) === 0}
        emptyMessage="Nothing expiring soon — good."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.warnings.map((w, idx) => {
              const days = daysUntil(w.expiryDate);
              return (
                // eslint-disable-next-line react/no-array-index-key -- API gives no stable batch id
                <TableRow key={idx}>
                  <TableCell>{w.itemName}</TableCell>
                  <TableCell>{w.branchName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.batchCode ?? '—'}
                  </TableCell>
                  <TableCell>{w.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDate(w.expiryDate)}
                      {days <= 7 && (
                        <Badge variant="destructive">{days}d</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}

function DeadStockTab() {
  const { selectedBranchId } = useBranches();
  const [sinceDays, setSinceDays] = useState(30);
  const { data, isLoading, error } = useDeadStock(
    selectedBranchId ?? undefined,
    sinceDays,
  );

  if (!selectedBranchId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a branch to see dead stock.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="sinceDays" className="text-sm">
          No sales in
        </Label>
        <Input
          id="sinceDays"
          type="number"
          min="1"
          className="w-20"
          value={sinceDays}
          onChange={(e) => setSinceDays(parseInt(e.target.value, 10) || 30)}
        />
        <span className="text-sm text-muted-foreground">days</span>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage="No dead stock in this window."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>No sales for</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell>
                  {item.name}{' '}
                  <span className="text-xs text-muted-foreground">
                    ({item.sku})
                  </span>
                </TableCell>
                <TableCell>{item.quantityOnHand}</TableCell>
                <TableCell>{item.sinceDays} days</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}

function ForecastTab() {
  const { selectedBranchId } = useBranches();
  const { items } = useAllItems(selectedBranchId ?? undefined);
  const [itemId, setItemId] = useState<string | null>(null);
  const [lookbackDays, setLookbackDays] = useState(30);
  const { data, isLoading, error } = useForecast(
    selectedBranchId ?? undefined,
    itemId ?? undefined,
    lookbackDays,
  );
  const item = items.find((i) => i.id === itemId);

  return (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label>Item</Label>
        <ItemPicker items={items} value={itemId} onChange={setItemId} />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="lookback" className="text-sm">
          Lookback
        </Label>
        <Input
          id="lookback"
          type="number"
          min="1"
          className="w-20"
          value={lookbackDays}
          onChange={(e) => setLookbackDays(parseInt(e.target.value, 10) || 30)}
        />
        <span className="text-sm text-muted-foreground">days</span>
      </div>

      {!itemId && (
        <p className="text-sm text-muted-foreground">
          Choose an item to see a forecast.
        </p>
      )}
      {itemId && (
        <QueryState isLoading={isLoading} error={error}>
          {data && (
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg daily usage</span>
                <span>{data.avgDailyUsage.toFixed(2)} / day</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">On hand</span>
                <span>
                  {item ? formatQty(data.onHand, item.stockUnit) : data.onHand}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days of cover</span>
                <span>
                  {data.daysOfCover === null
                    ? 'No recent sales data'
                    : `${data.daysOfCover.toFixed(1)} days`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Suggested order quantity</span>
                <span>{data.suggestedOrderQuantity}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Based on average daily usage over the lookback window — a simple
                heuristic, not a seasonality-aware forecast.
              </p>
            </div>
          )}
        </QueryState>
      )}
    </div>
  );
}

function PourVarianceTab() {
  const { selectedBranchId } = useBranches();
  const { items } = useAllItems(selectedBranchId ?? undefined);
  const { data, isLoading, error } = usePourVariances(
    selectedBranchId ?? undefined,
  );

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={(data?.items.length ?? 0) === 0}
      emptyMessage="No flagged over-pours in range."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Standard pour</TableHead>
            <TableHead>Actual pour</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                {items.find((i) => i.id === v.itemId)?.name ?? v.itemId}
              </TableCell>
              <TableCell>{v.defaultPourMl}ml</TableCell>
              <TableCell>{v.actualPourMl}ml</TableCell>
              <TableCell>{formatDateTime(v.createdAt)}</TableCell>
              <TableCell>
                <Badge variant="warning">{v.flagReason ?? 'Over-pour'}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </QueryState>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Expiry, dead stock, demand forecast, and pour-variance visibility.
          </p>
        </div>
        <BranchSelect />
      </div>
      <Tabs defaultValue="expiry">
        <TabsList>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
          <TabsTrigger value="dead-stock">Dead stock</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="pour-variance">Pour variance</TabsTrigger>
        </TabsList>
        <TabsContent value="expiry">
          <ExpiryTab />
        </TabsContent>
        <TabsContent value="dead-stock">
          <DeadStockTab />
        </TabsContent>
        <TabsContent value="forecast">
          <ForecastTab />
        </TabsContent>
        <TabsContent value="pour-variance">
          <PourVarianceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
