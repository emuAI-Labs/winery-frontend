import { useState } from 'react';
import { Plus, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import QueryState from '@/features/inventory/components/QueryState';
import PaginationControls from '@/components/ui/pagination-controls';
import { formatDateTime } from '@/lib/format';
import {
  useReportDefinitions,
  useReportSchedules,
  useRunReportDefinition,
} from '../hooks/useReportDefinitions';
import CreateDefinitionDialog from './CreateDefinitionDialog';
import ScheduleDialog from './ScheduleDialog';

export default function ReportBuilderTab() {
  const [offset, setOffset] = useState(0);
  const {
    data: definitions,
    isLoading,
    error,
  } = useReportDefinitions({ offset });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const {
    data: runResult,
    isFetching: running,
    refetch,
  } = useRunReportDefinition(selectedId ?? undefined);
  const { data: schedules } = useReportSchedules(selectedId ?? undefined);

  const selected = definitions?.items.find((d) => d.id === selectedId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Saved reports</h3>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </div>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={(definitions?.items.length ?? 0) === 0}
          emptyMessage="No saved reports yet."
        >
          <div className="space-y-2">
            {definitions?.items.map((def) => (
              <button
                key={def.id}
                type="button"
                onClick={() => setSelectedId(def.id)}
                className={`w-full rounded-md border p-3 text-left text-sm transition-colors hover:border-primary ${
                  def.id === selectedId ? 'border-primary bg-accent' : ''
                }`}
              >
                <div className="font-medium">{def.name}</div>
                <Badge variant="secondary" className="mt-1">
                  {def.reportType.replace('_', ' ')}
                </Badge>
              </button>
            ))}
          </div>
        </QueryState>
        {definitions && (
          <PaginationControls
            offset={offset}
            limit={definitions.limit}
            total={definitions.total}
            onOffsetChange={setOffset}
          />
        )}
      </div>

      <div className="space-y-4 lg:col-span-2">
        {!selected && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Select a saved report, or create one.
          </p>
        )}
        {selected && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Created {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={running}
                >
                  <Play className="mr-1 h-3.5 w-3.5" />{' '}
                  {running ? 'Running…' : 'Run'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setScheduleOpen(true)}
                >
                  <Clock className="mr-1 h-3.5 w-3.5" /> Email this on a
                  schedule
                </Button>
              </div>
            </div>

            {runResult !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(runResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {schedules && schedules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Email schedules
                </h4>
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="space-y-1 rounded-md border p-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{s.frequency}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.recipientEmails.join(', ')}
                      </span>
                      <Badge variant={s.isActive ? 'success' : 'secondary'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.lastRunStatus === 'sent' &&
                        `Last sent ${formatDateTime(s.lastRunAt as string)}`}
                      {s.lastRunStatus === 'skipped' &&
                        'Not sent last time — ask your admin to check the email setup.'}
                      {s.lastRunStatus === 'failed' &&
                        `Failed to send${s.lastRunError ? `: ${s.lastRunError}` : ''}`}
                      {!s.lastRunStatus &&
                        `Hasn't run yet — next one goes out ${formatDateTime(s.nextRunAt)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <CreateDefinitionDialog open={createOpen} onOpenChange={setCreateOpen} />
      {selected && (
        <ScheduleDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          definitionId={selected.id}
        />
      )}
    </div>
  );
}
