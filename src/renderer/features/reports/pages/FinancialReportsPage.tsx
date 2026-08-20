import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import QueryState from '@/features/inventory/components/QueryState';
import { formatCents } from '@/lib/format';
import {
  useExpenseSummaryReport,
  useProfitabilityReport,
  useShiftVarianceReport,
} from '../hooks/useFinancialReports';

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
    </QueryState>
  );
}

function ShiftVarianceTab() {
  const { selectedBranchId } = useBranches();
  const { data, isLoading, error } = useShiftVarianceReport({
    branchId: selectedBranchId ?? undefined,
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

export default function FinancialReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financial reports</h1>
          <p className="text-sm text-muted-foreground">
            Profitability, cashier variance, and expenses.
          </p>
        </div>
        <BranchSelect />
      </div>
      <Tabs defaultValue="profitability">
        <TabsList>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="shift-variance">Shift variance</TabsTrigger>
          <TabsTrigger value="expenses">Expense summary</TabsTrigger>
        </TabsList>
        <TabsContent value="profitability">
          <ProfitabilityTab />
        </TabsContent>
        <TabsContent value="shift-variance">
          <ShiftVarianceTab />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseSummaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
