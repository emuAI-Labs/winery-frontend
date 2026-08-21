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
import PaginationControls from '@/components/ui/pagination-controls';
import { useBranches } from '@/context/BranchContext';
import QueryState from '@/features/inventory/components/QueryState';
import { formatCents } from '@/lib/format';
import {
  useExpenseSummaryReport,
  useProfitabilityReport,
  useShiftVarianceReport,
} from '../hooks/useFinancialReports';
import {
  useCustomerTrends,
  usePeakHours,
  useReportsDashboard,
  useSalesSummary,
  useTopSellers,
} from '../hooks/useBiReports';
import DateRangeFilter, { DateRangeValue } from '../components/DateRangeFilter';
import ReportBuilderTab from '../components/ReportBuilderTab';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ProfitabilityTab() {
  const { selectedBranchId } = useBranches();
  const { data, isLoading, error } = useProfitabilityReport({
    branchId: selectedBranchId ?? undefined,
  });

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={(data?.items.length ?? 0) === 0}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>Qty sold</TableHead>
            <TableHead>Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((row) => (
            <TableRow key={row.menuItemId}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{formatCents(row.priceCents)}</TableCell>
              <TableCell>{formatCents(row.costCents)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatCents(row.marginCents)}
                  <Badge
                    variant={row.marginPercent >= 50 ? 'success' : 'warning'}
                  >
                    {row.marginPercent.toFixed(0)}%
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{row.quantitySold}</TableCell>
              <TableCell>{formatCents(row.revenueCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-3 text-xs text-muted-foreground">
        Cost is at today&apos;s prices, not time-of-sale — and for a menu item
        wrapping a plain inventory item (a tot, a bottled beer) cost is the
        whole bottle/case, not pro-rated by pour size, so a single spirit tot
        can show a deeply negative margin here. Only recipe-based cocktails are
        pro-rated correctly per ingredient.
      </p>
    </QueryState>
  );
}

function ShiftVarianceTab() {
  const { selectedBranchId } = useBranches();
  const [offset, setOffset] = useState(0);
  const { data, isLoading, error } = useShiftVarianceReport({
    branchId: selectedBranchId ?? undefined,
    offset,
  });

  return (
    <div className="space-y-3">
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.shiftCount} closed shift{data.shiftCount === 1 ? '' : 's'} ·
          total variance{' '}
          <span
            className={
              data.totalVarianceCents < 0
                ? 'text-destructive'
                : 'text-emerald-700'
            }
          >
            {data.totalVarianceCents >= 0 ? '+' : ''}
            {formatCents(data.totalVarianceCents)}
          </span>
        </p>
      )}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.shifts.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cashier</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Counted</TableHead>
              <TableHead>Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.shifts.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.openedBy}</TableCell>
                <TableCell>{formatCents(s.expectedCashCents)}</TableCell>
                <TableCell>{formatCents(s.countedCashCents)}</TableCell>
                <TableCell>
                  <Badge
                    variant={s.varianceCents < 0 ? 'destructive' : 'success'}
                  >
                    {s.varianceCents >= 0 ? '+' : ''}
                    {formatCents(s.varianceCents)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
      {data && (
        <PaginationControls
          offset={offset}
          limit={data.limit}
          total={data.shiftCount}
          onOffsetChange={setOffset}
        />
      )}
    </div>
  );
}

function ExpenseSummaryTab() {
  const { selectedBranchId } = useBranches();
  const { data, isLoading, error } = useExpenseSummaryReport({
    branchId: selectedBranchId ?? undefined,
  });

  return (
    <div className="space-y-3">
      {data && (
        <p className="text-sm font-medium">
          Total: {formatCents(data.totalCents)}
        </p>
      )}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.byCategory.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.byCategory.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="capitalize">{row.category}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{formatCents(row.totalCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}

function SalesSummaryTab() {
  const { selectedBranchId } = useBranches();
  const [range, setRange] = useState<DateRangeValue>({});
  const { data, isLoading, error } = useSalesSummary({
    branchId: selectedBranchId ?? undefined,
    ...range,
  });

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} />
      <QueryState isLoading={isLoading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-semibold">
                {formatCents(data.totalRevenueCents)}
              </p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Paid bills</p>
              <p className="text-xl font-semibold">{data.paidBillCount}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Orders opened</p>
              <p className="text-xl font-semibold">{data.orderCount}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Average bill</p>
              <p className="text-xl font-semibold">
                {formatCents(data.averageBillCents)}
              </p>
            </div>
          </div>
        )}
      </QueryState>
      {data && data.orderCount > data.paidBillCount && (
        <p className="text-xs text-muted-foreground">
          {data.orderCount - data.paidBillCount} order(s) opened in this window
          are not reflected in paid bills yet — likely still open or awaiting
          payment, not a reporting gap.
        </p>
      )}
    </div>
  );
}

function TopSellersTab() {
  const { selectedBranchId } = useBranches();
  const [range, setRange] = useState<DateRangeValue>({});
  const { data, isLoading, error } = useTopSellers({
    branchId: selectedBranchId ?? undefined,
    ...range,
  });

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} />
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qty sold</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((row) => (
              <TableRow key={row.menuItemId}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.quantitySold}</TableCell>
                <TableCell>{formatCents(row.revenueCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}

function PeakHoursTab() {
  const { selectedBranchId } = useBranches();
  const [range, setRange] = useState<DateRangeValue>({});
  const { data, isLoading, error } = usePeakHours({
    branchId: selectedBranchId ?? undefined,
    ...range,
  });

  const grid = new Map<string, number>();
  let max = 1;
  data?.items.forEach((row) => {
    grid.set(`${row.dayOfWeek}-${row.hour}`, row.orderCount);
    if (row.orderCount > max) max = row.orderCount;
  });

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} />
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
      >
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-1" aria-label="Day" />
                {Array.from({ length: 24 }, (_, h) => (
                  <th
                    key={h}
                    className="p-1 text-center font-normal text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_LABELS.map((label, dow) => (
                <tr key={label}>
                  <td className="pr-2 font-medium text-muted-foreground">
                    {label}
                  </td>
                  {Array.from({ length: 24 }, (_, h) => {
                    const count = grid.get(`${dow}-${h}`) ?? 0;
                    const opacity =
                      count === 0 ? 0.06 : 0.15 + (count / max) * 0.85;
                    return (
                      <td key={h} className="p-0.5">
                        <div
                          title={`${label} ${h}:00 — ${count} orders`}
                          aria-label={`${label} ${h}:00 — ${count} orders`}
                          className="h-5 w-5 rounded-sm bg-primary"
                          style={{ opacity }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Sunday = 0 in this view (Postgres convention) — different from the
          Monday-first convention used by happy-hour pricing rules elsewhere in
          the app.
        </p>
      </QueryState>
    </div>
  );
}

function CustomerTrendsTab() {
  const { selectedBranchId } = useBranches();
  const [range, setRange] = useState<DateRangeValue>({});
  const [minVisits, setMinVisits] = useState('2');
  const { data, isLoading, error } = useCustomerTrends({
    branchId: selectedBranchId ?? undefined,
    minVisits: minVisits ? parseInt(minVisits, 10) : undefined,
    ...range,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <DateRangeFilter value={range} onChange={setRange} />
        <div className="space-y-1">
          <Label htmlFor="minVisits" className="text-xs text-muted-foreground">
            Minimum visits
          </Label>
          <Input
            id="minVisits"
            type="number"
            min="1"
            className="w-24"
            value={minVisits}
            onChange={(e) => setMinVisits(e.target.value)}
          />
        </div>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ref</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Total spent</TableHead>
              <TableHead>Average spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((row) => (
              <TableRow key={row.customerRef}>
                <TableCell className="font-mono">{row.customerRef}</TableCell>
                <TableCell>{row.visitCount}</TableCell>
                <TableCell>{formatCents(row.totalSpentCents)}</TableCell>
                <TableCell>{formatCents(row.averageSpendCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
      <p className="text-xs text-muted-foreground">
        <code>customerRef</code> is free text a waiter may type when opening a
        tab (usually a phone number) — there is no customer database or identity
        resolution, so the same person entered differently across visits appears
        as separate rows.
      </p>
    </div>
  );
}

function CrossBranchDashboardTab() {
  const [range, setRange] = useState<DateRangeValue>({});
  const { data, isLoading, error } = useReportsDashboard(range);

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} />
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.branches.length ?? 0) === 0}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data?.branches.map((b) => (
            <div key={b.branchId} className="space-y-2 rounded-md border p-4">
              <h4 className="font-medium">{b.branchName}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="text-right">
                  {formatCents(b.totalRevenueCents)}
                </span>
                <span className="text-muted-foreground">Paid bills</span>
                <span className="text-right">{b.paidBillCount}</span>
                <span className="text-muted-foreground">Orders</span>
                <span className="text-right">{b.orderCount}</span>
                <span className="text-muted-foreground">Average bill</span>
                <span className="text-right">
                  {formatCents(b.averageBillCents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  );
}

export default function FinancialReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales analytics, financial reports, and saved report configurations.
          </p>
        </div>
        <BranchSelect />
      </div>
      <Tabs defaultValue="sales-summary">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales-summary">Sales summary</TabsTrigger>
          <TabsTrigger value="top-sellers">Top sellers</TabsTrigger>
          <TabsTrigger value="peak-hours">Peak hours</TabsTrigger>
          <TabsTrigger value="customer-trends">Customer trends</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="shift-variance">Shift variance</TabsTrigger>
          <TabsTrigger value="expenses">Expense summary</TabsTrigger>
          <TabsTrigger value="dashboard">Cross-branch</TabsTrigger>
          <TabsTrigger value="builder">Report builder</TabsTrigger>
        </TabsList>
        <TabsContent value="sales-summary">
          <SalesSummaryTab />
        </TabsContent>
        <TabsContent value="top-sellers">
          <TopSellersTab />
        </TabsContent>
        <TabsContent value="peak-hours">
          <PeakHoursTab />
        </TabsContent>
        <TabsContent value="customer-trends">
          <CustomerTrendsTab />
        </TabsContent>
        <TabsContent value="profitability">
          <ProfitabilityTab />
        </TabsContent>
        <TabsContent value="shift-variance">
          <ShiftVarianceTab />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseSummaryTab />
        </TabsContent>
        <TabsContent value="dashboard">
          <CrossBranchDashboardTab />
        </TabsContent>
        <TabsContent value="builder">
          <ReportBuilderTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
