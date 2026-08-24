import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import QueryState from '@/features/inventory/components/QueryState';
import { formatDateTime } from '@/lib/format';
import { useAuditLog } from '../hooks/useAuditLog';

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useAuditLog({
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every void, discount, stock adjustment, and asset change, with who did
          it and when — for reviewing after the fact, not for undoing anything
          here.
        </p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="auditAction">Action contains</Label>
          <Input
            id="auditAction"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. sale.void"
            className="w-56"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="auditFrom">From</Label>
          <Input
            id="auditFrom"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="auditTo">To</Label>
          <Input
            id="auditTo"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {(action || from || to) && (
          <Button
            variant="outline"
            onClick={() => {
              setAction('');
              setFrom('');
              setTo('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage="No matching audit entries."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(row.id)}
                >
                  <TableCell>
                    {expanded.has(row.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.action}
                  </TableCell>
                  <TableCell>
                    {row.actorUsername ?? '—'}
                    {row.actorRole && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({row.actorRole})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.targetUsername ?? row.targetId ?? '—'}
                  </TableCell>
                </TableRow>
                {expanded.has(row.id) && (
                  <TableRow>
                    <TableCell />
                    <TableCell colSpan={4}>
                      <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(
                          {
                            ipAddress: row.ipAddress,
                            sessionId: row.sessionId,
                            metadata: row.metadata,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}
