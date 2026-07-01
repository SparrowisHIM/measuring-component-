# GrowthCard

A reusable, data‑driven growth widget. It **counts up once when it scrolls into
view**, then lets you **hover or drag across the timeline to inspect any month** —
the number, growth line, month nodes, and “as of” label all follow the point
you’re inspecting. Drop it in a dashboard and pass `data`.

No autoplay, no hardcoded content, no timers — it’s driven by real signals
(viewport + interaction), so it behaves like a component, not a canned clip.

## Usage

```tsx
import { GrowthCard } from "@/components/growth/GrowthCard";

<GrowthCard data={followers} />;
```

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `MetricSeries` | `followers` | Owner, label, ordered points (low → high), milestones |
| `className` | `string` | `""` | Extra classes for the outer card |

Define a series in [`src/lib/metric.ts`](src/lib/metric.ts):

```ts
const revenue: MetricSeries = {
  label: "MRR",
  owner: { name: "Atlas", handle: "@atlas", verified: true },
  milestones: [10_000, 50_000, 100_000],
  points: [
    { label: "Jan 2025", value: 4_200 },
    // … low to high …
    { label: "Dec 2025", value: 100_000 },
  ],
};
```

The number, line, nodes, glow, and milestones all derive from `data`.

## Interaction

- **Reveal** — counts up once when it enters the viewport.
- **Hover / drag** — inspect any month; release to return to the current value.
- **Keyboard** — focus the card and use `←/→` (or `↑/↓`) to step months,
  `Home`/`End` to jump to the start/latest.

## Design notes

- **Number is the hero** — massive tabular digits that roll **downward** as the
  count climbs; leading digits and separators slide in with no shift or clip.
- **Light as the story** — a warm glow brightens with the reading and an
  incandescent core ignites near the top; sparse embers lift off igniting nodes
  during the reveal, then it stays calm while you inspect.
- **Restraint** — tuned for daily use in a real UI, not a fireworks demo.
- **Accessible** — exposes a `slider` role with live `aria-valuetext`, full
  keyboard control, and rests on the final state under `prefers-reduced-motion`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Architecture

| File | Role |
| --- | --- |
| `lib/metric.ts` | Generic time‑series model, sampling, milestones |
| `growth/useGrowthController.ts` | In‑view reveal + manual scrub, single source of truth |
| `growth/GrowthCard.tsx` | Composition, reactive glow, scrub surface, API |
| `growth/RollingNumber.tsx` | Fixed‑width downward‑rolling digit reels |
| `growth/GrowthLine.tsx` | Growth curve with a playhead |
| `growth/Timeline.tsx` | Rail, igniting month nodes, playhead |
| `growth/Embers.tsx` | Sparse embers rising from nodes during the reveal |
| `growth/ProfileCard.tsx` | Owner card |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion (`motion`).
