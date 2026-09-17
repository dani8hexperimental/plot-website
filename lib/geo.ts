import type { PlotFeature } from "@/schemas/plot.schema";

export function getPlotCenter(plot: PlotFeature): [number, number] {
  const coords = plot.geometry.coordinates[0];
  let lng = 0;
  let lat = 0;
  for (const [cLng, cLat] of coords) {
    lng += cLng;
    lat += cLat;
  }
  return [lng / coords.length, lat / coords.length];
}

export function polygonBounds(
  coordinates: [number, number][]
): [[number, number], [number, number]] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

const SQ_METER_TO_SQ_FT = 10.7639104;

export function squareMetersToSquareFeet(area: number): number {
  return area * SQ_METER_TO_SQ_FT;
}

export function formatArea(area: number): string {
  return `${Math.round(squareMetersToSquareFeet(area)).toLocaleString("en-IN")} sq.ft`;
}

export function formatAreaSqMeters(area: number): string {
  return `${area.toLocaleString("en-IN")} sq.m`;
}
