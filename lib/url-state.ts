import type { PlotStatus } from "@/schemas/plot.schema";
import type { PlotFilters } from "@/lib/plots";
import { validStatuses } from "@/lib/plots";

export interface UrlState {
  plot?: string;
  status?: PlotStatus[];
  zone?: string[];
}

export function parseUrlState(searchParams: URLSearchParams): UrlState {
  const state: UrlState = {};

  const plot = searchParams.get("plot");
  if (plot) state.plot = plot;

  const statusParam = searchParams.get("status");
  if (statusParam) {
    state.status = statusParam
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is PlotStatus =>
        validStatuses.includes(s as PlotStatus)
      ) as PlotStatus[];
  }

  const zoneParam = searchParams.get("zone");
  if (zoneParam) {
    state.zone = zoneParam.split(",").map((s) => s.trim());
  }

  return state;
}

export function toFilterParams(state: UrlState): PlotFilters {
  return {
    status: state.status,
    zone: state.zone,
  };
}

export function buildUrl(
  base: string,
  state: UrlState,
  replace?: Partial<UrlState>
): string {
  const next = { ...state, ...replace };
  const params = new URLSearchParams();

  if (next.plot) params.set("plot", next.plot);

  if (next.status && next.status.length > 0) {
    params.set("status", next.status.join(","));
  }

  if (next.zone && next.zone.length > 0) {
    params.set("zone", next.zone.join(","));
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
