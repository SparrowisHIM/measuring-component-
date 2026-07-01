"use client";

import { useCallback, useRef } from "react";
import { useScrub } from "./useScrub";
import { useSample } from "./useSample";
import { followers, formatValue, type MetricSeries } from "@/lib/metric";

const FINE_STEP = 0.02;
const PAGE_STEP = 0.1;

export function VernierInstrument({ series = followers }: { series?: MetricSeries }) {
  const scrub = useScrub(0);
  const sample = useSample(series, scrub.progress);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastY = useRef(0);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    [scrub],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    lastY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

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
      scrub.nudge(e.deltaY / 900);
    },
    [scrub],
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
      className="grid w-full max-w-3xl cursor-grab touch-none select-none grid-cols-[minmax(0,1fr)_88px_minmax(0,1.4fr)] items-center gap-6 rounded-[var(--radius)] outline-none focus-visible:ring-1 focus-visible:ring-brass/60 active:cursor-grabbing"
    >
      {/* Left — main scale (ruler lands in the next stage) */}
      <div className="flex h-72 flex-col justify-between py-4">
        <span className="panel-label">{series.points[0].label}</span>
        <span className="font-mono text-sm text-bone-dim">{sample.label}</span>
        <span className="panel-label">{series.points[series.points.length - 1].label}</span>
      </div>

      {/* Center — the vernier track (elastic track + knob land in the next stage) */}
      <div className="relative flex h-72 items-center justify-center">
        <div className="h-full w-px bg-edge" />
        <div className="absolute h-10 w-10 rounded-full border border-brass/50 bg-panel" />
      </div>

      {/* Right — the readout */}
      <div className="flex flex-col gap-2 py-4">
        <span className="panel-label">{series.label}</span>
        <span className="tabular text-5xl font-semibold text-bone">
          {formatValue(sample.value)}
        </span>
        <span className="font-mono text-xs text-bone-dim">
          {series.owner.name} · {series.owner.handle}
        </span>
      </div>
    </div>
  );
}
