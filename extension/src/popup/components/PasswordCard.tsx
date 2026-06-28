import { useState } from 'react'
import { IconCheck, IconCopy, IconEye, IconEyeOff } from '../icons'

export function PasswordCard({ password }: { password: string }) {
  const [copied, setCopied] = useState(false)
  const [shown, setShown] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        animation: 'slide-up 0.25s ease-out 0.12s both',
      }}
    >
      <code className="flex-1 text-xs font-mono tracking-wider truncate" style={{ color: 'var(--text-primary)' }}>
        {shown ? password : '•'.repeat(password.length)}
      </code>
      <button
        onClick={() => setShown(s => !s)}
        className="shrink-0 flex items-center p-1 rounded transition-colors duration-150"
        style={{ color: 'var(--text-muted)' }}
        title={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? <IconEyeOff /> : <IconEye />}
      </button>
      <button
        onClick={copy}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
        style={
          copied
            ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
            : { background: 'var(--accent-bg)', color: 'var(--accent)' }
        }
      >
        {copied ? <><IconCheck size={12} /> Copied</> : <><IconCopy /> Copy</>}
      </button>
    </div>
  )
}
