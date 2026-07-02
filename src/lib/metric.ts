/**
 * The growth series. Generic on purpose: swap `label`, `owner`, and `points`
 * to tell any growth story over time (followers, MRR, a streak). Playback
 * reads a single normalized value (0..1) across these points.
 *
 * The seeded curve is intentionally S-shaped — a slow start, a surge through
 * the middle, and an ease into the goal — so the count *feels* like momentum
 * building rather than a linear tick.
 */

export type MetricPoint = {
  /** Short month label, e.g. "Mar 2024". */
  label: string;
  /** The value at this tick. */
  value: number;
};

export type MetricSeries = {
  /** What is being measured, e.g. "Followers". */
  label: string;
  /** Owner of the reading, shown on the readout card. */
  owner: {
    name: string;
    handle: string;
    verified: boolean;
    /** Avatar image (public path or URL); falls back to an initial. */
    avatar?: string;
  };
  /** Ordered scale points, low to high. */
  points: MetricPoint[];
  /** Round numbers worth celebrating as the reading crosses them. */
  milestones: number[];
};

export const followers: MetricSeries = {
  label: "Followers",
  owner: { name: "Efe Ebomwonyi", handle: "@SparrowisHIM", verified: true, avatar: "/avatar.jpg" },
  milestones: [1000, 5000, 10000],
  points: [
    { label: "Mar 2024", value: 100 },
    { label: "Apr 2024", value: 150 },
    { label: "May 2024", value: 240 },
    { label: "Jun 2024", value: 400 },
    { label: "Jul 2024", value: 700 },
    { label: "Aug 2024", value: 1200 },
    { label: "Sep 2024", value: 2100 },
    { label: "Oct 2024", value: 3400 },
    { label: "Nov 2024", value: 4900 },
    { label: "Dec 2024", value: 6300 },
    { label: "Jan 2025", value: 7500 },
    { label: "Feb 2025", value: 8500 },
    { label: "Mar 2025", value: 9200 },
    { label: "Apr 2025", value: 9650 },
    { label: "May 2025", value: 9900 },
    { label: "Jun 2025", value: 10000 },
  ],
};

export const stars: MetricSeries = {
  label: "GitHub Stars",
  owner: { name: "Efe Ebomwonyi", handle: "@SparrowisHIM", verified: false, avatar: "/avatar.jpg" },
  milestones: [500, 2500, 5000],
  points: [
    { label: "Jul 2024", value: 40 },
    { label: "Aug 2024", value: 90 },
    { label: "Sep 2024", value: 160 },
    { label: "Oct 2024", value: 240 },
    { label: "Nov 2024", value: 330 },
    { label: "Dec 2024", value: 480 },
    { label: "Jan 2025", value: 900 },
    { label: "Feb 2025", value: 1450 },
    { label: "Mar 2025", value: 2600 },
    { label: "Apr 2025", value: 3900 },
    { label: "May 2025", value: 4600 },
    { label: "Jun 2025", value: 5000 },
  ],
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export type Sample = {
  /** Interpolated, rounded reading. */
  value: number;
  /** Fractional index into the points array. */
  position: number;
  /** Nearest lower point index. */
  index: number;
  /** Label at the nearest lower point. */
  label: string;
};

/** Continuous (unrounded) reading at a normalized progress value. */
export function interpolateValue(series: MetricSeries, progress: number): number {
  const pts = series.points;
  const last = pts.length - 1;
  const position = clamp01(progress) * last;
  const index = Math.min(last - 1, Math.floor(position));
  const frac = position - index;
  return pts[index].value + (pts[index + 1].value - pts[index].value) * frac;
}

/** Sample the series at a normalized progress value (0..1). */
export function sampleSeries(series: MetricSeries, progress: number): Sample {
  const pts = series.points;
  const last = pts.length - 1;
  const position = clamp01(progress) * last;
  const index = Math.min(last - 1, Math.floor(position));
  return {
    value: Math.round(interpolateValue(series, progress)),
    position,
    index,
    label: pts[Math.round(position)].label,
  };
}

/** Largest value the series reaches — sizes the rolling number. */
export const seriesMax = (series: MetricSeries) =>
  series.points[series.points.length - 1].value;

/** Even 0..1 positions for each point, for laying out the timeline. */
export const pointFractions = (series: MetricSeries) =>
  series.points.map((_, i) => i / (series.points.length - 1));

/** Highest milestone the reading has reached at this value. */
export function reachedMilestone(series: MetricSeries, value: number): number | null {
  let reached: number | null = null;
  for (const m of series.milestones) if (value >= m) reached = m;
  return reached;
}

/** Month-over-month change at a point index (0 at the starting point). */
export const monthDelta = (series: MetricSeries, index: number) =>
  index > 0 ? series.points[index].value - series.points[index - 1].value : 0;

const grouper = new Intl.NumberFormat("en-US");
export const formatValue = (n: number) => grouper.format(n);

/** 1000 -> "1K", 2500 -> "2.5K" — milestone chip labels. */
export const compactValue = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
