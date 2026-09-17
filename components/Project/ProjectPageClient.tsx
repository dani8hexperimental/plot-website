"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Project } from "@/schemas/project.schema";
import type { PlotFeature, PlotStatus } from "@/schemas/plot.schema";
import ProjectMap from "@/components/Map/ProjectMap";
import PlotDetails from "@/components/Plot/PlotDetails";
import PlotFilters from "@/components/Plot/PlotFilters";
import PlotLegend from "@/components/Plot/PlotLegend";
import ProjectHeader from "@/components/Project/ProjectHeader";
import MobilePanel from "@/components/Project/MobilePanel";
import { filterPlots, getPlotById } from "@/lib/plots";
import {
  buildUrl,
  parseUrlState,
  toFilterParams,
  type UrlState,
} from "@/lib/url-state";

interface ProjectPageClientProps {
  project: Project;
  plots: PlotFeature[];
  roads: unknown;
  amenities: unknown;
  zones: unknown;
}

export default function ProjectPageClient({
  project,
  plots,
  roads,
  amenities,
  zones,
}: ProjectPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlState = useMemo(
    () => parseUrlState(searchParams),
    [searchParams]
  );

  const selectedPlotId = urlState.plot ?? null;
  const statusFilter = urlState.status ?? [];

  const filters = useMemo(
    () => toFilterParams({ status: statusFilter }),
    [statusFilter]
  );

  const filteredPlots = useMemo(
    () => filterPlots(plots, filters),
    [plots, filters]
  );

  const filteredPlotIds = useMemo(
    () => new Set(filteredPlots.map((p) => p.properties.id)),
    [filteredPlots]
  );

  const selectedPlot = useMemo(
    () => getPlotById(plots, selectedPlotId),
    [plots, selectedPlotId]
  );

  const updateUrl = useCallback(
    (patch: Partial<UrlState>) => {
      const current: UrlState = {
        plot: selectedPlotId ?? undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
      };
      const next: UrlState = { ...current, ...patch };
      if (!next.status || next.status.length === 0) delete next.status;
      if (!next.plot) delete next.plot;
      router.replace(buildUrl(pathname, next), { scroll: false });
    },
    [pathname, router, selectedPlotId, statusFilter]
  );

  const handleSelectPlot = useCallback(
    (id: string | null) => {
      updateUrl({ plot: id ?? undefined });
    },
    [updateUrl]
  );

  const handleClosePlot = useCallback(() => {
    updateUrl({ plot: undefined });
  }, [updateUrl]);

  const handleStatusChange = useCallback(
    (statuses: PlotStatus[]) => {
      updateUrl({ status: statuses.length > 0 ? statuses : undefined });
    },
    [updateUrl]
  );

  const sidebarContent = (
    <>
      <div className="pointer-events-auto">
        <PlotFilters selected={statusFilter} onChange={handleStatusChange} />
      </div>
      <div className="pointer-events-auto">
        <PlotLegend />
      </div>
      {selectedPlot && (
        <div className="pointer-events-auto">
          <PlotDetails
            key={selectedPlot.properties.id}
            plot={selectedPlot}
            onClose={handleClosePlot}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen flex-col">
      <div className="relative flex flex-1 overflow-hidden pb-14 md:pb-0">
        <div className="relative flex-1">
          <ProjectMap
            project={project}
            plots={plots}
            roads={roads}
            amenities={amenities}
            zones={zones}
            selectedPlotId={selectedPlotId}
            filteredPlotIds={filteredPlotIds}
            onSelectPlot={handleSelectPlot}
          />
          <div className="pointer-events-none absolute left-3 top-3 z-10 sm:left-5 sm:top-5">
            <ProjectHeader project={project} />
          </div>
        </div>

        <aside className="pointer-events-none absolute inset-y-0 right-0 hidden w-full max-w-xs flex-col gap-4 overflow-y-auto p-4 md:flex sm:max-w-sm">
          {sidebarContent}
        </aside>
      </div>

      <MobilePanel selectedPlotNumber={selectedPlot?.properties.number}>
        <div className="space-y-4">{sidebarContent}</div>
      </MobilePanel>
    </div>
  );
}
