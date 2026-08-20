import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranches } from '@/context/BranchContext';

export default function BranchSelect() {
  const { branches, selectedBranchId, setSelectedBranchId, isLoading } =
    useBranches();

  return (
    <Select
      value={selectedBranchId ?? undefined}
      onValueChange={(v) => setSelectedBranchId(v)}
      disabled={isLoading || branches.length === 0}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        {branches
          .filter((b) => b.isActive)
          .map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
