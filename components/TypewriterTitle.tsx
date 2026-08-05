export function TypewriterTitle() {
  return (
    <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-5xl">
      <span className="typing-title-reveal">
        <span className="text-[var(--accent)]">brzokucanje</span>
        <span className="text-[var(--foreground)]">.rs</span>
      </span>
      <span className="sr-only"> — test brzine kucanja na srpskom</span>
    </h1>
  )
}
