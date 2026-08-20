import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  MenuItem,
  PricingRule,
  PricingRuleType,
} from '../../../../shared/salesTypes';

export function useMenuItems(
  opts: { isActive?: boolean; search?: string } = {},
) {
  return useQuery({
    queryKey: ['menu-items', opts],
    queryFn: () =>
      apiRequest<{ items: MenuItem[]; total: number }>({
        method: 'GET',
        path: '/menu/items',
        query: {
          isActive:
            opts.isActive === undefined ? undefined : String(opts.isActive),
          search: opts.search || undefined,
          limit: 200,
        },
      }),
  });
}

export interface MenuItemInput {
  name: string;
  description?: string;
  itemId?: string;
  recipeId?: string;
  priceCents: number;
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MenuItemInput) =>
      apiRequest<MenuItem>({
        method: 'POST',
        path: '/menu/items',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<MenuItemInput> & { id: string; isActive?: boolean }) =>
      apiRequest<MenuItem>({
        method: 'PATCH',
        path: `/menu/items/${id}`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

export function usePricingRules(menuItemId: string | undefined) {
  return useQuery({
    queryKey: ['pricing-rules', menuItemId],
    queryFn: () =>
      apiRequest<PricingRule[]>({
        method: 'GET',
        path: `/menu/items/${menuItemId}/pricing-rules`,
      }),
    enabled: !!menuItemId,
  });
}

export interface PricingRuleInput {
  type: PricingRuleType;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  discountPercent: number;
  minQuantity?: number;
}

export function useCreatePricingRule(menuItemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PricingRuleInput) =>
      apiRequest<PricingRule>({
        method: 'POST',
        path: `/menu/items/${menuItemId}/pricing-rules`,
        body: input,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['pricing-rules', menuItemId] }),
  });
}

export function useUpdatePricingRule(menuItemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<PricingRuleInput> & { id: string; isActive?: boolean }) =>
      apiRequest<PricingRule>({
        method: 'PATCH',
        path: `/menu/pricing-rules/${id}`,
        body,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['pricing-rules', menuItemId] }),
  });
}
