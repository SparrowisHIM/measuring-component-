export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-void">
      {/* Ambient substrate: engraved drafting grid + film grain */}
      <div className="engraved-grid pointer-events-none absolute inset-0" />
      <div className="film-grain pointer-events-none absolute inset-0" />

      {/* Warm brass ambience, pooled behind the instrument */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--brass) 22%, transparent), transparent 68%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-8">
        {/* Instrument header */}
        <header className="flex items-baseline justify-between border-b border-edge/70 pb-5">
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                background: "var(--brass)",
                boxShadow:
                  "0 0 12px color-mix(in oklab, var(--brass) 80%, transparent)",
              }}
            />
            <span className="font-display text-lg font-semibold tracking-tight text-bone">
              Vernier
            </span>
          </div>
          <span className="panel-label">Measuring Instrument · No. 01</span>
        </header>

        {/* Instrument stage — zones land here in the next stages */}
        <section className="flex flex-1 items-center justify-center">
          <div className="panel-label opacity-60">Calibrating…</div>
        </section>

        <footer className="flex items-center justify-between border-t border-edge/70 pt-5">
          <span className="panel-label">Scrub to measure</span>
          <span className="panel-label">Brass runs hot at 10,000</span>
        </footer>
      </div>
    </main>
  );
}
