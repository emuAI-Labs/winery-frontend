import { useItems } from './useItems';

/** For pickers that need the whole active catalogue to search through,
 * rather than a paginated table. */
export function useAllItems(branchId?: string) {
  const query = useItems({ isActive: true, limit: 500, branchId });
  return { ...query, items: query.data?.items ?? [] };
}
