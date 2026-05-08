'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'auto' | 'light' | 'dark'
type FontSize = 'S' | 'M' | 'L'
type CaretStyle = 'off' | 'line' | 'block' | 'outline' | 'underline'
type QuickRestartKey = 'off' | 'tab' | 'esc' | 'enter'

interface SettingsState {
  theme: Theme
  fontSize: FontSize
  caretStyle: CaretStyle
  quickRestartKey: QuickRestartKey
  lazyMode: boolean
  soundEnabled: boolean
  setTheme: (theme: Theme) => void
  setFontSize: (size: FontSize) => void
  setCaretStyle: (style: CaretStyle) => void
  setQuickRestartKey: (key: QuickRestartKey) => void
  setLazyMode: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'auto',
      fontSize: 'M',
      caretStyle: 'line',
      quickRestartKey: 'tab',
      lazyMode: false,
      soundEnabled: false,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setQuickRestartKey: (quickRestartKey) => set({ quickRestartKey }),
      setLazyMode: (lazyMode) => set({ lazyMode }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: 'brzokucanje-settings' },
  ),
)
