import type { MetricSeries } from "@/lib/metric";
import { curvePoints, smoothPath } from "./curve";

const W = 1000;
const H = 100;

export function GrowthLine({ series }: { series: MetricSeries }) {
  const pts = curvePoints(series, W);
  const line = smoothPath(pts);
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 h-[62%] w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="line-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--brass) 60%, transparent)" />
          <stop offset="60%" stopColor="var(--brass-hot)" />
          <stop offset="100%" stopColor="var(--ember)" />
        </linearGradient>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--ember) 22%, transparent)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <path d={area} fill="url(#line-fill)" />
      <path
        d={line}
        fill="none"
        stroke="url(#line-stroke)"
        strokeWidth={2.2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--ember) 55%, transparent))" }}
      />
    </svg>
  );
}
