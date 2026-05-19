'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SoundTheme } from '@/lib/hooks/useKeystrokeSound'

type Theme = 'auto' | 'light' | 'dark'
type FontSize = 'S' | 'M' | 'L'
type CaretStyle = 'off' | 'line' | 'block' | 'outline' | 'underline'
type QuickRestartKey = 'off' | 'tab' | 'esc' | 'enter'

interface SettingsState {
  theme: Theme
  fontSize: FontSize
  caretStyle: CaretStyle
  quickRestartKey: QuickRestartKey
  soundTheme: SoundTheme
  setTheme: (theme: Theme) => void
  setFontSize: (size: FontSize) => void
  setCaretStyle: (style: CaretStyle) => void
  setQuickRestartKey: (key: QuickRestartKey) => void
  setSoundTheme: (theme: SoundTheme) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'auto',
      fontSize: 'M',
      caretStyle: 'line',
      quickRestartKey: 'tab',
      soundTheme: 'off',
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setQuickRestartKey: (quickRestartKey) => set({ quickRestartKey }),
      setSoundTheme: (soundTheme) => set({ soundTheme }),
    }),
    { name: 'brzokucanje-settings' },
  ),
)
