import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatDate, daysUntil } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { useAssets } from '../hooks/useAssets';
import { useMaintenanceSchedules } from '../hooks/useMaintenance';
import MaintenanceScheduleDialog from '../components/MaintenanceScheduleDialog';
import LogMaintenanceDialog from '../components/LogMaintenanceDialog';
import { MaintenanceSchedule } from '../../../../shared/assetsTypes';

export default function MaintenancePage() {
  const { selectedBranchId } = useBranches();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user?.role, 'maintenance:manage');

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [logSchedule, setLogSchedule] = useState<MaintenanceSchedule | null>(
    null,
  );

  const { data: assetsData } = useAssets({
    branchId: selectedBranchId ?? undefined,
    status: 'active',
  });
  const { data, isLoading, error } = useMaintenanceSchedules({
    isActive: true,
  });

  const assetName = (assetId: string) =>
    assetsData?.items.find((a) => a.id === assetId)?.name ?? assetId;

  const branchScheduled = (data?.schedules ?? []).filter((s) =>
    assetsData?.items.some((a) => a.id === s.assetId),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Recurring upkeep for equipment — fridges, sound systems, and the
            like — with overdue items flagged.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchSelect />
          {canManage && (
            <Button
              onClick={() => setScheduleDialogOpen(true)}
              disabled={!assetsData?.items.length}
            >
              <Plus className="mr-1 h-4 w-4" /> Add schedule
            </Button>
          )}
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={branchScheduled.length === 0}
        emptyMessage={
          selectedBranchId
            ? 'No maintenance schedules for this branch yet.'
            : 'Select a branch to see its maintenance schedules.'
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Repeats every</TableHead>
              <TableHead>Next due</TableHead>
              {canManage && (
                <TableHead className="text-right">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchScheduled.map((schedule) => {
              const days = daysUntil(schedule.nextDueDate);
              return (
                <TableRow key={schedule.id}>
                  <TableCell>{assetName(schedule.assetId)}</TableCell>
                  <TableCell>{schedule.title}</TableCell>
                  <TableCell>{schedule.intervalDays} days</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDate(schedule.nextDueDate)}
                      {days < 0 && <Badge variant="destructive">Overdue</Badge>}
                      {days >= 0 && days <= 7 && (
                        <Badge variant="warning">Due soon</Badge>
                      )}
                    </div>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setLogSchedule(schedule)}
                      >
                        Log done
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </QueryState>

      <MaintenanceScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        assets={assetsData?.items ?? []}
      />
      <LogMaintenanceDialog
        open={!!logSchedule}
        onOpenChange={(v) => !v && setLogSchedule(null)}
        schedule={logSchedule}
      />
    </div>
  );
}
