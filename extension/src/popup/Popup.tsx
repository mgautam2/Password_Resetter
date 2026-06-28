import { useEffect, useRef, useState } from 'react'
import type { AgentState, Status } from '../types'

// ── Icons ───────────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconWarn() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

// ── Live Status Card ────────────────────────────────────────────────────────
// Slides in fresh each time the message changes (key prop forces remount).

function LiveStatusCard({ message }: { message?: string }) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-indigo-100 bg-indigo-50"
      style={{ animation: 'slide-down 0.2s ease-out both' }}
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full bg-indigo-500"
        style={{ animation: 'record-pulse 1.1s ease-in-out infinite' }}
      />
      <span className="flex-1 min-w-0 truncate text-sm text-indigo-700 font-medium leading-snug">
        {message || 'Working…'}
      </span>
    </div>
  )
}

// ── Milestone List ──────────────────────────────────────────────────────────
// newIdx = index of most recently committed milestone, drives the flash + check-pop.

function MilestoneList({ milestones, newIdx }: { milestones: string[]; newIdx: number | null }) {
  if (!milestones.length) return null

  return (
    <div className="flex flex-col gap-1.5">
      {milestones.map((label, i) => {
        const isNew = i === newIdx
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-white"
            style={{
              animation: isNew
                ? 'slide-up 0.22s ease-out both, milestone-flash 0.7s ease-out 0.05s both'
                : `slide-up 0.22s ease-out ${i * 0.055}s both`,
            }}
          >
            <span
              className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"
              style={isNew ? { animation: 'check-pop 0.32s cubic-bezier(0.34,1.56,0.64,1) 0.04s both' } : {}}
            >
              <IconCheck size={11} />
            </span>
            <span className="text-sm text-slate-600">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Final Status Card ───────────────────────────────────────────────────────

function FinalStatusCard({ status, message }: { status: Status; message?: string }) {
  if (status === 'success') {
    return (
      <div
        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-emerald-200 bg-emerald-50"
        style={{ animation: 'slide-up 0.25s ease-out both' }}
      >
        <span
          className="shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"
          style={{ animation: 'pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.08s both' }}
        >
          <IconCheck size={11} />
        </span>
        <span className="text-sm text-emerald-700 font-semibold">Password reset complete</span>
      </div>
    )
  }

  if (status === 'stuck') {
    return (
      <div
        className="flex items-start gap-3 px-3.5 py-3 rounded-xl border border-amber-200 bg-amber-50"
        style={{ animation: 'slide-up 0.25s ease-out both, stuck-pulse 2s ease-in-out 0.3s infinite' }}
      >
        <span className="shrink-0 text-amber-500 mt-0.5"><IconWarn /></span>
        <span className="text-sm text-amber-700 leading-snug">{message || 'Needs your attention'}</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-red-100 bg-red-50"
        style={{ animation: 'slide-up 0.25s ease-out both' }}
      >
        <span className="text-sm text-red-600">{message || 'Something went wrong'}</span>
      </div>
    )
  }

  return null
}

// ── Password Card ───────────────────────────────────────────────────────────

function PasswordCard({ password }: { password: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50"
      style={{ animation: 'slide-up 0.25s ease-out 0.12s both' }}
    >
      <code className="flex-1 text-xs font-mono text-slate-700 tracking-wider truncate">{password}</code>
      <button
        onClick={copy}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
        style={
          copied
            ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
            : { background: 'rgba(99,102,241,0.08)', color: '#6366f1' }
        }
      >
        {copied ? <><IconCheck size={12} /> Copied</> : <><IconCopy /> Copy</>}
      </button>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function Popup() {
  const [state, setState] = useState<AgentState>({ status: 'idle' })
  const [newMilestoneIdx, setNewMilestoneIdx] = useState<number | null>(null)
  const prevMilestonesLen = useRef(0)

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'sidepanel' })
    return () => port.disconnect()
  }, [])

  useEffect(() => {
    chrome.storage.local.get('arcade', (result) => {
      setState((result['arcade'] as AgentState) ?? { status: 'idle' })
    })
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('arcade' in changes) setState((changes['arcade'].newValue as AgentState) ?? { status: 'idle' })
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // When a new milestone arrives, mark it for the commit animation.
  useEffect(() => {
    const milestones = state.milestones ?? []
    if (milestones.length > prevMilestonesLen.current) {
      setNewMilestoneIdx(milestones.length - 1)
      setTimeout(() => setNewMilestoneIdx(null), 800)
    }
    prevMilestonesLen.current = milestones.length
  }, [state.milestones])

  const startReset = () => chrome.runtime.sendMessage({ action: 'start_reset' })

  const isRunning = state.status === 'running'
  const isTerminal = ['success', 'stuck', 'error'].includes(state.status)
  const milestones = state.milestones ?? []

  return (
    <div className="w-80 bg-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white">
            <IconLock />
          </div>
          <span className="text-sm font-semibold text-slate-800 tracking-tight">Arcade</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${state.connected ? 'bg-emerald-500' : 'bg-slate-300'}`}
            style={state.connected ? { animation: 'record-pulse 2.5s ease-in-out infinite' } : {}}
          />
          <span className="text-xs text-slate-400">{state.connected ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4">

        {/* Idle hint */}
        {state.status === 'idle' && (
          <p className="text-xs text-slate-400 text-center py-2">
            Ready to reset a password
          </p>
        )}

        {/* Live status — remounts on each new message to retrigger slide-down */}
        {isRunning && (
          <LiveStatusCard key={state.message} message={state.message} />
        )}

        {/* Completed milestones */}
        <MilestoneList milestones={milestones} newIdx={newMilestoneIdx} />

        {/* Terminal state card (success / stuck / error) */}
        {isTerminal && (
          <FinalStatusCard status={state.status} message={state.message} />
        )}

        {/* Password reveal */}
        {state.status === 'success' && state.password && (
          <PasswordCard password={state.password} />
        )}

        {/* CTA */}
        <button
          onClick={startReset}
          disabled={isRunning}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed mt-1"
          style={
            isRunning
              ? {
                  background: 'linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 50%, #e0e7ff 100%)',
                  backgroundSize: '200% 100%',
                  color: '#818cf8',
                  animation: 'shimmer 1.6s linear infinite',
                }
              : {
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                }
          }
        >
          {isRunning ? 'Resetting…' : 'Start Reset'}
        </button>
      </div>
    </div>
  )
}
