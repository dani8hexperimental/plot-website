import { z } from "zod";

export const plotStatusSchema = z.enum([
  "available",
  "reserved",
  "sold",
  "unavailable",
]);

export const plotPropertiesSchema = z.object({
  id: z.string(),
  number: z.string(),
  area: z.number().positive(),
  areaSqft: z.number().positive().optional(),
  dimensions: z.string().optional(),
  status: plotStatusSchema,
  ownership: z.enum(["owner", "developer"]).optional(),
  price: z.number().nonnegative(),
  facing: z.enum(["North", "South", "East", "West"]).optional(),
  roadWidth: z.number().positive().optional(),
  zone: z.string().optional(),
});

export const geoJsonPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const geoJsonLineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const geoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

export const plotFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: plotPropertiesSchema,
  geometry: geoJsonPolygonSchema,
});

export const plotFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(plotFeatureSchema),
});

export type PlotStatus = z.infer<typeof plotStatusSchema>;
export type PlotProperties = z.infer<typeof plotPropertiesSchema>;
export type PlotFeature = z.infer<typeof plotFeatureSchema>;
export type PlotFeatureCollection = z.infer<typeof plotFeatureCollectionSchema>;
