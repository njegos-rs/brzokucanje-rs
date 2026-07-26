'use client'

import { useRef, useCallback, useEffect } from 'react'

export type SoundTheme = 'off' | 'sound1' | 'sound2' | 'sound3' | 'sound4' | 'sound5'

export function useKeystrokeSound(theme: SoundTheme) {
  const ctxRef = useRef<AudioContext | null>(null)
  const buffersRef = useRef<Record<string, AudioBuffer>>({})
  const loadingRef = useRef<Record<string, boolean>>({})
  const previewNodesRef = useRef<AudioBufferSourceNode[]>([])

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctxRef.current = new Ctor()
    }
    return ctxRef.current
  }, [])

  const loadBuffer = useCallback(async (ctx: AudioContext, type: SoundTheme) => {
    if (type === 'off') return null
    if (buffersRef.current[type]) return buffersRef.current[type]
    if (loadingRef.current[type]) return null
    
    loadingRef.current[type] = true
    try {
      const res = await fetch(`/sounds/${type}.mp3`)
      const arrayBuffer = await res.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      buffersRef.current[type] = audioBuffer
      return audioBuffer
    } catch (e) {
      console.error('Failed to load sound', type, e)
    } finally {
      loadingRef.current[type] = false
    }
    return null
  }, [])

  useEffect(() => {
    if (theme !== 'off') {
      const ctx = getCtx()
      if (ctx) loadBuffer(ctx, theme)
    }
  }, [theme, getCtx, loadBuffer])

  // Očisti preostale preview zvukove ako korisnik napusti stranicu
  useEffect(() => {
    return () => {
      previewNodesRef.current.forEach(node => {
        try {
          node.stop()
          node.disconnect()
        } catch {
          // Ignoriši ako je već završen
        }
      })
      previewNodesRef.current = []
    }
  }, [])

  const play = useCallback(() => {
    if (theme === 'off') return
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    
    const buffer = buffersRef.current[theme]
    if (!buffer) return
    
    const src = ctx.createBufferSource()
    src.buffer = buffer
    
    // Varijacija tona za prirodan zvuk (±8%)
    src.playbackRate.value = 0.92 + Math.random() * 0.16
    
    const gain = ctx.createGain()
    
    // Sečemo zvuk na max 0.25 sekundi da se ne bi otezalo 2 sekunde
    const dur = Math.min(buffer.duration, 0.25)
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start(ctx.currentTime)
    src.stop(ctx.currentTime + dur + 0.05)
  }, [theme, getCtx])

  const playPreview = useCallback(async (selectedTheme: SoundTheme) => {
    const ctx = getCtx()
    if (!ctx) return
    
    // Uvek prvo prekidamo sve zakazane zvukove iz prethodnog preview-a
    previewNodesRef.current.forEach(node => {
      try {
        node.stop()
        node.disconnect()
      } catch {
        // Ignoriši ako je već završen
      }
    })
    previewNodesRef.current = []

    if (selectedTheme === 'off') return
    if (ctx.state === 'suspended') await ctx.resume()
    
    const buffer = await loadBuffer(ctx, selectedTheme)
    if (!buffer) return
    
    let time = ctx.currentTime
    for (let i = 0; i < 20; i++) {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.playbackRate.value = 0.92 + Math.random() * 0.16
      const gain = ctx.createGain()
      
      const dur = Math.min(buffer.duration, 0.25)
      gain.gain.setValueAtTime(0.5, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
      
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start(time)
      src.stop(time + dur + 0.05)
      
      previewNodesRef.current.push(src)
      
      // Simuliramo nasumično kucanje
      time += 0.05 + Math.random() * 0.2
    }
  }, [getCtx, loadBuffer])

  return { play, playPreview }
}




