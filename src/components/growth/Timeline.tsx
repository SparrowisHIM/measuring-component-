import { pointFractions, type MetricSeries } from "@/lib/metric";

/** Short month token, e.g. "Mar 2024" -> "Mar". */
const shortMonth = (label: string) => label.split(" ")[0];

export function Timeline({ series }: { series: MetricSeries }) {
  const fractions = pointFractions(series);

  return (
    <div className="absolute inset-x-6 bottom-5 sm:inset-x-10 sm:bottom-6">
      {/* Rail */}
      <div className="relative h-px w-full bg-edge">
        <div
          className="absolute inset-y-0 left-0 w-full"
          style={{
            background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--brass) 55%, transparent), transparent)",
          }}
        />
        {/* Nodes */}
        {fractions.map((f, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${f * 100}%`,
              background: "var(--brass-hot)",
              boxShadow: "0 0 8px color-mix(in oklab, var(--ember) 70%, transparent)",
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="relative mt-3 h-4">
        {series.points.map((pt, i) => (
          <span
            key={pt.label}
            className="panel-label absolute -translate-x-1/2 text-[10px]"
            style={{ left: `${fractions[i] * 100}%` }}
          >
            {shortMonth(pt.label)}
          </span>
        ))}
      </div>
    </div>
  );
}
