"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion, useTransform } from "motion/react";
import { followers, formatValue, interpolateValue, seriesMax, type MetricSeries } from "@/lib/metric";
import { useGrowthPlayback, type Phase } from "./useGrowthPlayback";
import { Embers } from "./Embers";
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
  const reduce = useReducedMotion();
  const { t, phase } = useGrowthPlayback();
  const value = useTransform(t, (p) => interpolateValue(series, p));
  const isPayoff = phase === "payoff";

  // Reactive atmosphere — the frame warms as the count climbs.
  const glowOpacity = useTransform(t, [0, 1], [0.32, 1]);
  const glowScale = useTransform(t, [0, 1], [0.82, 1.12]);
  const coreOpacity = useTransform(t, (p) => Math.max(0, (p - 0.55) / 0.45) * 0.85);
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
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: dim ? 0.1 : 1 }}
        transition={{ duration: dim ? 0.85 : 0.9, ease: "easeInOut" }}
        className="relative aspect-[4/5] w-full max-w-[1180px] overflow-hidden rounded-[var(--radius)] border border-edge/70 bg-panel/40 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:aspect-video data-[showcase]:h-dvh data-[showcase]:max-w-none data-[showcase]:rounded-none data-[showcase]:border-0"
      >
        {/* Subtle grid + grain substrate */}
        <div className="engraved-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="film-grain pointer-events-none absolute inset-0" />

        {/* Warm glow field, pooled behind the number — brightens with the count */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[44%] h-[85%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{
            opacity: glowOpacity,
            scale: glowScale,
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--ember) 30%, transparent), transparent 66%)",
          }}
        />
        {/* Incandescent core — only the final approach runs white-hot */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[42%] h-[46%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
          style={{
            opacity: coreOpacity,
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--incandescent) 55%, transparent), transparent 62%)",
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
          <motion.div
            className="flex flex-col items-center"
            animate={{ scale: isPayoff && !reduce ? [1, 1.035, 1] : 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <RollingNumber value={value} max={goal} />
            <span
              className={`mt-4 font-display text-lg font-medium tracking-wide transition-colors duration-500 sm:text-xl ${
                isPayoff ? "text-bone" : "text-bone-dim"
              }`}
            >
              {series.label}
            </span>
            <span
              className={`panel-label mt-1 transition-colors duration-500 ${
                isPayoff ? "text-brass-hot" : ""
              }`}
            >
              as of {last.label}
            </span>
          </motion.div>
        </motion.div>

        {/* Growth line + timeline along the base */}
        <div className="absolute inset-x-0 bottom-0 h-[34%]">
          <GrowthLine series={series} progress={t} />
          <Timeline series={series} progress={t} />
        </div>

        {/* Embers feeding the number */}
        <Embers series={series} progress={t} />

        {/* Payoff — a warm bloom that swells and holds when the goal lands */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--incandescent) 40%, transparent), transparent 55%)",
          }}
          animate={{ opacity: isPayoff ? (reduce ? 0.22 : [0, 0.6, 0.3]) : 0 }}
          transition={{ duration: reduce ? 0.2 : 1, ease: "easeOut" }}
        />

        {/* Payoff — a single ring blooming out from the number */}
        <AnimatePresence>
          {isPayoff && !reduce && (
            <motion.span
              key="payoff-ring"
              className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                width: "30vmin",
                height: "30vmin",
                borderColor: "color-mix(in oklab, var(--brass-hot) 55%, transparent)",
              }}
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

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
