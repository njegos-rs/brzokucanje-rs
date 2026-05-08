'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, Loader2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Category = 'psovka' | 'uvreda' | 'spam' | 'drugo'

interface WordRow {
  id: string
  word: string
  category: string | null
  added_by: string | null
  created_at: string
}

const CATEGORIES: Category[] = ['psovka', 'uvreda', 'spam', 'drugo']

interface Props {
  words: WordRow[]
}

export function ProfanityTable({ words: initial }: Props) {
  const router = useRouter()
  const [words, setWords] = useState(initial)
  const [query, setQuery] = useState('')
  const [filterCat, setFilterCat] = useState<Category | 'sve'>('sve')
  const [bulkInput, setBulkInput] = useState('')
  const [bulkCategory, setBulkCategory] = useState<Category>('psovka')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let rows = words
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter((w) => w.word.toLowerCase().includes(q))
    }
    if (filterCat !== 'sve') rows = rows.filter((w) => w.category === filterCat)
    return rows
  }, [words, query, filterCat])

  const handleBulkAdd = async () => {
    const newWords = bulkInput
      .split(/[\n,;]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0 && !words.some((existing) => existing.word === w))

    if (newWords.length === 0) {
      setError('Nema novih reči za dodavanje.')
      return
    }

    setAdding(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const inserts = newWords.map((word) => ({
        word,
        category: bulkCategory,
        added_by: user?.id ?? null,
      }))

      const { data, error: err } = await supabase
        .from('profanity_words')
        .insert(inserts)
        .select()

      if (err) throw err

      setWords((prev) => [...(data as WordRow[]), ...prev])
      setBulkInput('')
      setSuccess(`Dodano ${data?.length ?? 0} reči.`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška pri dodavanju.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('profanity_words').delete().eq('id', id)
      if (err) throw err
      setWords((prev) => prev.filter((w) => w.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška pri brisanju.')
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = () => {
    const json = JSON.stringify(
      words.map((w) => ({ word: w.word, category: w.category })),
      null,
      2,
    )
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'profanity-list.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Bulk dodavanje */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Dodaj reči</h2>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Unesi reči odvojene zarezom, tačkom-zarezom ili novim redom.
        </p>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          rows={4}
          placeholder="kurac, pizda, govno..."
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none font-mono"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setBulkCategory(c)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                  bulkCategory === c
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={handleBulkAdd}
            disabled={adding || !bulkInput.trim()}
            className="ml-auto flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Dodaj
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-[var(--incorrect)]">{error}</p>}
        {success && <p className="mt-2 text-xs text-[var(--correct)]">{success}</p>}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži..."
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex gap-1">
          {(['sve', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c as Category | 'sve')}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                filterCat === c
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {c === 'sve' ? 'Sve' : c}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export JSON
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Reč</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Kategorija</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Dodato</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                  Nema reči
                </td>
              </tr>
            )}
            {filtered.map((w) => (
              <tr key={w.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-[var(--foreground)]">{w.word}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded px-1.5 py-0.5 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] capitalize">
                    {w.category ?? 'drugo'}
                  </span>
                </td>
                <td className="hidden md:table-cell px-4 py-2.5 text-xs text-[var(--muted-foreground)]">
                  {new Date(w.created_at).toLocaleDateString('sr-RS')}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => handleDelete(w.id)}
                    disabled={deleting === w.id}
                    className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--incorrect)] transition-colors"
                  >
                    {deleting === w.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                    Ukloni
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--muted-foreground)] text-right">{filtered.length} prikazano</p>
    </div>
  )
}
