export function ConnectionLostBanner() {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
      style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        animation: 'slide-down 0.2s ease-out both',
      }}
    >
      <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
      <span className="text-sm font-medium" style={{ color: '#dc2626' }}>
        Connection lost — last known state shown below
      </span>
    </div>
  )
}
