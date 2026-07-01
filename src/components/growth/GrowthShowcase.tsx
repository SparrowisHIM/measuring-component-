"use client";

import { useSyncExternalStore } from "react";
import { followers, formatValue, seriesMax, type MetricSeries } from "@/lib/metric";
import { GrowthLine } from "./GrowthLine";
import { ProfileCard } from "./ProfileCard";
import { Timeline } from "./Timeline";

const noopSubscribe = () => () => {};

/** Whether we're in chrome-free recording mode (?showcase), read client-side. */
function useShowcase() {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).has("showcase"),
    () => false,
  );
}

export function GrowthShowcase({ series = followers }: { series?: MetricSeries }) {
  const showcase = useShowcase();
  const goal = seriesMax(series);
  const last = series.points[series.points.length - 1];

  return (
    <div
      data-showcase={showcase || undefined}
      className="relative flex min-h-dvh w-full items-center justify-center p-4 sm:p-8 data-[showcase]:cursor-none data-[showcase]:p-0"
    >
      {/* The recordable card — 16:9, grows to fill the frame */}
      <div className="relative aspect-video w-full max-w-[1180px] overflow-hidden rounded-[var(--radius)] border border-edge/70 bg-panel/40 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] data-[showcase]:h-dvh data-[showcase]:max-w-none data-[showcase]:rounded-none data-[showcase]:border-0">
        {/* Subtle grid + grain substrate */}
        <div className="engraved-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="film-grain pointer-events-none absolute inset-0" />

        {/* Warm glow field, pooled behind the number */}
        <div
          className="pointer-events-none absolute left-1/2 top-[46%] h-[80%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--ember) 26%, transparent), transparent 66%)",
          }}
        />

        {/* Profile */}
        <div className="absolute left-6 top-6 sm:left-9 sm:top-8">
          <ProfileCard owner={series.owner} />
        </div>

        {/* Hero reading */}
        <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center">
          <span
            className="tabular font-semibold leading-none text-bone"
            style={{ fontSize: "clamp(3.5rem, 13vw, 10rem)", letterSpacing: "-0.03em" }}
          >
            {formatValue(goal)}
          </span>
          <span className="mt-4 font-display text-lg font-medium tracking-wide text-bone-dim sm:text-xl">
            {series.label}
          </span>
          <span className="panel-label mt-1">as of {last.label}</span>
        </div>

        {/* Growth line + timeline along the base */}
        <div className="absolute inset-x-0 bottom-0 h-[34%]">
          <GrowthLine series={series} />
          <Timeline series={series} />
        </div>

        {/* Vignette to seat the card */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>
    </div>
  );
}
