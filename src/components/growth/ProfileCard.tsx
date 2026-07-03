import Image from "next/image";
import type { MetricSeries } from "@/lib/metric";

export function ProfileCard({ owner }: { owner: MetricSeries["owner"] }) {
  const initial = owner.name.charAt(0).toUpperCase();
  const ring = {
    boxShadow:
      "0 0 0 1px color-mix(in oklab, var(--gc-accent) 45%, transparent), 0 6px 18px -6px color-mix(in oklab, var(--gc-accent) 70%, transparent)",
  };
  return (
    <div className="flex items-center gap-3">
      {owner.avatar ? (
        <Image
          src={owner.avatar}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
          style={ring}
        />
      ) : (
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full font-display text-base font-semibold text-card"
          style={{
            background: "linear-gradient(140deg, var(--gc-accent-hot), var(--gc-accent))",
            ...ring,
          }}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <span className="flex flex-col">
        <span className="flex items-center gap-1.5">
          <span className="font-display text-base font-semibold text-ink">{owner.name}</span>
          {owner.verified && (
            <svg width="17" height="17" viewBox="0 0 24 24" role="img" aria-label="Verified">
              <path
                d="M12 2l2.3 1.7 2.8-.3 1 2.6 2.4 1.5-.7 2.8.7 2.8-2.4 1.5-1 2.6-2.8-.3L12 22l-2.3-1.7-2.8.3-1-2.6L3.5 16l.7-2.8-.7-2.8 2.4-1.5 1-2.6 2.8.3z"
                fill="var(--gc-badge)"
              />
              <path
                d="M8.5 12l2.3 2.3 4.7-4.7"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="font-mono text-xs text-ink-dim">{owner.handle}</span>
      </span>
    </div>
  );
}
