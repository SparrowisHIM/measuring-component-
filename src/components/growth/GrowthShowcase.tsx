"use client";

import { useSyncExternalStore } from "react";
import { motion, useTransform } from "motion/react";
import { followers, formatValue, interpolateValue, seriesMax, type MetricSeries } from "@/lib/metric";
import { useGrowthPlayback, type Phase } from "./useGrowthPlayback";
import { GrowthLine } from "./GrowthLine";
import { ProfileCard } from "./ProfileCard";
import { RollingNumber } from "./RollingNumber";
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
  const { t, phase } = useGrowthPlayback();
  const value = useTransform(t, (p) => interpolateValue(series, p));
  const dim = phase === "outro";
  const revealed: Phase[] = ["intro", "growing", "payoff"];
  const shown = revealed.includes(phase);
  const goal = seriesMax(series);
  const last = series.points[series.points.length - 1];

  return (
    <div
      data-showcase={showcase || undefined}
      className="relative flex min-h-dvh w-full items-center justify-center p-4 sm:p-8 data-[showcase]:cursor-none data-[showcase]:p-0"
    >
      {/* The recordable card — 16:9, grows to fill the frame */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: dim ? 0.1 : 1 }}
        transition={{ duration: dim ? 0.85 : 0.9, ease: "easeInOut" }}
        className="relative aspect-video w-full max-w-[1180px] overflow-hidden rounded-[var(--radius)] border border-edge/70 bg-panel/40 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] data-[showcase]:h-dvh data-[showcase]:max-w-none data-[showcase]:rounded-none data-[showcase]:border-0"
      >
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
        <motion.div
          className="absolute left-6 top-6 sm:left-9 sm:top-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : -8 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: phase === "intro" ? 0.15 : 0 }}
        >
          <ProfileCard owner={series.owner} />
        </motion.div>

        {/* Hero reading */}
        <motion.div
          className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.98 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: phase === "intro" ? 0.25 : 0 }}
        >
          <RollingNumber value={value} max={goal} />
          <span className="mt-4 font-display text-lg font-medium tracking-wide text-bone-dim sm:text-xl">
            {series.label}
          </span>
          <span className="panel-label mt-1">as of {last.label}</span>
        </motion.div>

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
      </motion.div>

      {/* keep goal referenced for a11y summary */}
      <span className="sr-only">
        {series.owner.name} grew to {formatValue(goal)} {series.label} as of {last.label}.
      </span>
    </div>
  );
}
