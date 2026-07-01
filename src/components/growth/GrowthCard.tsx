"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { followers, formatValue, interpolateValue, sampleSeries, seriesMax, type MetricSeries } from "@/lib/metric";
import { useGrowthController } from "./useGrowthController";
import { Embers } from "./Embers";
import { GrowthLine } from "./GrowthLine";
import { MonthRuler } from "./MonthRuler";
import { ProfileCard } from "./ProfileCard";
import { RollingNumber } from "./RollingNumber";
import { ScrubTrack } from "./ScrubTrack";

export type GrowthCardProps = {
  /** The growth series to display. */
  data?: MetricSeries;
  /** Extra classes for the outer card. */
  className?: string;
};

/**
 * A self-contained, data-driven growth card. It counts up once when it scrolls
 * into view, then you drag the elastic knob up and down the timeline to inspect
 * any month — the reading, the fill, and the ruler follow, snapping to months.
 */
export function GrowthCard({ data = followers, className = "" }: GrowthCardProps) {
  const reduce = useReducedMotion();

  // A single quiet "arrival" flourish the first time the count-up completes.
  const [arrived, setArrived] = useState(false);
  const arrive = useCallback(() => {
    setArrived(true);
    window.setTimeout(() => setArrived(false), 1100);
  }, []);

  const { progress, rootRef, scrubTo, revealing } = useGrowthController(arrive);
  const value = useTransform(progress, (p) => interpolateValue(data, p));
  const goal = seriesMax(data);

  // Inspect by month: snap the scrub to the nearest data point.
  const last = data.points.length - 1;
  const handleScrub = useCallback((frac: number) => scrubTo(Math.round(frac * last) / last), [scrubTo, last]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = Math.round(progress.get() * last);
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          scrubTo(Math.min(last, idx + 1) / last);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          scrubTo(Math.max(0, idx - 1) / last);
          break;
        case "Home":
          scrubTo(0);
          break;
        case "End":
          scrubTo(1);
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [last, progress, scrubTo],
  );

  // Reactive atmosphere — warms with the reading.
  const glowOpacity = useTransform(progress, [0, 1], [0.34, 0.92]);
  const glowScale = useTransform(progress, [0, 1], [0.86, 1.08]);
  const coreOpacity = useTransform(progress, (p) => Math.max(0, (p - 0.6) / 0.4) * 0.7);

  // Live "as of" month, following the reading.
  const [label, setLabel] = useState(() => sampleSeries(data, progress.get()).label);
  useMotionValueEvent(progress, "change", (p) => {
    const next = sampleSeries(data, p).label;
    setLabel((prev) => (prev === next ? prev : next));
  });

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

      {/* Warm glow behind the readout */}
      <motion.div
        className="pointer-events-none absolute left-[64%] top-[46%] h-[85%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{
          opacity: glowOpacity,
          scale: glowScale,
          background: "radial-gradient(circle, color-mix(in oklab, var(--ember) 30%, transparent), transparent 66%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute left-[64%] top-[44%] h-[46%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
        style={{
          opacity: coreOpacity,
          background: "radial-gradient(circle, color-mix(in oklab, var(--incandescent) 50%, transparent), transparent 62%)",
        }}
      />

      {/* Profile */}
      <div className="absolute left-6 top-6 z-20 sm:left-9 sm:top-8">
        <ProfileCard owner={data.owner} />
      </div>

      <div className="flex h-full w-full items-center">
        {/* LEFT — the vertical elastic scrubber */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Drag through ${data.owner.name}'s ${data.label.toLowerCase()} timeline`}
          aria-orientation="vertical"
          aria-valuemin={data.points[0].value}
          aria-valuemax={goal}
          aria-valuenow={sampleSeries(data, progress.get()).value}
          aria-valuetext={`${formatValue(sampleSeries(data, progress.get()).value)} ${data.label} in ${label}`}
          onKeyDown={onKeyDown}
          className="relative z-20 flex h-full shrink-0 items-center justify-center gap-2 pl-4 outline-none focus-visible:opacity-100 sm:gap-3 sm:pl-8"
        >
          <MonthRuler series={data} progress={progress} />
          <ScrubTrack progress={progress} onScrub={handleScrub} />
        </div>

        {/* RIGHT — the readout */}
        <div className="relative flex h-full flex-1 flex-col items-center justify-center px-6 sm:px-10">
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

          {/* Progressive growth line beneath the readout */}
          <div className="pointer-events-none absolute inset-x-6 bottom-8 h-[24%] sm:inset-x-10">
            <GrowthLine series={data} progress={progress} />
          </div>
        </div>
      </div>

      {/* Embers — only during the reveal */}
      <Embers series={data} progress={progress} active={revealing} />

      {/* Arrival flourish — a single ring, once */}
      <AnimatePresence>
        {arrived && !reduce && (
          <motion.span
            key="arrival-ring"
            className="pointer-events-none absolute left-[64%] top-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ width: "24vmin", height: "24vmin", borderColor: "color-mix(in oklab, var(--brass-hot) 50%, transparent)" }}
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
        style={{ background: "radial-gradient(120% 90% at 60% 44%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />
    </motion.div>
  );
}
