"use client";

import { useCallback, useEffect, useRef } from "react";
import { animate, AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useScrub } from "./useScrub";
import { useSample } from "./useSample";
import { useMilestones } from "./useMilestones";
import { VernierTrack } from "./VernierTrack";
import { VernierRuler } from "./VernierRuler";
import { VernierReadout } from "./VernierReadout";
import { followers, formatValue, type MetricSeries } from "@/lib/metric";

const FINE_STEP = 0.02;
const PAGE_STEP = 0.1;

export function VernierInstrument({ series = followers }: { series?: MetricSeries }) {
  const reduceMotion = useReducedMotion();
  const scrub = useScrub(0);
  const sample = useSample(series, scrub.progress);
  const pulses = useMilestones(series, scrub.progress);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastY = useRef(0);
  const intro = useRef<ReturnType<typeof animate> | null>(null);
  const stopIntro = useCallback(() => {
    intro.current?.stop();
    intro.current = null;
  }, []);

  // Auto-play the reading once on load to reveal the instrument, then hand
  // control to the visitor. Skipped when reduced motion is requested.
  useEffect(() => {
    if (reduceMotion) return;
    intro.current = animate(scrub.target, 1, {
      duration: 3.2,
      ease: [0.22, 0.61, 0.36, 1],
    });
    return () => stopIntro();
  }, [reduceMotion, scrub.target, stopIntro]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      stopIntro();
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          scrub.nudge(FINE_STEP);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          scrub.nudge(-FINE_STEP);
          break;
        case "PageUp":
          scrub.nudge(PAGE_STEP);
          break;
        case "PageDown":
          scrub.nudge(-PAGE_STEP);
          break;
        case "Home":
          scrub.set(0);
          break;
        case "End":
          scrub.set(1);
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [scrub, stopIntro],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      stopIntro();
      dragging.current = true;
      lastY.current = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [stopIntro],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const height = stageRef.current?.clientHeight ?? 480;
      const dy = e.clientY - lastY.current;
      lastY.current = e.clientY;
      // Dragging down advances time, matching the instrument's motion.
      scrub.nudge(dy / height);
    },
    [scrub],
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      stopIntro();
      scrub.nudge(e.deltaY / 900);
    },
    [scrub, stopIntro],
  );

  return (
    <div
      ref={stageRef}
      role="slider"
      tabIndex={0}
      aria-label={`Scrub the timeline to measure ${series.label.toLowerCase()}`}
      aria-orientation="vertical"
      aria-valuemin={series.points[0].value}
      aria-valuemax={series.points[series.points.length - 1].value}
      aria-valuenow={sample.value}
      aria-valuetext={`${formatValue(sample.value)} ${series.label} in ${sample.label}`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      className="relative grid w-full max-w-3xl origin-center cursor-grab touch-none select-none grid-cols-[minmax(0,1fr)_120px_minmax(0,1.4fr)] items-center gap-4 rounded-[var(--radius)] outline-none focus-visible:ring-1 focus-visible:ring-brass/60 active:cursor-grabbing sm:gap-6 max-sm:scale-[0.84] max-[380px]:scale-[0.68]"
    >
      {/* Milestone pulses — a brass ring and rising tag when the reading crosses a round number */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <AnimatePresence>
          {!reduceMotion &&
            pulses.map((p) => (
            <div key={p.id} className="absolute flex flex-col items-center">
              <motion.span
                className="absolute h-40 w-40 rounded-full border border-brass/70"
                initial={{ scale: 0.35, opacity: 0.65 }}
                animate={{ scale: 2.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ boxShadow: "0 0 40px color-mix(in oklab, var(--brass-hot) 60%, transparent)" }}
              />
              <motion.span
                className="tabular rounded-full border border-brass/40 bg-panel/80 px-3 py-1 text-sm font-semibold text-brass-hot backdrop-blur-sm"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: -34, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
              >
                {formatValue(p.value)}
              </motion.span>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Left — the engraved main scale */}
      <VernierRuler series={series} progress={scrub.progress} />

      {/* Center — the elastic vernier track */}
      <div className="flex items-center justify-center">
        <VernierTrack progress={scrub.progress} />
      </div>

      {/* Right — the readout */}
      <VernierReadout series={series} progress={scrub.progress} />
    </div>
  );
}
