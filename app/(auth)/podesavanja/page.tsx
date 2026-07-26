'use client'

import { useSettingsStore } from '@/lib/stores/settings-store'
import { cn } from '@/lib/utils'
import { useKeystrokeSound, type SoundTheme } from '@/lib/hooks/useKeystrokeSound'

const CARET_OPTIONS = [
  { value: 'off', label: 'Isključen' },
  { value: 'line', label: '| Linija' },
  { value: 'block', label: '▮ Blok' },
  { value: 'outline', label: '▯ Okvir' },
  { value: 'underline', label: '_ Podvlaka' },
] as const

const RESTART_KEY_OPTIONS = [
  { value: 'off', label: 'Isključen' },
  { value: 'tab', label: 'Tab' },
  { value: 'esc', label: 'Esc' },
  { value: 'enter', label: 'Enter' },
] as const

const SOUND_OPTIONS = [
  { value: 'off', label: 'Isključen' },
  { value: 'sound1', label: 'Sound 1' },
  { value: 'sound2', label: 'Sound 2' },
  { value: 'sound3', label: 'Sound 3' },
  { value: 'sound4', label: 'Sound 4' },
  { value: 'sound5', label: 'Sound 5' },
] as const

function SettingRow({
  label,
  description,
  inline,
  children,
}: {
  label: string
  description?: string
  inline?: boolean
  children: React.ReactNode
}) {
  if (inline) {
    return (
      <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--border)] last:border-0">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
          {description && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    )
  }
  return (
    <div className="py-4 border-b border-[var(--border)] last:border-0">
      <div className="mb-2.5">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
            value === opt.value
              ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]'
              : 'bg-transparent border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function PodesavanjaPage() {
  const settings = useSettingsStore()
  const { playPreview } = useKeystrokeSound(settings.soundTheme)

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-[var(--foreground)]">Podešavanja</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5">

        <SettingRow inline label="Tema" description="Automatski prati sistemsku temu">
          <SegmentedControl
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Svetla' },
              { value: 'dark', label: 'Tamna' },
            ] as const}
            value={settings.theme}
            onChange={settings.setTheme}
          />
        </SettingRow>

        <SettingRow inline label="Veličina fonta" description="Veličina teksta u oblasti za kucanje">
          <SegmentedControl
            options={[
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
            ] as const}
            value={settings.fontSize}
            onChange={settings.setFontSize}
          />
        </SettingRow>

        <SettingRow label="Stil kursora" description="Izgled kursora u oblasti za kucanje">
          <SegmentedControl
            options={CARET_OPTIONS}
            value={settings.caretStyle}
            onChange={settings.setCaretStyle}
          />
        </SettingRow>

        <SettingRow label="Brzi restart" description="Taster za brzi restart testa">
          <SegmentedControl
            options={RESTART_KEY_OPTIONS}
            value={settings.quickRestartKey}
            onChange={settings.setQuickRestartKey}
          />
        </SettingRow>

        <SettingRow label="Zvuk" description="Zvuk pritiska tastera tokom kucanja">
          <SegmentedControl
            options={SOUND_OPTIONS}
            value={settings.soundTheme}
            onChange={(val) => {
              settings.setSoundTheme(val as SoundTheme)
              playPreview(val as SoundTheme)
            }}
          />
        </SettingRow>

      </div>

      <p className="mt-5 text-center text-xs text-[var(--muted-foreground)]">
        Podešavanja se čuvaju automatski u browser-u.
      </p>
    </div>
  )
}
