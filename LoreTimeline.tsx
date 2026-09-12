export interface TimelineEntry {
  day: number
  note: string
}

interface LoreTimelineProps {
  entries: TimelineEntry[]
  currentDay: number
}

export default function LoreTimeline({ entries, currentDay }: LoreTimelineProps) {
  return (
    <ol className="relative border-l-[3px] border-ink pl-8">
      {entries.map((entry, i) => {
        const isPast = entry.day <= currentDay
        return (
          <li key={entry.day} className={i === entries.length - 1 ? '' : 'mb-10'}>
            <span
              className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-ink ${
                isPast ? 'bg-clay' : 'bg-cream'
              }`}
            />
            <p className="font-display text-2xl font-bold">DAY {entry.day}</p>
            <p className="mt-1 text-ink/70">{entry.note}</p>
          </li>
        )
      })}
    </ol>
  )
}
