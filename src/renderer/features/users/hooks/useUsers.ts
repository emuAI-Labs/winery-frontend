import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { AuthUser, UserRole, UserStatus } from '../../../../shared/authTypes';

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  branch?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UserListResult {
  items: AuthUser[];
  total: number;
  limit: number;
  offset: number;
}

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () =>
      apiRequest<UserListResult>({
        method: 'GET',
        path: '/users',
        query: {
          role: filters.role,
          status: filters.status,
          branch: filters.branch || undefined,
          search: filters.search || undefined,
          limit: filters.limit ?? 25,
          offset: filters.offset ?? 0,
        },
      }),
    placeholderData: (prev) => prev,
  });
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  employeeCode?: string;
  phone?: string;
  email?: string;
  branch?: string;
  mustChangePassword?: boolean;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiRequest<{ user: AuthUser }>({
        method: 'POST',
        path: '/users',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export interface UpdateUserInput {
  id: string;
  fullName?: string;
  employeeCode?: string | null;
  phone?: string | null;
  email?: string | null;
  branch?: string | null;
  role?: UserRole;
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserInput) =>
      apiRequest<{ user: AuthUser }>({
        method: 'PATCH',
        path: `/users/${id}`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: UserStatus;
      reason?: string;
    }) =>
      apiRequest<{ user: AuthUser }>({
        method: 'PATCH',
        path: `/users/${id}/status`,
        body: { status, reason: reason || undefined },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useResetUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      newPassword,
      mustChangePassword = true,
    }: {
      id: string;
      newPassword: string;
      mustChangePassword?: boolean;
    }) =>
      apiRequest<{ message: string }>({
        method: 'POST',
        path: `/users/${id}/reset-password`,
        body: { newPassword, mustChangePassword },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
