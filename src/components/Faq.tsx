import { useState } from 'react'

interface FaqItem {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'What do I get for holding COOKWARE?',
    answer: 'You get the Robinhood stock $HOOD airdropped straight to your wallet.',
  },
  {
    question: 'How much HOOD do I get?',
    answer:
      'Your payout is proportional to your share of the supply. The more you hold, the larger your share of each payout.',
  },
  {
    question: 'Where does the $HOOD come from?',
    answer:
      "Every buy and sell has a 3% trading fee. 80% of each fee is allocated toward $HOOD distributions for holders, while the remaining 20% is directed toward liquidity.",
  },
  {
    question: 'What do I do to claim my rewards?',
    answer: 'Nothing. Rewards are sent in batches directly to your wallet. You do not have to click any buttons.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-4">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-2xl border-[3px] border-ink bg-cream shadow-thickSm"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-display text-lg font-bold sm:text-xl"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <span
                className={`shrink-0 font-display text-2xl leading-none transition-transform ${
                  isOpen ? 'rotate-45 text-clay' : 'text-ink/40'
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="border-t-[3px] border-ink px-6 py-5 text-ink/80">{item.answer}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
