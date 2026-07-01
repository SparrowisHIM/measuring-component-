"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { followers, formatValue, interpolateValue, sampleSeries, seriesMax, type MetricSeries } from "@/lib/metric";
import { useGrowthController } from "./useGrowthController";
import { Embers } from "./Embers";
import { GrowthLine } from "./GrowthLine";
import { ProfileCard } from "./ProfileCard";
import { RollingNumber } from "./RollingNumber";
import { Timeline } from "./Timeline";

export type GrowthCardProps = {
  /** The growth series to display. */
  data?: MetricSeries;
  /** Extra classes for the outer card. */
  className?: string;
};

/**
 * A self-contained, data-driven growth card. Counts up once when it scrolls
 * into view, then lets you hover or drag across the timeline to inspect any
 * point. Drop it in a dashboard and pass `data`.
 */
export function GrowthCard({ data = followers, className = "" }: GrowthCardProps) {
  const reduce = useReducedMotion();

  // A single quiet "arrival" flourish the first time the count-up completes.
  const [arrived, setArrived] = useState(false);
  const arrive = useCallback(() => {
    setArrived(true);
    window.setTimeout(() => setArrived(false), 1100);
  }, []);

  const { progress, rootRef, scrubTo, endScrub, revealing } = useGrowthController(arrive);
  const value = useTransform(progress, (p) => interpolateValue(data, p));
  const goal = seriesMax(data);

  // Reactive atmosphere — the card warms with the reading (kept calm).
  const glowOpacity = useTransform(progress, [0, 1], [0.34, 0.92]);
  const glowScale = useTransform(progress, [0, 1], [0.86, 1.08]);
  const coreOpacity = useTransform(progress, (p) => Math.max(0, (p - 0.6) / 0.4) * 0.7);

  // Live "as of" month, following the reading (or the point being inspected).
  const [label, setLabel] = useState(() => sampleSeries(data, progress.get()).label);
  useMotionValueEvent(progress, "change", (p) => {
    const next = sampleSeries(data, p).label;
    setLabel((prev) => (prev === next ? prev : next));
  });

  // Scrub geometry: map pointer X across the inset scrub surface to 0..1.
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrubFromX = useCallback(
    (clientX: number) => {
      const el = overlayRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      scrubTo((clientX - r.left) / r.width);
    },
    [scrubTo],
  );

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative aspect-[4/5] w-full max-w-[1180px] overflow-hidden rounded-[var(--radius)] border border-edge/70 bg-panel/40 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:aspect-video ${className}`}
    >
      {/* Substrate */}
      <div className="engraved-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="film-grain pointer-events-none absolute inset-0" />

      {/* Warm glow, brightening with the reading */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[44%] h-[85%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{
          opacity: glowOpacity,
          scale: glowScale,
          background: "radial-gradient(circle, color-mix(in oklab, var(--ember) 30%, transparent), transparent 66%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[46%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
        style={{
          opacity: coreOpacity,
          background: "radial-gradient(circle, color-mix(in oklab, var(--incandescent) 50%, transparent), transparent 62%)",
        }}
      />

      {/* Profile */}
      <div className="absolute left-6 top-6 sm:left-9 sm:top-8">
        <ProfileCard owner={data.owner} />
      </div>

      {/* Hero reading */}
      <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center">
        <motion.div
          className="flex flex-col items-center"
          animate={{ scale: arrived && !reduce ? [1, 1.03, 1] : 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <RollingNumber value={value} max={goal} />
          <span className="mt-4 font-display text-lg font-medium tracking-wide text-bone-dim sm:text-xl">
            {data.label}
          </span>
          <span className="panel-label mt-1">as of {label}</span>
        </motion.div>
      </div>

      {/* Growth line + timeline */}
      <div className="absolute inset-x-0 bottom-0 h-[34%]">
        <GrowthLine series={data} progress={progress} />
        <Timeline series={data} progress={progress} />
      </div>

      {/* Embers — only during the reveal */}
      <Embers series={data} progress={progress} active={revealing} />

      {/* Arrival flourish — a single ring, once */}
      <AnimatePresence>
        {arrived && !reduce && (
          <motion.span
            key="arrival-ring"
            className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ width: "26vmin", height: "26vmin", borderColor: "color-mix(in oklab, var(--brass-hot) 50%, transparent)" }}
            initial={{ scale: 0.5, opacity: 0.55 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* Scrub surface — hover or drag to inspect any month */}
      <div
        ref={overlayRef}
        className="absolute inset-x-6 inset-y-0 z-30 cursor-col-resize touch-none sm:inset-x-10"
        role="slider"
        tabIndex={0}
        aria-label={`Inspect ${data.owner.name}'s ${data.label.toLowerCase()} over time`}
        aria-valuemin={data.points[0].value}
        aria-valuemax={goal}
        aria-valuenow={sampleSeries(data, progress.get()).value}
        aria-valuetext={`${formatValue(sampleSeries(data, progress.get()).value)} ${data.label} in ${label}`}
        onPointerDown={(e) => scrubFromX(e.clientX)}
        onPointerMove={(e) => scrubFromX(e.clientX)}
        onPointerLeave={endScrub}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
      />
    </motion.div>
  );
}
