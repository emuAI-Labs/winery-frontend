import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DateRangeValue {
  from?: string;
  to?: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

/** The API takes a from/to ISO-datetime window with no relative-range
 * shorthand — the actual timestamps have to be computed and sent by the
 * client. Plain date inputs, converted to start/end-of-day ISO strings. */
export default function DateRangeFilter({
  value,
  onChange,
}: DateRangeFilterProps) {
  const fromDate = value.from ? value.from.slice(0, 10) : '';
  const toDate = value.to ? value.to.slice(0, 10) : '';

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
          From
        </Label>
        <Input
          id="dateFrom"
          type="date"
          value={fromDate}
          onChange={(e) =>
            onChange({
              ...value,
              from: e.target.value
                ? `${e.target.value}T00:00:00.000Z`
                : undefined,
            })
          }
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
          To
        </Label>
        <Input
          id="dateTo"
          type="date"
          value={toDate}
          onChange={(e) =>
            onChange({
              ...value,
              to: e.target.value
                ? `${e.target.value}T23:59:59.999Z`
                : undefined,
            })
          }
        />
      </div>
      {(value.from || value.to) && (
        <button
          type="button"
          className="pb-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onChange({})}
        >
          Clear
        </button>
      )}
    </div>
  );
}
