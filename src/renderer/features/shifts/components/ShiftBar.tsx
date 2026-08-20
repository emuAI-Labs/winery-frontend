import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useBranches } from '@/context/BranchContext';
import { useActiveShift } from '../hooks/useShifts';
import OpenShiftDialog from './OpenShiftDialog';
import CloseShiftDialog from './CloseShiftDialog';

/** Lives in the app header. A shift is not required to open an order (a
 * walk-in sale with no active shift still works — it just won't show up in
 * that day's cash-up), so this nudges rather than blocks. */
export default function ShiftBar() {
  const user = useAuthStore((s) => s.user);
  const { selectedBranchId } = useBranches();
  const { data: shift } = useActiveShift(
    user?.id,
    selectedBranchId ?? undefined,
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);

  if (!selectedBranchId) return null;

  return (
    <div className="flex items-center gap-2">
      {shift ? (
        <>
          <Badge variant="success" className="gap-1">
            <Clock className="h-3 w-3" /> Shift open
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCloseDialog(true)}
          >
            Close shift
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpenDialog(true)}>
          <Clock className="mr-1 h-3.5 w-3.5" /> Open shift
        </Button>
      )}
      <OpenShiftDialog open={openDialog} onOpenChange={setOpenDialog} />
      <CloseShiftDialog
        open={closeDialog}
        onOpenChange={setCloseDialog}
        shift={shift ?? null}
      />
    </div>
  );
}
