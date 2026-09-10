# COOKWARE — Remind Vlad

Day 1 of reminding Vlad to pitch Cookware. A React + TypeScript + Tailwind site
that turns the campaign into a live, shareable tracker.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static `dist/` you
can deploy anywhere (Vercel, Netlify, GitHub Pages, etc).

## Everything is configurable in one place

Edit `src/config.ts`:

- `launchDate` — Day 1. The day counter derives from this automatically.
- `startingReminderCount` / `startingPitchCount` — initial counter values.
- `targetMarketCap` — the goal (defaults to $1B).
- `placeholderProgress` — symbolic progress toward the goal, until a real feed exists.
- `vladStatus` — default pitch status (`'not_pitched'` or `'pitched'`).

## Swapping in a real backend later

- **Counters**: `src/hooks/useLocalStorage.ts` is the single place demo
  persistence lives. Swap its two `useEffect`/`useState` calls for API
  requests and every component that consumes it (`Counter`, `App`) keeps
  working unchanged.
- **Market cap**: `getMarketCapProgress()` in `src/config.ts` is an isolated
  async function. Point it at a real market-cap API and return
  `currentCap / targetMarketCap`.
- **Vlad status**: currently toggled by the "demo control" button on the
  tracker card for demo purposes. Wire it to a real source of truth (a CMS
  field, a database flag, a form submission you moderate) by replacing that
  one `onToggleDemo` handler in `App.tsx`.

## Structure

```
src/
  config.ts              single config object + day/progress helpers
  App.tsx                page composition
  hooks/useLocalStorage.ts
  components/
    Header.tsx
    Footer.tsx
    Counter.tsx
    ProgressBar.tsx
    VladStatus.tsx
    ReminderCard.tsx
    LoreTimeline.tsx
    CopyReminderButton.tsx
    CookwarePot.tsx
```

## Notes

This site makes no claim that Vlad has endorsed or will endorse Cookware — it's
a public, humorous reminder campaign, and the copy is written to keep it that
way. Keep any future copy changes consistent with that.
