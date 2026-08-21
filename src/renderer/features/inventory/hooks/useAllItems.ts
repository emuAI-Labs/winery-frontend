import { useItems } from './useItems';

/** For pickers that need the whole active catalogue to search through,
 * rather than a paginated table. API caps `limit` at 100. */
export function useAllItems(branchId?: string) {
  const query = useItems({ isActive: true, limit: 100, branchId });
  return { ...query, items: query.data?.items ?? [] };
}
