import Image from 'next/image'
import type { CSSProperties } from 'react'

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
]

const TYPING_SEQUENCE = ['B', 'R', 'Z', 'I', 'N', 'A'] as const
const KEY_STEP = new Map(TYPING_SEQUENCE.map((keyName, index) => [keyName, index]))

export function TypingHandsDemo() {
  return (
    <figure className="typing-demo overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] sm:text-xs">
          <span className="typing-demo-live-dot h-2 w-2 rounded-full bg-emerald-400" />
          ritam u&#382;ivo
        </div>
      </div>

      <div className="relative bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_55%)] px-3 pb-5 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
        <div className="mx-auto mb-5 flex max-w-xl items-center justify-between gap-4 sm:mb-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Ve&#382;ba ritma</p>
            <p className="typing-demo-copy mt-1 font-mono text-lg font-semibold text-[var(--foreground)] sm:text-2xl">
              brzina dolazi uz <span className="text-[var(--accent)]">ritam</span><span className="typing-demo-caret">|</span>
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-2 text-right sm:px-4">
            <p className="typing-demo-wpm font-mono text-xl font-bold text-[var(--accent)] sm:text-2xl">72</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">WPM</p>
          </div>
        </div>

        <figcaption className="mx-auto mb-4 max-w-3xl rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.07] px-4 py-2.5 text-center text-xs leading-relaxed text-[var(--muted-foreground)] sm:mb-5 sm:text-sm">
          Svaki prst ima svoju zonu. Posle svakog pritiska vrati ga na po&#269;etni red: <span className="whitespace-nowrap font-mono font-semibold text-[var(--foreground)]">A S D F &middot; J K L &#268;</span>
        </figcaption>

        <div className="typing-demo-stage relative mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-950/90 p-3 pb-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_50px_rgba(0,0,0,0.28)] sm:p-5 sm:pb-28">
          <div className="space-y-1.5 sm:space-y-2">
            {KEY_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1.5 sm:gap-2" style={{ paddingInline: `${rowIndex * 2.4}%` }}>
                {row.map((keyName, keyIndex) => {
                  const sequenceStep = KEY_STEP.get(keyName as (typeof TYPING_SEQUENCE)[number])

                  return (
                    <span
                      key={`${keyName}-${keyIndex}`}
                      className={`typing-demo-key ${sequenceStep !== undefined ? 'typing-demo-key-active' : ''}`}
                      style={sequenceStep !== undefined ? { '--key-delay': `${0.3 + sequenceStep * 0.75}s` } as CSSProperties : undefined}
                    >
                      {keyName}
                    </span>
                  )
                })}
              </div>
            ))}
            <div className="flex justify-center pt-0.5">
              <span className="typing-demo-space h-7 w-2/5 rounded-md border border-white/10 bg-zinc-800 sm:h-10" />
            </div>
          </div>
          <div className="typing-demo-hands-frame pointer-events-none absolute left-1/2 bottom-[-38%] z-10 aspect-[1402/1122] w-[76%] max-w-[34rem] -translate-x-1/2" aria-hidden="true">
          <Image
            src="/typing-hands.png"
            alt="Ruke pravilno položene za brzo kucanje na QWERTY tastaturi"
            fill
            priority
            className="typing-demo-hands-layer typing-demo-hands-left object-contain"
            sizes="(max-width: 640px) 76vw, 34rem"
          />
            <Image
              src="/typing-hands.png"
              alt=""
              fill
              priority
              className="typing-demo-hands-layer typing-demo-hands-right object-contain"
              sizes="(max-width: 640px) 76vw, 34rem"
            />
          </div>
        </div>
      </div>
    </figure>
  )
}
