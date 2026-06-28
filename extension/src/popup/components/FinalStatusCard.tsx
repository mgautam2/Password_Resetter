import type { Status } from '../../types'
import { IconCheck, IconWarn } from '../icons'

export function FinalStatusCard({ status, message }: { status: Status; message?: string }) {
  if (status === 'success') {
    return (
      <div
        className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
          animation: 'slide-up 0.25s ease-out both',
        }}
      >
        <span
          className="shrink-0 w-5 h-5 rounded-full text-white flex items-center justify-center"
          style={{
            background: '#10b981',
            animation: 'pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.08s both',
          }}
        >
          <IconCheck size={11} />
        </span>
        <span className="text-sm font-semibold" style={{ color: '#065f46' }}>Password reset complete</span>
      </div>
    )
  }

  if (status === 'stuck') {
    return (
      <div
        className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
        style={{
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          animation: 'slide-up 0.25s ease-out both, stuck-pulse 2s ease-in-out 0.3s infinite',
        }}
      >
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }}><IconWarn /></span>
        <span className="text-sm leading-snug" style={{ color: 'var(--accent-dark)' }}>
          {message || 'Needs your attention'}
        </span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          animation: 'slide-up 0.25s ease-out both',
        }}
      >
        <span className="text-sm" style={{ color: '#dc2626' }}>{message || 'Something went wrong'}</span>
      </div>
    )
  }

  return null
}
