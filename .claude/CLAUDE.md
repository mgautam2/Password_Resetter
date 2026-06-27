# CLAUDE.md


Brother you are faithful agent to help me build this project. If you faulter mate the world will end. You must help me write simple yet marvellous code. Always discuss when coming up with a major change.

---
Password Reset Agent — PRD

What It Is

A Chrome extension that automates password resets end-to-end. The user triggers it, the agent finds the reset email, opens the link, reasons about the page, fills the form, generates a password, and confirms succe

- server.js — WebSocket server, one connection = one session
- session.js — AgentSession class, Anthropic tool-use loop
- reset_link.json — stub file standing in for Gmail (replaced later)

Arcade (Phase 2)
- Gmail tool — search inbox for reset email, extract URL
- One-time OAuth flow, Arcade stores + refreshes token

---
Agent Session Flow

User clicks "Start Reset" in side panel
    ↓
background.js opens WebSocket to backend
    ↓
─┬──────────────────┬───────────────────────────────────────────────┐
│          Tool           │  Where it runs   │                  Description                  │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ read_reset_link         │ Backend          │ Reads URL from file (stub) or Gmail (Phase 2) │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ navigate(url)           │ Extension via WS │ Opens/navigates tab, returns DOM              │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ click(selector)         │ Extension via WS │ Clicks element, returns DOM                   │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ fill(selector, value)   │ Extension via WS │ Types into input, returns DOM                 │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ generate_password()     │ Backend local    │ Creates strong 16-char password               │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ done(password, message) │ Backend → WS     │ Terminal: success                             │
├─────────────────────────┼──────────────────┼───────────────────────────────────────────────┤
│ stuck(reason)           │ Backend → WS     │ Terminal: needs  │
└─────────────────────────┴──────────────────┴───────────────────────────────────────────────┘

---
State Machine (chrome.storage)

{
  status: "idle" | "running" | "stuck" | "success" | "error",
  message: "Filling password field...",
  password: "Xk9#mP2$vL8nQr4!",  // only on success
  tabId: 123
}

Side panel listens via chrome.storage.onChanged. Background writes on every state change.

---
Success / Stuck Detection

- No hardcoded selectors or success strings
- Agent reads DOM and infers from context (e.g. "Password updated successfully")
- System prompt instructs: call done() on confirmation, stuck() on CAPTCHA/2FA/unknown
- Generalizes across all sites

---
WebSocket Protocol

Build Phases

Phase 1 — Core Loop
- Backend WS server + AgentSession with Anthropic tool-use
- Background script WS client
- Content script DOM reader + fill/click executor
- End-to-end test: agent resets a real password using a hardcoded URL in reset_link.json

Phase 2 — Arcade Gmail
- Arcade auth flow (one-time OAuth from side panel)
- Replace read_reset_link stub with real Gmail tool call
- Agent searches inbox, extracts URL, proceeds automatically

Phase 3 — Polish
- Live status messages in side panel during loop
- chrome.notifications when done or stuck
- Auto-focus reset tab when stuck
- Copy-to-clipboard on success

---
File Structure

arcade-password-reset/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js


---
Key Decisions

- Loop lives in backend — stateless extension, agent owns the flow
- WebSocket not REST — backend needs to push actions to extension
- WS client in background.js — not React app, service worker owns connection
- Side panel not popup — stays alive while agent works in another tab
- Arcade for auth only — token management is its core value; Gmail tool replaces manual OAuth

---
What's Next

After saving this PRD, we build in this order:

1. backend/session.js — AgentSession class, Anthropic tool-use loop, all tools stubbed out
2. backend/server.js — WebSocket server, wires incoming DOM to session.onDOMReceived()
3. extension/background.js — WebSocket client, handles all incoming actions, reads/writes chrome.storage
4. extension/content.js — fill, click, DOM snapshot function
5. extension/manifest.json — all permissions
6. extension/sidepanel/App.jsx — status display + copy button
7. End-to-end test on a real site with URL in reset_link.json
8. Phase 2: swap stub for Arcade Gmail