import { useCallback, useEffect, useState } from 'react';

export interface RecentStockCount {
  id: string;
  branchId: string;
  openedAt: string;
}

const STORAGE_KEY = 'winery.recentStockCounts';
const MAX_ENTRIES = 25;

function load(): RecentStockCount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentStockCount[]) : [];
  } catch {
    return [];
  }
}

/** The API has no GET list endpoint for stock counts (only open/detail/
 * lines/submit) — this keeps a local index of counts opened from this app
 * so staff can find their way back to an in-progress count. It's a
 * convenience index, not a source of truth; the detail screen always
 * refetches the real record. */
export function useRecentStockCounts(branchId: string | undefined) {
  const [all, setAll] = useState<RecentStockCount[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [all]);

  const record = useCallback((entry: RecentStockCount) => {
    setAll((prev) =>
      [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES),
    );
  }, []);

  const forBranch = branchId ? all.filter((e) => e.branchId === branchId) : all;
  return { recent: forBranch, record };
}
