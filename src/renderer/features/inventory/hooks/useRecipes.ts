import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  Recipe,
  RecipeIngredient,
  RecipeSummary,
} from '../../../../shared/inventoryTypes';

export interface RecipeListResult {
  items: RecipeSummary[];
  total: number;
  limit: number;
  offset: number;
}

export function useRecipes(
  opts: {
    includeInactive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  return useQuery({
    queryKey: ['recipes', opts],
    queryFn: () =>
      apiRequest<RecipeListResult>({
        method: 'GET',
        path: '/inventory/recipes',
        query: {
          includeInactive: opts.includeInactive ? 'true' : undefined,
          search: opts.search || undefined,
          limit: opts.limit ?? 25,
          offset: opts.offset ?? 0,
        },
      }),
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipes', 'detail', id],
    queryFn: () =>
      apiRequest<Recipe>({ method: 'GET', path: `/inventory/recipes/${id}` }),
    enabled: !!id,
  });
}

export interface RecipeInput {
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeInput) =>
      apiRequest<Recipe>({
        method: 'POST',
        path: '/inventory/recipes',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<RecipeInput> & { id: string; isActive?: boolean }) =>
      apiRequest<Recipe>({
        method: 'PATCH',
        path: `/inventory/recipes/${id}`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
