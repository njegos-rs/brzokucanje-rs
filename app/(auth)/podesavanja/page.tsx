'use client'

import { useSettingsStore } from '@/lib/stores/settings-store'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

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

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[var(--border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
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
    <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors border-r border-[var(--border)] last:border-0',
            value === opt.value
              ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
              : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-1',
        )}
      />
    </button>
  )
}

export default function PodesavanjaPage() {
  const settings = useSettingsStore()

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-[var(--foreground)]">Podešavanja</h1>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4">
        <SettingRow
          label="Tema"
          description="Automatski prati sistemsku temu"
        >
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

        <SettingRow
          label="Veličina fonta"
          description="Veličina teksta u oblasti za kucanje"
        >
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

        <SettingRow
          label="Stil kursora"
          description="Izgled kursora u oblasti za kucanje"
        >
          <SegmentedControl
            options={CARET_OPTIONS}
            value={settings.caretStyle}
            onChange={settings.setCaretStyle}
          />
        </SettingRow>

        <SettingRow
          label="Brzi restart"
          description="Taster za brzi restart testa"
        >
          <SegmentedControl
            options={RESTART_KEY_OPTIONS}
            value={settings.quickRestartKey}
            onChange={settings.setQuickRestartKey}
          />
        </SettingRow>

        <SettingRow
          label="Lazy mode"
          description="Prihvata c umesto č/ć, s umesto š, z umesto ž"
        >
          <Toggle checked={settings.lazyMode} onChange={settings.setLazyMode} />
        </SettingRow>

        <SettingRow
          label="Zvuk"
          description="Zvuk pritiska tastera tokom kucanja"
        >
          <Toggle checked={settings.soundEnabled} onChange={settings.setSoundEnabled} />
        </SettingRow>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
        Podešavanja se čuvaju automatski u browser-u.
      </p>
    </div>
  )
}
