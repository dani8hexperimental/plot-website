import { statusColors, statusLabels } from "@/lib/plots";
import { validStatuses } from "@/lib/plots";

export default function PlotLegend() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Legend
      </h3>
      <div className="space-y-2">
        {validStatuses.map((status) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: statusColors[status] }}
            />
            {statusLabels[status]}
          </div>
        ))}
      </div>
    </div>
  );
}
