import { GrowthCard } from "@/components/growth/GrowthCard";
import { stars } from "@/lib/metric";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-14 overflow-x-hidden px-4 py-16 sm:gap-20 sm:px-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/35">
          GrowthCard
        </span>
        <h1 className="max-w-xl font-display text-2xl font-semibold text-white/90 sm:text-3xl">
          One component, two voices. Drag the tape.
        </h1>
      </header>

      <GrowthCard />
      <GrowthCard data={stars} theme="brass" />
    </main>
  );
}
