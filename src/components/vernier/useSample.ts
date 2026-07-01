"use client";

import { useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { sampleSeries, type MetricSeries, type Sample } from "@/lib/metric";

/** Turn the live progress MotionValue into a React-rendered series sample. */
export function useSample(series: MetricSeries, progress: MotionValue<number>): Sample {
  const [sample, setSample] = useState<Sample>(() => sampleSeries(series, progress.get()));
  useMotionValueEvent(progress, "change", (p) => setSample(sampleSeries(series, p)));
  return sample;
}
