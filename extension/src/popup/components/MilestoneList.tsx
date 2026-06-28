import { IconCheck } from '../icons'

export function MilestoneList({ milestones, newIdx }: { milestones: string[]; newIdx: number | null }) {
  if (!milestones.length) return null

  return (
    <div className="flex flex-col gap-1.5">
      {milestones.map((label, i) => {
        const isNew = i === newIdx
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              animation: isNew
                ? 'slide-up 0.22s ease-out both, milestone-flash 0.7s ease-out 0.05s both'
                : `slide-up 0.22s ease-out ${i * 0.055}s both`,
            }}
          >
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#059669',
                animation: isNew ? 'check-pop 0.32s cubic-bezier(0.34,1.56,0.64,1) 0.04s both' : undefined,
              }}
            >
              <IconCheck size={11} />
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
