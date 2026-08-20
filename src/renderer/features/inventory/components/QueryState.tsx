import { PropsWithChildren, ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

interface QueryStateProps extends PropsWithChildren {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
}

/** Consistent loading/error/empty handling so every screen doesn't hand-roll
 * its own — a manager scanning ten tabs in one shift should see the same
 * "nothing here" and "couldn't load" treatment everywhere. */
export default function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'Nothing to show yet.',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }
  if (error) {
    const message =
      error instanceof ApiError ? error.message : 'Something went wrong.';
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {message}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }
  return children as ReactElement;
}
