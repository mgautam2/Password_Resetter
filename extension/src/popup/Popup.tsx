import { useEffect, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import type { AgentState } from '../types'
import { ArcadeMark, IconRefresh, IconGmail } from './icons'
import { ConnectionLostBanner } from './components/ConnectionLostBanner'
import { LiveStatusCard } from './components/LiveStatusCard'
import { MilestoneList } from './components/MilestoneList'
import { FinalStatusCard } from './components/FinalStatusCard'
import { PasswordCard } from './components/PasswordCard'

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

  useEffect(() => {
    const milestones = state.milestones ?? []
    if (milestones.length > prevMilestonesLen.current) {
      setNewMilestoneIdx(milestones.length - 1)
      setTimeout(() => setNewMilestoneIdx(null), 800)
    }
    prevMilestonesLen.current = milestones.length
  }, [state.milestones])

  const startReset = () => chrome.runtime.sendMessage({ action: 'start_reset' })
  const newSession = () => chrome.runtime.sendMessage({ action: 'new_session' })
  const connectGmail = () => chrome.runtime.sendMessage({ action: 'authorize_gmail' })

  const milestones = state.milestones ?? []
  const isRunning = state.status === 'running'
  const isTerminal = ['success', 'stuck', 'error'].includes(state.status)
  const isOffline = !state.connected
  const lostConnection = isOffline && (milestones.length > 0 || !!state.message)
  const ctaDisabled = isRunning || isOffline
  const needsGmailAuth = state.gmailAuthorized === false

  return (
    <div className="w-80 flex flex-col bg-[var(--bg)]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--accent)] text-[var(--bg)]">
            <ArcadeMark />
          </div>
          <span className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Locksmythe
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cx('w-1.5 h-1.5 rounded-full', state.connected ? 'bg-emerald-500' : 'bg-red-500')}
            style={state.connected ? { animation: 'record-pulse 2.5s ease-in-out infinite' } : undefined}
          />
          <span className={cx('text-sm', isOffline ? 'text-red-600' : 'text-[var(--text-muted)]')}>
            {state.connected ? 'Connected' : 'Offline'}
          </span>
          <button
            onClick={newSession}
            title="Fresh session"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 text-[var(--text-muted)] hover:bg-[var(--surface)]"
          >
            <IconRefresh />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4">

        {lostConnection && <ConnectionLostBanner />}

        {state.status === 'idle' && !lostConnection && !needsGmailAuth && (
          <p className="text-sm text-center py-2 text-[var(--text-muted)]">
            {isOffline ? 'Waiting for backend…' : 'Ready to reset a password'}
          </p>
        )}

        {(isRunning || (isOffline && state.message && !isTerminal)) && (
          <LiveStatusCard key={state.message} message={state.message} />
        )}

        <MilestoneList milestones={milestones} newIdx={newMilestoneIdx} />

        {isTerminal && <FinalStatusCard status={state.status} message={state.message} />}

        {state.status === 'success' && state.password && <PasswordCard password={state.password} />}

        {!isTerminal && !lostConnection && needsGmailAuth && (
          <div className="rounded-xl p-4 flex flex-col gap-3 bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <IconGmail />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Connect Gmail
                </p>
                <p className="text-xs mt-0.5 leading-relaxed text-[var(--text-muted)]">
                  Locksmythe will search your inbox for the reset email and extract the link automatically.
                </p>
              </div>
            </div>
            <button
              onClick={connectGmail}
              disabled={isOffline}
              className={cx(
                'w-full py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed flex items-center justify-center gap-2',
                isOffline
                  ? 'bg-[var(--border)] text-[var(--text-muted)]'
                  : 'bg-[var(--text-primary)] text-[#FAF9F7]',
              )}
            >
              Authorise with Google
            </button>
          </div>
        )}

        {!isTerminal && !lostConnection && !needsGmailAuth && (
          <button
            onClick={startReset}
            disabled={ctaDisabled}
            className="w-full py-2.5 rounded-xl text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed mt-1"
            style={
              isRunning
                ? {
                    background: 'linear-gradient(90deg, #e8e4dc 0%, #d5d0c8 50%, #e8e4dc 100%)',
                    backgroundSize: '200% 100%',
                    color: 'var(--text-muted)',
                    animation: 'shimmer 1.6s linear infinite',
                  }
                : ctaDisabled
                ? { background: 'var(--border)', color: 'var(--text-muted)' }
                : { background: 'var(--text-primary)', color: '#FAF9F7' }
            }
          >
            {isRunning ? 'Resetting…' : 'Start Reset'}
          </button>
        )}
      </div>
    </div>
  )
}
