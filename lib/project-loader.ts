import fs from "node:fs";
import path from "node:path";
import { projectSchema } from "@/schemas/project.schema";
import { plotFeatureCollectionSchema, type PlotFeature } from "@/schemas/plot.schema";

export interface ProjectData {
  project: ReturnType<typeof projectSchema.parse>;
  plots: PlotFeature[];
  roads: unknown;
  amenities: unknown;
  zones: unknown;
}

function readJson(relativePath: string) {
  const fullPath = path.join(process.cwd(), relativePath);
  const content = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(content);
}

export function loadProject(slug: string): ProjectData {
  const basePath = `data/projects/${slug}`;

  const project = projectSchema.parse(readJson(`${basePath}/project.json`));
  const plotsCollection = plotFeatureCollectionSchema.parse(
    readJson(`${basePath}/plots.geojson`)
  );
  const roads = readJson(`${basePath}/roads.geojson`);
  const amenities = readJson(`${basePath}/amenities.geojson`);
  const zones = readJson(`${basePath}/zones.geojson`);

  const ids = new Set<string>();
  for (const feature of plotsCollection.features) {
    if (ids.has(feature.properties.id)) {
      throw new Error(`Duplicate plot id: ${feature.properties.id}`);
    }
    ids.add(feature.properties.id);
  }

  return {
    project,
    plots: plotsCollection.features,
    roads,
    amenities,
    zones,
  };
}
