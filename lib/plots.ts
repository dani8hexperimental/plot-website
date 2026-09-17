import type { PlotFeature, PlotStatus } from "@/schemas/plot.schema";

export interface PlotFilters {
  status?: PlotStatus[];
  minArea?: number;
  maxArea?: number;
  zone?: string[];
}

export function filterPlots(
  plots: PlotFeature[],
  filters: PlotFilters
): PlotFeature[] {
  return plots.filter((plot) => {
    const props = plot.properties;

    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(props.status)) return false;
    }

    if (filters.zone && filters.zone.length > 0) {
      if (!props.zone || !filters.zone.includes(props.zone)) return false;
    }

    if (filters.minArea !== undefined && props.area < filters.minArea) {
      return false;
    }

    if (filters.maxArea !== undefined && props.area > filters.maxArea) {
      return false;
    }

    return true;
  });
}

export function getPlotById(
  plots: PlotFeature[],
  id: string | null | undefined
): PlotFeature | undefined {
  if (!id) return undefined;
  return plots.find((plot) => plot.properties.id === id);
}

export function formatPrice(price: number): string {
  if (price <= 0) return "On request";
  if (price >= 10_000_000) {
    return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  }
  const lakhs = price / 100_000;
  return `₹${lakhs.toFixed(1)} Lakhs`;
}

export function pricePerSqft(
  price: number,
  areaSqft?: number
): number | null {
  if (price <= 0 || !areaSqft || areaSqft <= 0) return null;
  return price / areaSqft;
}

export function formatPricePerSqft(
  price: number,
  areaSqft?: number
): string {
  const perSqft = pricePerSqft(price, areaSqft);
  if (perSqft === null) return "On request";
  return `₹${Math.round(perSqft).toLocaleString("en-IN")} / sq.ft`;
}

export const statusColors: Record<PlotStatus, string> = {
  available: "#a5d6a7",
  reserved: "#ffe082",
  sold: "#ef9a9a",
  unavailable: "#cfd8dc",
};

export const statusLabels: Record<PlotStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Booked",
  unavailable: "Unavailable",
};

export const validStatuses: PlotStatus[] = ["available", "sold"];
