import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  InventoryItem,
  ItemListResult,
  ItemCategory,
} from '../../../../shared/inventoryTypes';

export interface ItemFilters {
  branchId?: string;
  category?: ItemCategory;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  limit?: number;
  offset?: number;
}

export function useItems(filters: ItemFilters) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () =>
      apiRequest<ItemListResult>({
        method: 'GET',
        path: '/inventory/items',
        query: {
          branchId: filters.branchId,
          category: filters.category,
          search: filters.search || undefined,
          isActive:
            filters.isActive === undefined
              ? undefined
              : String(filters.isActive),
          lowStock: filters.lowStock ? 'true' : undefined,
          limit: filters.limit ?? 50,
          offset: filters.offset ?? 0,
        },
      }),
    placeholderData: (prev) => prev,
  });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ['items', 'detail', id],
    queryFn: () =>
      apiRequest<InventoryItem>({
        method: 'GET',
        path: `/inventory/items/${id}`,
      }),
    enabled: !!id,
  });
}

export interface CreateItemInput {
  sku: string;
  name: string;
  category: ItemCategory;
  stockUnit: InventoryItem['stockUnit'];
  unitVolumeMl?: number;
  costPrice: number;
  isPourable: boolean;
  defaultPourMl?: number;
  expiryTracked: boolean;
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) =>
      apiRequest<InventoryItem>({
        method: 'POST',
        path: '/inventory/items',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<CreateItemInput> & { id: string; isActive?: boolean }) =>
      apiRequest<InventoryItem>({
        method: 'PATCH',
        path: `/inventory/items/${id}`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useSetBranchStockLevels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      branchId,
      ...body
    }: {
      itemId: string;
      branchId: string;
      minLevel: number;
      maxLevel?: number;
      reorderPoint: number;
    }) =>
      apiRequest({
        method: 'PUT',
        path: `/inventory/items/${itemId}/branch-stock/${branchId}`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}
