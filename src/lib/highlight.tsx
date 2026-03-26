function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>

  const parts = text.split(new RegExp(`(${escapeRegex(q)})`, 'gi'))
  const lq    = q.toLowerCase()

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lq
          ? <mark key={i} className="search-highlight">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}
