import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { LossRecord, LossType } from '../../../../shared/inventoryTypes';

export interface LossInput {
  itemId: string;
  branchId: string;
  lossType: LossType;
  quantity: number;
  reasonCode: string;
  supplierCreditNoteRef?: string;
  notes?: string;
}

/** There is no GET /inventory/losses yet (see integration guide's "known
 * gaps"), so we keep a client-side session log by appending each successful
 * submission into the 'losses-session-log' query cache — good enough for
 * "what did I just log" recall in one sitting, not a substitute for real
 * history once the backend adds a list endpoint. */
export function useRecordLoss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LossInput) =>
      apiRequest<LossRecord>({
        method: 'POST',
        path: '/inventory/losses',
        body: input,
      }),
    onSuccess: (record) => {
      qc.setQueryData<LossRecord[]>(['losses-session-log'], (prev = []) => [
        record,
        ...prev,
      ]);
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}
