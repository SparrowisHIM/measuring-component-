import { GrowthShowcase } from "@/components/growth/GrowthShowcase";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-dvh w-full min-w-0 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[#08090a]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),transparent)]"
        aria-hidden
      />

      <section className="relative flex w-full min-w-0 max-w-[1280px] flex-col items-center gap-10">
        <header className="flex max-w-3xl flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3 text-white/35">
            <span className="h-px w-10 bg-white/15" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em]">
              GrowthCard
            </span>
            <span className="h-px w-10 bg-white/15" aria-hidden />
          </div>
          <h1 className="max-w-[20rem] text-balance font-display text-2xl font-semibold leading-tight text-white/90 sm:max-w-3xl sm:text-4xl sm:leading-[1.08] lg:text-5xl">
            One component, two voices. Drag the tape.
          </h1>
        </header>

        <GrowthShowcase />
      </section>
    </main>
  );
}
