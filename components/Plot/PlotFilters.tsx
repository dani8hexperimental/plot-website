import { statusLabels, validStatuses } from "@/lib/plots";
import type { PlotStatus } from "@/schemas/plot.schema";

interface PlotFiltersProps {
  selected: PlotStatus[];
  onChange: (statuses: PlotStatus[]) => void;
}

export default function PlotFilters({ selected, onChange }: PlotFiltersProps) {
  function toggle(status: PlotStatus) {
    if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Status
      </h3>
      <div className="space-y-2">
        {validStatuses.map((status) => (
          <label
            key={status}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(status)}
              onChange={() => toggle(status)}
              className="h-4 w-4 rounded border-zinc-300 text-foreground focus:ring-foreground"
            />
            {statusLabels[status]}
          </label>
        ))}
      </div>
    </div>
  );
}
