import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Branch } from '../../shared/inventoryTypes';

const STORAGE_KEY = 'winery.selectedBranchId';

interface BranchContextValue {
  branches: Branch[];
  isLoading: boolean;
  selectedBranchId: string | null;
  /** null means "all branches" — only meaningful on reports that support it */
  setSelectedBranchId: (id: string | null) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: PropsWithChildren) {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () =>
      apiRequest<Branch[]>({ method: 'GET', path: '/inventory/branches' }),
    staleTime: 5 * 60_000,
  });

  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  useEffect(() => {
    if (selectedBranchId) return;
    const active = branches.find((b) => b.isActive);
    if (active) setSelectedBranchIdState(active.id);
  }, [branches, selectedBranchId]);

  const setSelectedBranchId = (id: string | null) => {
    setSelectedBranchIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<BranchContextValue>(
    () => ({ branches, isLoading, selectedBranchId, setSelectedBranchId }),
    [branches, isLoading, selectedBranchId],
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranches(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranches must be used within BranchProvider');
  return ctx;
}
