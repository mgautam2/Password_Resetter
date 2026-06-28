import { useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'running' | 'stuck' | 'success' | 'error'

interface AgentState {
  status: Status
  message?: string
  password?: string
  steps?: string[]
  milestones?: string[]
  connected?: boolean
}

function MilestoneBar({ milestones }: { milestones: string[] }) {
  if (!milestones.length) return null
  return (
    <div className="flex flex-col gap-1">
      {milestones.map((label, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-blue-700">
          <span className="text-blue-500">✓</span>
          <span className="font-medium">{label}</span>
        </div>
      ))}
    </div>
  )
}

function StepLog({ steps, status }: { steps: string[]; status: Status }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length])

  return (
    <div className="flex flex-col gap-1 max-h-36 overflow-y-auto text-xs font-mono">
      {steps.map((step, i) => {
        const isCurrent = i === steps.length - 1 && status === 'running'
        return (
          <div key={i} className={`flex items-start gap-2 ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
            <span className="shrink-0 mt-0.5">{isCurrent ? '›' : '·'}</span>
            <span className="break-all">{step}</span>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

export default function Popup() {
  const [state, setState] = useState<AgentState>({ status: 'idle' })
  const [copied, setCopied] = useState(false)

  // Open a long-lived port so the background knows the panel is open and can
  // (re)connect the socket. When this panel closes, the port disconnects and
  // the background tears down the socket + clears storage.
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'sidepanel' })
    return () => port.disconnect()
  }, [])

  // Mirror the persisted `arcade` state into React.
  useEffect(() => {
    chrome.storage.local.get('arcade', (result) => {
      setState((result['arcade'] as AgentState) ?? { status: 'idle' })
    })
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('arcade' in changes) setState(changes['arcade'].newValue ?? { status: 'idle' })
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const startReset = () => chrome.runtime.sendMessage({ action: 'start_reset' })

  const copyPassword = () => {
    if (!state.password) return
    navigator.clipboard.writeText(state.password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const milestones = state.milestones ?? []
  const steps = state.steps ?? []
  const isRunning = state.status === 'running'
  const hasActivity = milestones.length > 0 || steps.length > 0

  return (
    <div className="w-80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold m-0 text-gray-800">Password Reset</h2>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-400">{state.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {hasActivity && (
        <div className="border border-gray-100 rounded-xl bg-gray-50 p-3 flex flex-col gap-3">
          {milestones.length > 0 && <MilestoneBar milestones={milestones} />}

          {steps.length > 0 && (
            <>
              {milestones.length > 0 && <hr className="border-gray-200 m-0" />}
              <StepLog steps={steps} status={state.status} />
            </>
          )}
        </div>
      )}

      {state.status === 'stuck' && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 m-0">
          {state.message}
        </p>
      )}

      {state.status === 'success' && state.password && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <code className="flex-1 text-sm font-mono text-green-800 truncate">{state.password}</code>
          <button
            onClick={copyPassword}
            className="text-sm text-green-700 font-medium hover:text-green-900 transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <button
        onClick={startReset}
        disabled={isRunning}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isRunning ? 'Resetting…' : 'Start Reset'}
      </button>
    </div>
  )
}
