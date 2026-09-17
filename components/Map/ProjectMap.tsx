"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/schemas/project.schema";
import type { PlotFeature, PlotProperties, PlotStatus } from "@/schemas/plot.schema";
import { formatPrice, statusColors, statusLabels } from "@/lib/plots";
import { formatArea, getPlotCenter } from "@/lib/geo";

import type { FilterSpecification, GeoJSONSource, Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface ProjectMapProps {
  project: Project;
  plots: PlotFeature[];
  roads: unknown;
  amenities: unknown;
  zones: unknown;
  selectedPlotId?: string | null;
  filteredPlotIds?: Set<string>;
  onSelectPlot: (id: string | null) => void;
}

const WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

const FLOAT_LIFT_PX = 22;

// how much the selected plot grows when it floats up
const FLOAT_SCALE = 2;

const SOURCE_IDS = {
  mask: "mask",
  zones: "zones",
  roads: "roads",
  plots: "plots",
  plotLabelPoints: "plot-label-points",
  amenities: "amenities",
  selected: "selected-plot",
};

const LAYER_IDS = {
  mask: "mask-fill",
  zonesFill: "zones-fill",
  zonesBorder: "zones-border",
  roads: "roads-line",
  plotsShadow: "plots-shadow",
  plotsAccent: "plots-accent",
  plotsBorder: "plots-border",
  plotsHoverFill: "plots-hover-fill",
  plotsHoverBorder: "plots-hover-border",
  plotsLabel: "plots-label",
  amenitiesFill: "amenities-fill",
  amenitiesBorder: "amenities-border",
  amenitiesLabel: "amenities-label",
  selectedFill: "selected-plot-fill",
  selectedBorder: "selected-plot-border",
  selectedLabel: "selected-plot-label",
};

const PLOT_STATUSES: PlotStatus[] = [
  "available",
  "reserved",
  "sold",
  "unavailable",
];

const osmStyle = {
  version: 8 as const,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      // OSM's tile server tops out at z19; overzoom covers higher zoom levels.
      maxzoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
    },
  ],
};

function emptyFeatureCollection() {
  return {
    type: "FeatureCollection" as const,
    features: [],
  };
}

function buildPlotHoverContent(properties: PlotProperties): HTMLElement {
  const root = document.createElement("div");
  root.className = "plot-hover-card";

  const title = document.createElement("strong");
  title.className = "plot-hover-title";
  title.textContent = `Plot ${properties.number}`;
  root.appendChild(title);

  const status = document.createElement("span");
  status.className = "plot-hover-status";
  status.style.color = statusColors[properties.status];
  status.textContent = statusLabels[properties.status];
  root.appendChild(status);

  const facts = document.createElement("div");
  facts.className = "plot-hover-facts";
  for (const [label, value] of [
    ["Area", formatArea(properties.area)],
    ["Price", formatPrice(properties.price)],
  ]) {
    const fact = document.createElement("span");
    fact.textContent = `${label}: ${value}`;
    facts.appendChild(fact);
  }
  root.appendChild(facts);

  return root;
}

function buildPlotSelectedContent(properties: PlotProperties): HTMLElement {
  const root = document.createElement("div");
  root.className = "plot-selected-card";

  const heading = document.createElement("div");
  heading.className = "plot-selected-heading";

  const title = document.createElement("strong");
  title.textContent = `Plot ${properties.number}`;
  heading.appendChild(title);

  const status = document.createElement("span");
  status.className = "plot-selected-status";
  status.style.color = statusColors[properties.status];
  status.style.backgroundColor = `${statusColors[properties.status]}20`;
  status.textContent = statusLabels[properties.status];
  heading.appendChild(status);
  root.appendChild(heading);

  const facts = document.createElement("div");
  facts.className = "plot-selected-facts";
  const entries: Array<[string, string]> = [
    [
      "Area",
      properties.areaSqft
        ? `${properties.areaSqft.toLocaleString("en-IN")} sq.ft`
        : formatArea(properties.area),
    ],
    ["Dimensions", properties.dimensions ?? "Not specified"],
    ["Price", formatPrice(properties.price)],
  ];

  if (properties.facing) entries.push(["Facing", properties.facing]);
  if (properties.roadWidth) {
    entries.push(["Road width", `${properties.roadWidth} m`]);
  }
  if (properties.ownership) {
    entries.push([
      "Allocation",
      properties.ownership === "developer" ? "Developer" : "Owner",
    ]);
  }

  for (const [label, value] of entries) {
    const fact = document.createElement("div");
    const factLabel = document.createElement("span");
    factLabel.className = "plot-selected-fact-label";
    factLabel.textContent = label;
    const factValue = document.createElement("strong");
    factValue.textContent = value;
    fact.append(factLabel, factValue);
    facts.appendChild(fact);
  }
  root.appendChild(facts);

  return root;
}

function scalePlot(plot: PlotFeature, scale: number): PlotFeature {
  const [centerLng, centerLat] = getPlotCenter(plot);
  return {
    ...plot,
    geometry: {
      type: "Polygon",
      coordinates: plot.geometry.coordinates.map((ring) =>
        ring.map(
          ([lng, lat]) =>
            [
              centerLng + (lng - centerLng) * scale,
              centerLat + (lat - centerLat) * scale,
            ] as [number, number]
        )
      ),
    },
  };
}

function buildMask(zonesGeoJson: unknown): GeoJSON.FeatureCollection {
  const collection = zonesGeoJson as GeoJSON.FeatureCollection;
  const boundary = collection.features[0]?.geometry as
    | GeoJSON.Polygon
    | undefined;
  const boundaryRing = boundary?.coordinates[0] ?? [];

  const lngs = boundaryRing.map((pos) => pos[0]);
  const lats = boundaryRing.map((pos) => pos[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const padding = 0.1;

  // Local outer ring around the project area (avoids antimeridian issues).
  const outerRing: [number, number][] = [
    [minLng - padding, minLat - padding],
    [maxLng + padding, minLat - padding],
    [maxLng + padding, maxLat + padding],
    [minLng - padding, maxLat + padding],
    [minLng - padding, minLat - padding],
  ];

  // Hole ring: reversed boundary, properly closed with its own first point.
  const holePts = boundaryRing
    .slice(0, -1)
    .reverse()
    .map((pos) => [pos[0], pos[1]] as [number, number]);
  const hole: [number, number][] =
    holePts.length > 0 ? [...holePts, holePts[0]] : [];

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: hole.length > 0 ? [outerRing, hole] : [outerRing],
        },
      },
    ],
  };
}

function applyFilter(map: Map, filteredPlotIds?: Set<string>) {
  if (!map.getLayer(LAYER_IDS.plotsBorder)) return;

  const idFilter: FilterSpecification | null =
    filteredPlotIds && filteredPlotIds.size > 0
      ? ([
          "any",
          ...Array.from(filteredPlotIds).map((id) => ["==", "id", id]),
        ] as FilterSpecification)
      : null;

  for (const status of PLOT_STATUSES) {
    const layerFilter: FilterSpecification = idFilter
      ? (["all", ["==", "status", status], idFilter] as FilterSpecification)
      : (["==", "status", status] as FilterSpecification);
    map.setFilter(`plots-fill-${status}`, layerFilter);
  }

  if (idFilter) {
    map.setFilter(LAYER_IDS.plotsBorder, idFilter);
    map.setFilter(LAYER_IDS.plotsLabel, idFilter);
  } else {
    map.setFilter(LAYER_IDS.plotsBorder, null);
    map.setFilter(LAYER_IDS.plotsLabel, null);
  }
}

function applySelected(
  map: Map,
  plots: PlotFeature[],
  selectedPlotId?: string | null,
  animationFrameRef?: { current: number | null },
  lastSelectedRef?: { current: PlotFeature | null },
  defaultZoom?: number,
  selectedPopupRef?: {
    current: {
      remove: () => void;
      setLngLat: (lngLat: [number, number]) => unknown;
      setDOMContent: (element: HTMLElement) => unknown;
      addTo: (map: Map) => unknown;
    } | null;
  }
) {
  if (animationFrameRef?.current !== null && animationFrameRef?.current !== undefined) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  const selected = plots.find((p) => p.properties.id === selectedPlotId);
  const source = map.getSource(SOURCE_IDS.selected) as
    | GeoJSONSource
    | undefined;

  // 2D float: plot slides up on screen while growing slightly
  const setLift = (liftPx: number) => {
    if (map.getLayer(LAYER_IDS.selectedFill)) {
      map.setPaintProperty(LAYER_IDS.selectedFill, "fill-translate", [0, -liftPx]);
    }
    if (map.getLayer(LAYER_IDS.selectedBorder)) {
      map.setPaintProperty(LAYER_IDS.selectedBorder, "line-translate", [0, -liftPx]);
    }
    if (map.getLayer(LAYER_IDS.selectedLabel)) {
      map.setPaintProperty(LAYER_IDS.selectedLabel, "text-translate", [0, -liftPx]);
    }
  };

  if (source) {
    if (!selected) {
      // unfocus: glide the floating copy back down to its footprint
      const previous = lastSelectedRef?.current;
      if (previous && animationFrameRef) {
        const startedAt = performance.now();
        const duration = 500;
        const animate = (now: number) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          source.setData({
            type: "FeatureCollection",
            features: [scalePlot(previous, 1 + FLOAT_SCALE * (1 - eased))],
          } as GeoJSON.FeatureCollection);
          setLift((1 - eased) * FLOAT_LIFT_PX);
          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            source.setData(emptyFeatureCollection());
            setLift(0);
            animationFrameRef.current = null;
          }
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        source.setData(emptyFeatureCollection());
        setLift(0);
      }
      if (lastSelectedRef) lastSelectedRef.current = null;
      if (defaultZoom !== undefined && map.getZoom() > defaultZoom + 0.05) {
        map.easeTo({ zoom: defaultZoom, duration: 550, essential: false });
      }
    } else {
      // the floating copy keeps the plot's own fill so it reads as the
      // plot itself lifted off the layout, not an empty outline
      map.setPaintProperty(
        LAYER_IDS.selectedFill,
        "fill-color",
        statusColors[selected.properties.status]
      );
      map.setPaintProperty(LAYER_IDS.selectedFill, "fill-opacity", 0.92);
      if (lastSelectedRef) lastSelectedRef.current = selected;
      if (!animationFrameRef) {
        source.setData({
          type: "FeatureCollection",
          features: [selected],
        } as GeoJSON.FeatureCollection);
        setLift(FLOAT_LIFT_PX);
      } else {
      const startedAt = performance.now();
      const duration = 900;
      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        // slight overshoot so the plot pops up and settles into place
        const spring =
          1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2);
        const liftEase = 1 - Math.pow(1 - progress, 3);
        source.setData({
          type: "FeatureCollection",
          features: [scalePlot(selected, 1 + FLOAT_SCALE * spring)],
        } as GeoJSON.FeatureCollection);
        setLift(liftEase * FLOAT_LIFT_PX);

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            animationFrameRef.current = null;
          }
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
  }

  if (selected) {
    const [lng, lat] = getPlotCenter(selected);
    map.flyTo({ center: [lng, lat], zoom: 20, essential: true });
    const popup = selectedPopupRef?.current;
    if (popup) {
      popup.setLngLat([lng, lat]);
      popup.setDOMContent(buildPlotSelectedContent(selected.properties));
      popup.addTo(map);
    }
  } else {
    selectedPopupRef?.current?.remove();
  }
}

export default function ProjectMap({
  project,
  plots,
  roads,
  amenities,
  zones,
  selectedPlotId,
  filteredPlotIds,
  onSelectPlot,
}: ProjectMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const hoverPopupRef = useRef<{ remove: () => void } | null>(null);
  const selectedPopupRef = useRef<{
    remove: () => void;
    setLngLat: (lngLat: [number, number]) => unknown;
    setDOMContent: (element: HTMLElement) => unknown;
    addTo: (map: Map) => unknown;
  } | null>(null);
  const hoveredPlotIdRef = useRef<string | null>(null);
  const selectedAnimationFrameRef = useRef<number | null>(null);
  const lastSelectedRef = useRef<PlotFeature | null>(null);
  const selectedPlotIdRef = useRef(selectedPlotId);
  const filteredPlotIdsRef = useRef(filteredPlotIds);

  useEffect(() => {
    selectedPlotIdRef.current = selectedPlotId;
    filteredPlotIdsRef.current = filteredPlotIds;
  }, [filteredPlotIds, selectedPlotId]);

  // Initialize map once.
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let disposed = false;

    async function init() {
      const lib = await import("maplibre-gl");
      if (disposed) return;

      // Next.js bundlers drop the worker's sibling dependency, so the worker
      // is served from /public/maplibre (see scripts/copy-maplibre-worker.mjs).
      lib.setWorkerUrl(WORKER_URL);

      const map = new lib.Map({
        container: mapContainerRef.current!,
        style: osmStyle,
        center: [project.location.longitude, project.location.latitude],
        zoom: project.map.defaultZoom,
        minZoom: project.map.minZoom,
        maxZoom: project.map.maxZoom,
      });

      mapRef.current = map;
      (window as unknown as { __map?: Map }).__map = map;

      map.on("error", (e) => {
        console.error("[maplibre]", e.error ?? e);
      });

      map.addControl(
        new lib.NavigationControl({ showZoom: false, showCompass: true }),
        "bottom-right"
      );

      map.on("load", () => {
        // Mask outside the project layout
        map.addSource(SOURCE_IDS.mask, {
          type: "geojson",
          data: buildMask(zones),
        });
        map.addLayer({
          id: LAYER_IDS.mask,
          type: "fill",
          source: SOURCE_IDS.mask,
          paint: {
            "fill-color": "#1f2937",
            "fill-opacity": 0.55,
          },
        });

        // Zones
        map.addSource(SOURCE_IDS.zones, {
          type: "geojson",
          data: zones as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: LAYER_IDS.zonesFill,
          type: "fill",
          source: SOURCE_IDS.zones,
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.05,
          },
        });
        map.addLayer({
          id: LAYER_IDS.zonesBorder,
          type: "line",
          source: SOURCE_IDS.zones,
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-dasharray": [4, 2],
          },
        });

        // Roads
        map.addSource(SOURCE_IDS.roads, {
          type: "geojson",
          data: roads as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: LAYER_IDS.roads,
          type: "line",
          source: SOURCE_IDS.roads,
          layout: {
            "line-cap": "butt",
            "line-join": "miter",
          },
          paint: {
            "line-color": "#6b7280",
            // 9 m roads are rendered at a zoom-scaled width instead of a
            // fixed six-pixel stroke, so their map footprint stays legible.
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              2,
              17,
              8,
              18,
              16,
              20,
              64,
            ],
          },
        });

        map.addSource(SOURCE_IDS.amenities, {
          type: "geojson",
          data: amenities as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: LAYER_IDS.amenitiesFill,
          type: "fill",
          source: SOURCE_IDS.amenities,
          paint: {
            "fill-color": [
              "match",
              ["get", "kind"],
              "ca-site",
              "#ffffff",
              "park",
              "#bbf7d0",
              "#ffffff",
            ],
            "fill-opacity": 0.9,
          },
        });
        map.addLayer({
          id: LAYER_IDS.amenitiesBorder,
          type: "line",
          source: SOURCE_IDS.amenities,
          paint: {
            "line-color": "#334155",
            "line-width": 2,
          },
        });
        map.addLayer({
          id: LAYER_IDS.amenitiesLabel,
          type: "symbol",
          source: SOURCE_IDS.amenities,
          layout: {
            "text-field": ["get", "name"],
            "text-size": 13,
            "text-font": ["Open Sans Semibold"],
          },
          paint: {
            "text-color": "#0f172a",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
          },
        });

        // Plots
        map.addSource(SOURCE_IDS.plots, {
          type: "geojson",
          promoteId: "id",
          data: {
            type: "FeatureCollection",
            features: plots,
          } as GeoJSON.FeatureCollection,
        });

        // A subtle offset gives each parcel a card-like lift from the basemap.
        map.addLayer({
          id: LAYER_IDS.plotsShadow,
          type: "fill",
          source: SOURCE_IDS.plots,
          paint: {
            "fill-color": "#0f172a",
            "fill-opacity": 0.16,
            "fill-translate": [2, 3],
            "fill-translate-anchor": "viewport",
          },
        });
        for (const status of PLOT_STATUSES) {
          map.addLayer({
            id: `plots-fill-${status}`,
            type: "fill",
            source: SOURCE_IDS.plots,
            filter: ["==", "status", status] as FilterSpecification,
            paint: {
              "fill-color": statusColors[status],
              "fill-opacity": 0.82,
            },
          });
        }
        map.addLayer({
          id: LAYER_IDS.plotsAccent,
          type: "line",
          source: SOURCE_IDS.plots,
          paint: {
            "line-color": [
              "match",
              ["get", "status"],
              "available",
              "#81c784",
              "sold",
              "#e57373",
              "#94a3b8",
            ],
            "line-opacity": 0.7,
            "line-width": 2.5,
          },
        });
        map.addLayer({
          id: LAYER_IDS.plotsBorder,
          type: "line",
          source: SOURCE_IDS.plots,
          paint: {
            "line-color": "#ffffff",
            "line-opacity": 0.85,
            "line-width": 1,
          },
        });
        map.addLayer({
          id: LAYER_IDS.plotsHoverFill,
          type: "fill",
          source: SOURCE_IDS.plots,
          paint: {
            "fill-color": "#ffffff",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.2,
              0,
            ],
            "fill-translate": [0, -2],
            "fill-translate-anchor": "viewport",
          },
        });
        map.addLayer({
          id: LAYER_IDS.plotsHoverBorder,
          type: "line",
          source: SOURCE_IDS.plots,
          paint: {
            "line-color": "#ffffff",
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              1,
              0,
            ],
            "line-width": 3,
            "line-blur": 0.3,
          },
        });
        // Plot labels — points (centroids) so labels never duplicate across
        // tile boundaries the way polygon-anchored symbols can.
        map.addSource(SOURCE_IDS.plotLabelPoints, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: plots.map((plot) => ({
              type: "Feature",
              properties: {
                id: plot.properties.id,
                number: plot.properties.number,
                status: plot.properties.status,
              },
              geometry: {
                type: "Point",
                coordinates: getPlotCenter(plot),
              },
            })),
          } as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: LAYER_IDS.plotsLabel,
          type: "symbol",
          source: SOURCE_IDS.plotLabelPoints,
          layout: {
            "text-field": ["get", "number"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              10,
              18,
              13,
            ],
            "text-font": ["Open Sans Semibold"],
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": [
              "match",
              ["get", "status"],
              "available",
              "#4e8b5d",
              "sold",
              "#c26d6d",
              "#64748b",
            ],
            "text-halo-width": 2,
          },
        });

        // Selected plot highlight
        map.addSource(SOURCE_IDS.selected, {
          type: "geojson",
          data: emptyFeatureCollection(),
        });
        map.addLayer({
          id: LAYER_IDS.selectedFill,
          type: "fill",
          source: SOURCE_IDS.selected,
          paint: {
            "fill-color": "#7c3aed",
            "fill-opacity": 0.16,
            "fill-translate": [0, -4],
            "fill-translate-anchor": "viewport",
          },
        });
        map.addLayer({
          id: LAYER_IDS.selectedBorder,
          type: "line",
          source: SOURCE_IDS.selected,
          paint: {
            "line-color": "#7c3aed",
            "line-width": 4,
            "line-translate": [0, -4],
            "line-translate-anchor": "viewport",
          },
        });
        // the plot number rides along with the lifted copy
        map.addLayer({
          id: LAYER_IDS.selectedLabel,
          type: "symbol",
          source: SOURCE_IDS.selected,
          layout: {
            "text-field": ["get", "number"],
            "text-size": 14,
            "text-font": ["Open Sans Semibold"],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": [
              "match",
              ["get", "status"],
              "available",
              "#4e8b5d",
              "sold",
              "#c26d6d",
              "#64748b",
            ],
            "text-halo-width": 2,
          },
        });

        const hoverPopup = new lib.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: "plot-hover-popup",
        });
        hoverPopupRef.current = hoverPopup;
        const selectedPopup = new lib.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 20,
          className: "plot-selected-popup",
        });
        selectedPopupRef.current = selectedPopup;

        // clicking away from any plot unfocuses the selection
        map.on("click", (e) => {
          const hits = map.queryRenderedFeatures(e.point, {
            layers: PLOT_STATUSES.map((status) => `plots-fill-${status}`),
          });
          if (hits.length === 0) {
            hoverPopup.remove();
            onSelectPlot(null);
          }
        });

        for (const status of PLOT_STATUSES) {
          const layerId = `plots-fill-${status}`;
          map.on("click", layerId, (e) => {
            const feature = e.features?.[0];
            if (!feature?.properties?.id) return;
            onSelectPlot(feature.properties.id as string);
          });

          map.on("mouseenter", layerId, (e) => {
            map.getCanvas().style.cursor = "pointer";
            const feature = e.features?.[0];
            if (!feature?.properties) return;
            const plotId = feature.properties.id as string;
            if (hoveredPlotIdRef.current !== plotId) {
              if (hoveredPlotIdRef.current) {
                map.setFeatureState(
                  { source: SOURCE_IDS.plots, id: hoveredPlotIdRef.current },
                  { hover: false }
                );
              }
              map.setFeatureState(
                { source: SOURCE_IDS.plots, id: plotId },
                { hover: true }
              );
              hoveredPlotIdRef.current = plotId;
            }
            hoverPopup
              .setLngLat(e.lngLat)
              .setDOMContent(
                buildPlotHoverContent(feature.properties as PlotProperties)
              )
              .addTo(map);
          });
          map.on("mousemove", layerId, (e) => {
            hoverPopup.setLngLat(e.lngLat);
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
            if (hoveredPlotIdRef.current) {
              map.setFeatureState(
                { source: SOURCE_IDS.plots, id: hoveredPlotIdRef.current },
                { hover: false }
              );
              hoveredPlotIdRef.current = null;
            }
            hoverPopup.remove();
          });
        }

        // Apply any URL-driven state that arrived before the map loaded.
        applyFilter(map, filteredPlotIdsRef.current);
        applySelected(
          map,
          plots,
          selectedPlotIdRef.current,
          selectedAnimationFrameRef,
          lastSelectedRef,
          project.map.defaultZoom,
          selectedPopupRef
        );
      });
    }

    init();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      selectedPopupRef.current?.remove();
      selectedPopupRef.current = null;
      if (selectedAnimationFrameRef.current !== null) {
        cancelAnimationFrame(selectedAnimationFrameRef.current);
        selectedAnimationFrameRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update filtered plots.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyFilter(map, filteredPlotIds);
  }, [filteredPlotIds]);

  // Update selected plot highlight and fly to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applySelected(
      map,
      plots,
      selectedPlotId,
      selectedAnimationFrameRef,
      lastSelectedRef,
      project.map.defaultZoom,
      selectedPopupRef
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlotId, plots]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 h-full w-full"
      aria-label="Project map"
    />
  );
}
