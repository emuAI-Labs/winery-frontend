import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BranchSelect from '@/components/inventory/BranchSelect';
import { useBranches } from '@/context/BranchContext';
import QueryState from '@/features/inventory/components/QueryState';
import { formatCents } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import {
  useAssetLossRate,
  useReusableAssetTypes,
} from '../hooks/useReusableAssets';
import AssetTypeFormDialog from '../components/AssetTypeFormDialog';
import AssetStockActionDialog, {
  StockActionMode,
} from '../components/AssetStockActionDialog';
import { ReusableAssetType } from '../../../../shared/assetsTypes';

export default function ReusableAssetsPage() {
  const { selectedBranchId } = useBranches();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user?.role, 'assets:manage');
  const canReportLoss = hasPermission(user?.role, 'assets:report-loss');

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [stockDialog, setStockDialog] = useState<{
    mode: StockActionMode;
    assetType: ReusableAssetType;
  } | null>(null);

  const { data, isLoading, error } = useReusableAssetTypes({
    branchId: selectedBranchId ?? undefined,
  });
  const { data: lossRate } = useAssetLossRate({
    branchId: selectedBranchId ?? undefined,
    sinceDays: 30,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Glassware, kegs & crates</h1>
          <p className="text-sm text-muted-foreground">
            Reusable items that wear out or go missing over time, tracked by
            branch stock rather than a purchase date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchSelect />
          {canManage && (
            <Button onClick={() => setTypeDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add item type
            </Button>
          )}
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage="No reusable item types set up yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Replacement cost</TableHead>
              <TableHead>On hand</TableHead>
              {(canManage || canReportLoss) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell className="capitalize">{type.category}</TableCell>
                <TableCell>{formatCents(type.unitValueCents)}</TableCell>
                <TableCell>
                  {selectedBranchId
                    ? (type.branchStock?.quantityOnHand ?? 0)
                    : 'Select a branch'}
                </TableCell>
                {(canManage || canReportLoss) && (
                  <TableCell className="space-x-2 text-right">
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStockDialog({ mode: 'receive', assetType: type })
                        }
                      >
                        Receive
                      </Button>
                    )}
                    {canReportLoss && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStockDialog({ mode: 'loss', assetType: type })
                        }
                      >
                        Report loss
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStockDialog({ mode: 'adjust', assetType: type })
                        }
                      >
                        Adjust count
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      {lossRate && lossRate.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Loss rate — last 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Acquired</TableHead>
                  <TableHead>Lost</TableHead>
                  <TableHead>Broken</TableHead>
                  <TableHead>Loss rate</TableHead>
                  <TableHead>Value lost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lossRate.items.map((row) => (
                  <TableRow key={row.assetTypeId}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.acquired}</TableCell>
                    <TableCell>{row.lost}</TableCell>
                    <TableCell>{row.broken}</TableCell>
                    <TableCell>{row.lossRatePercent.toFixed(1)}%</TableCell>
                    <TableCell>{formatCents(row.valueLostCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AssetTypeFormDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
      />
      <AssetStockActionDialog
        open={!!stockDialog}
        onOpenChange={(v) => !v && setStockDialog(null)}
        mode={stockDialog?.mode ?? 'receive'}
        assetType={stockDialog?.assetType ?? null}
        branchId={selectedBranchId}
      />
    </div>
  );
}
