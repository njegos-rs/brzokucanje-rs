'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Eye, EyeOff, X, Loader2, Check, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Category = 'reci' | 'recenice' | 'citati' | 'price' | 'vesti'
type Difficulty = 'lake' | 'srednje' | 'teske'

interface TextRow {
  id: string
  content_lat: string
  content_cyr: string
  content_easy: string
  category: string
  source: string | null
  difficulty: string | null
  is_active: boolean
  created_at: string
}

const CATEGORIES: Category[] = ['reci', 'recenice', 'citati', 'price', 'vesti']
const DIFFICULTIES: Difficulty[] = ['lake', 'srednje', 'teske']

const CATEGORY_LABELS: Record<Category, string> = {
  reci: 'Reči',
  recenice: 'Rečenice',
  citati: 'Citati',
  price: 'Priče',
  vesti: 'Vesti',
}

interface FormState {
  content_lat: string
  content_cyr: string
  content_easy: string
  category: Category
  source: string
  difficulty: Difficulty | ''
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  content_lat: '',
  content_cyr: '',
  content_easy: '',
  category: 'reci',
  source: '',
  difficulty: '',
  is_active: true,
}

interface Props {
  texts: TextRow[]
}

export function SadrzajTable({ texts: initial }: Props) {
  const router = useRouter()
  const [texts, setTexts] = useState(initial)
  const [query, setQuery] = useState('')
  const [filterCat, setFilterCat] = useState<Category | 'sve'>('sve')
  const [filterActive, setFilterActive] = useState<'sve' | 'aktivni' | 'neaktivni'>('sve')
  const [modal, setModal] = useState<{ open: boolean; editing: TextRow | null }>({ open: false, editing: null })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<{ totalInserted: number } | null>(null)

  const filtered = useMemo(() => {
    let rows = texts
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(
        (t) =>
          t.content_lat.toLowerCase().includes(q) ||
          t.content_cyr.toLowerCase().includes(q) ||
          t.source?.toLowerCase().includes(q),
      )
    }
    if (filterCat !== 'sve') rows = rows.filter((t) => t.category === filterCat)
    if (filterActive === 'aktivni') rows = rows.filter((t) => t.is_active)
    if (filterActive === 'neaktivni') rows = rows.filter((t) => !t.is_active)
    return rows
  }, [texts, query, filterCat, filterActive])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setError(null)
    setModal({ open: true, editing: null })
  }

  const openEdit = (text: TextRow) => {
    setForm({
      content_lat: text.content_lat,
      content_cyr: text.content_cyr,
      content_easy: text.content_easy,
      category: text.category as Category,
      source: text.source ?? '',
      difficulty: (text.difficulty as Difficulty) ?? '',
      is_active: text.is_active,
    })
    setError(null)
    setModal({ open: true, editing: text })
  }

  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.content_lat.trim() || !form.content_cyr.trim() || !form.content_easy.trim()) {
      setError('Sva tri polja sadržaja su obavezna.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const payload = {
        content_lat: form.content_lat.trim(),
        content_cyr: form.content_cyr.trim(),
        content_easy: form.content_easy.trim(),
        category: form.category,
        source: form.source.trim() || null,
        difficulty: (form.difficulty || null) as Difficulty | null,
        is_active: form.is_active,
      }

      if (modal.editing) {
        const { error: err } = await supabase
          .from('text_pool')
          .update(payload)
          .eq('id', modal.editing.id)
        if (err) throw err
        setTexts((prev) =>
          prev.map((t) => (t.id === modal.editing!.id ? { ...t, ...payload } : t)),
        )
      } else {
        const { data, error: err } = await supabase
          .from('text_pool')
          .insert(payload)
          .select()
          .single()
        if (err) throw err
        if (data) setTexts((prev) => [data as TextRow, ...prev])
      }

      closeModal()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška pri čuvanju.')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    if (!confirm('Pokrenuće se Gemini AI generisanje (~24 API poziva, može trajati 2-3 minuta). Nastaviti?')) return
    setGenerating(true)
    setGenerateResult(null)
    try {
      const [wordsRes, textsRes] = await Promise.all([
        fetch('/api/admin/generate-words', { method: 'POST' }),
        fetch('/api/admin/generate-texts', { method: 'POST' }),
      ])
      const [wordsJson, textsJson] = await Promise.all([wordsRes.json(), textsRes.json()])
      if (!wordsRes.ok) throw new Error(wordsJson.error ?? 'Greška pri generisanju reči')
      if (!textsRes.ok) throw new Error(textsJson.error ?? 'Greška pri generisanju tekstova')
      setGenerateResult({ totalInserted: (wordsJson.totalInserted ?? 0) + (textsJson.totalInserted ?? 0) })
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Greška pri generisanju')
    } finally {
      setGenerating(false)
    }
  }

  const toggleActive = async (text: TextRow) => {
    setToggling(text.id)
    try {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('text_pool')
        .update({ is_active: !text.is_active })
        .eq('id', text.id)
      if (err) throw err
      setTexts((prev) =>
        prev.map((t) => (t.id === text.id ? { ...t, is_active: !t.is_active } : t)),
      )
    } catch {
      // silent — user sees no change
    } finally {
      setToggling(null)
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži po sadržaju ili izvoru…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['sve', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c as Category | 'sve')}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                filterCat === c
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {c === 'sve' ? 'Sve' : CATEGORY_LABELS[c as Category]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['sve', 'aktivni', 'neaktivni'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                filterActive === f
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
          title="Generiši tekstove pomoću Gemini AI"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? 'Generišem…' : 'AI Generiši'}
        </button>
        {generateResult && (
          <span className="text-xs text-[var(--correct)]">+{generateResult.totalInserted} tekstova dodato</span>
        )}
        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Dodaj tekst
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Sadržaj (lat)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Kategorija</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Težina</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Izvor</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted-foreground)]">Aktivan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                  Nema tekstova
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-3 max-w-xs truncate text-[var(--foreground)]">
                  {t.content_lat}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded px-1.5 py-0.5 text-xs bg-[var(--muted)] text-[var(--foreground)]">
                    {CATEGORY_LABELS[t.category as Category] ?? t.category}
                  </span>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {t.difficulty ?? '—'}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-xs text-[var(--muted-foreground)] max-w-[150px] truncate">
                  {t.source ?? '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(t)}
                    disabled={toggling === t.id}
                    className="inline-flex items-center justify-center"
                    title={t.is_active ? 'Deaktiviraj' : 'Aktiviraj'}
                  >
                    {toggling === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
                    ) : t.is_active ? (
                      <Eye className="h-4 w-4 text-[var(--correct)]" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-[var(--muted-foreground)]" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(t)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Uredi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)] text-right">{filtered.length} prikazano</p>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {modal.editing ? 'Uredi tekst' : 'Dodaj tekst'}
              </h2>
              <button onClick={closeModal} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Kategorija i težina */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Kategorija</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Težina</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty | '' }))}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">—</option>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Latinica */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Sadržaj — Latinica</label>
                <textarea
                  value={form.content_lat}
                  onChange={(e) => setForm((f) => ({ ...f, content_lat: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              {/* Ćirilica */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Sadržaj — Ćirilica</label>
                <textarea
                  value={form.content_cyr}
                  onChange={(e) => setForm((f) => ({ ...f, content_cyr: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              {/* Easy */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Sadržaj — Easy</label>
                <textarea
                  value={form.content_easy}
                  onChange={(e) => setForm((f) => ({ ...f, content_easy: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              {/* Izvor */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Izvor (opciono)</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="npr. Ivo Andrić — Na Drini ćuprija"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Aktivan toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    form.is_active ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                      form.is_active ? 'translate-x-4' : 'translate-x-1',
                    )}
                  />
                </button>
                <span className="text-sm text-[var(--foreground)]">Aktivan</span>
              </div>

              {error && <p className="text-xs text-[var(--incorrect)]">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {modal.editing ? 'Sačuvaj izmene' : 'Dodaj tekst'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
