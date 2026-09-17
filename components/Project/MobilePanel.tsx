"use client";

import { useState } from "react";

interface MobilePanelProps {
  children: React.ReactNode;
  selectedPlotNumber?: string;
}

export default function MobilePanel({
  children,
  selectedPlotNumber,
}: MobilePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`
        fixed left-0 right-0 z-20 flex flex-col rounded-t-2xl border-t border-zinc-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-900
        md:hidden
        ${open ? "bottom-0 max-h-[70vh]" : "bottom-0 max-h-14"}
      `}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {selectedPlotNumber ? selectedPlotNumber : "Plots & Filters"}
          </span>
          {selectedPlotNumber && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              selected
            </span>
          )}
        </div>
        <span className="text-zinc-500" aria-hidden="true">
          {open ? "✕" : "▲"}
        </span>
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
