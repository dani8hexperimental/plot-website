import type { PlotFeature } from "@/schemas/plot.schema";
import { formatPrice, formatPricePerSqft, statusColors, statusLabels } from "@/lib/plots";
import { formatArea, formatAreaSqMeters } from "@/lib/geo";

interface PlotDetailsProps {
  plot: PlotFeature;
  onClose: () => void;
}

export default function PlotDetails({ plot, onClose }: PlotDetailsProps) {
  const props = plot.properties;

  return (
    <div className="plot-details-enter w-full rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{props.number}</h2>
          <p className="text-sm text-zinc-500">Plot ID: {props.id}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close plot details"
        >
          ✕
        </button>
      </div>

      <span
        className="inline-block rounded-full px-3 py-1 text-sm font-medium"
        style={{
          backgroundColor: `${statusColors[props.status]}20`,
          color: statusColors[props.status],
        }}
      >
        {statusLabels[props.status]}
      </span>

      <dl className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Area
          </dt>
          <dd className="text-lg font-semibold">
            {props.areaSqft
              ? `${props.areaSqft.toLocaleString("en-IN")} sq.ft`
              : formatArea(props.area)}
            <span className="block text-xs font-normal text-zinc-500">
              {formatAreaSqMeters(props.area)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Price / sq.ft
          </dt>
          <dd className="text-lg font-semibold">
            {formatPricePerSqft(props.price, props.areaSqft)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total price
          </dt>
          <dd className="text-lg font-semibold">{formatPrice(props.price)}</dd>
        </div>
        {props.dimensions && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Dimensions
            </dt>
            <dd className="font-medium">{props.dimensions}</dd>
          </div>
        )}
        {props.ownership && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Allocation
            </dt>
            <dd className="font-medium capitalize">{props.ownership}</dd>
          </div>
        )}
        {props.facing && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Facing
            </dt>
            <dd className="font-medium">{props.facing}</dd>
          </div>
        )}
        {props.roadWidth && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Road Width
            </dt>
            <dd className="font-medium">{props.roadWidth} m</dd>
          </div>
        )}
        {props.zone && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Zone
            </dt>
            <dd className="font-medium">{props.zone}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex gap-3">
        <button className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          View Images
        </button>
        <button className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Get Directions
        </button>
      </div>
    </div>
  );
}
