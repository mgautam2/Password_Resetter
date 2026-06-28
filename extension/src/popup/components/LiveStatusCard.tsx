export function LiveStatusCard({ message }: { message?: string }) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
      style={{
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        animation: 'slide-down 0.2s ease-out both',
      }}
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ background: 'var(--accent)', animation: 'record-pulse 1.1s ease-in-out infinite' }}
      />
      <span
        className="flex-1 min-w-0 truncate text-sm font-medium leading-snug"
        style={{ color: 'var(--accent-dark)' }}
      >
        {message || 'Working…'}
      </span>
    </div>
  )
}
