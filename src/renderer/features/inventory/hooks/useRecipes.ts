import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Recipe, RecipeIngredient } from '../../../../shared/inventoryTypes';

export function useRecipes(includeInactive = false) {
  return useQuery({
    queryKey: ['recipes', { includeInactive }],
    queryFn: () =>
      apiRequest<{ recipes: Recipe[] }>({
        method: 'GET',
        path: '/inventory/recipes',
        query: { includeInactive: includeInactive ? 'true' : undefined },
      }),
    select: (data) => data.recipes,
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
