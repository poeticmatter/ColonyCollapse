import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
}

/** A bordered section of the screen. */
export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-2xl border border-rule bg-paper p-3 ${className}`}>
      {title && <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">{title}</h2>}
      {children}
    </section>
  )
}
