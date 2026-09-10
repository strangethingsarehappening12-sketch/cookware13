interface ReminderCardProps {
  reminders: number
  pitches: number
}

export default function ReminderCard({ reminders, pitches }: ReminderCardProps) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border-[3px] border-ink bg-white p-8 shadow-thick sm:p-12">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-ink px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">{reminders}</p>
          <p className="font-mono text-[11px] text-ink/60">REMINDER{reminders === 1 ? '' : 'S'}</p>
        </div>
        <div className="rounded-xl border-2 border-ink px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">{pitches}</p>
          <p className="font-mono text-[11px] text-ink/60">PITCH{pitches === 1 ? '' : 'ES'}</p>
        </div>
      </div>

      <p className="mt-6 font-display text-xl font-semibold sm:text-2xl">
        Vlad, it's time to pitch tokenized Cookware.
      </p>
    </div>
  )
}
