# Password Reset Agent

An autonomous agent that resets your passwords end-to-end. You click **Start Reset**;
the agent finds the reset email in your Gmail, opens the link, reasons about the page,
generates a strong password, fills the form, and confirms success — all on its own.

Built on [**Arcade.dev**](https://arcade.dev) for authenticated Gmail access: Arcade
runs the Google OAuth flow and stores/refreshes the token, so the app never handles a
credential. The agent's reasoning runs on Anthropic's Claude with a tool-use loop.

---

## How it works

```
┌──────────────┐   WebSocket    ┌──────────────────┐   Arcade SDK   ┌─────────┐
│ Chrome ext   │ ◀────────────▶ │ Node backend     │ ◀────────────▶ │ Gmail   │
│ (side panel  │   socket.io    │ (agent loop)     │   (OAuth +     │ via     │
│  + content   │                │  Claude tool-use │    ListEmails) │ Arcade  │
│  script)     │                │                  │                └─────────┘
└──────────────┘                └──────────────────┘
   executes DOM                    owns the reasoning
   actions, stays                  loop, calls tools,
   stateless                       talks to Claude + Arcade
```

- **Backend owns the loop.** The agent reasons in the backend and pushes browser
  actions (`navigate`, `click`, `fill`) to the extension over a WebSocket.
- **Extension is stateless.** It executes one action, snapshots the page DOM, and
  sends it back. It never decides anything.
- **Arcade is the auth layer.** `Gmail.ListEmailsByHeader` is called through Arcade,
  which manages the OAuth token. The app stores no Google credentials.

---

## Prerequisites

- **Node.js 18+** and npm
- **Google Chrome**
- An **Anthropic API key** — https://console.anthropic.com
- An **Arcade API key** — https://arcade.dev (sign in, copy the key from the dashboard)

---

## Setup

The repo has two independent packages — set up each one.

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` with your keys:

```bash
ANTHROPIC_API_KEY=sk-ant-...
ARCADE_API_KEY=arc_...
EMAIL=....
```

> The fixed Gmail user is hardcoded in `backend/agent/arcade.ts`
> (`ARCADE_USER_ID`). Change it to the Google account you'll authorize.

Start the backend (auto-reloads on change):

```bash
npm run dev
```

You should see `[server] listening on http://localhost:4000`.

### 2. Extension

```bash
cd extension
npm install
npm run build      # outputs to extension/dist/
```

*Load it into Chrome:*

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the **`extension/dist`** folder
4. Pin the extension and click its icon to open the side panel

> The backend URL is `http://localhost:4000` (set in
> `extension/src/background/index.ts`). Keep the backend running before you open
> the side panel.

---

## Usage

1. **Open the side panel** by clicking the extension icon. It connects to the
   backend over WebSocket (status dot turns green).
2. **Connect Gmail** — on first run the panel shows a *Connect Gmail* button. Click
   it; a tab opens with Arcade's Google OAuth consent screen. Approve it. The panel
   flips to *Start Reset* and stays authorized on future runs (Arcade remembers the
   token).
3. **Trigger a reset.** Send yourself a password-reset email from the target site,
   then click **Start Reset**. Watch the live status:
   `Checking inbox…` → `Navigating…` → `Filling…` → **success** with the new
   password (copy it from the panel).

If the agent hits something it can't handle (2FA, an unreadable page), it stops and
reports why instead of guessing.

---

## Project layout

```
backend/
  server.ts            # socket.io server; one connection = one session
  agent/
    session.ts         # AgentSession — the Claude tool-use loop + system prompt
    runner.ts          # executes tools; forwards browser actions over the socket
    tools.ts           # tool schemas (check_inbox, navigate, click, fill, ...)
    arcade.ts          # Arcade client — auth + Gmail email lookup
    utils.ts           # password generator, socket event types
extension/
  src/
    background/        # service worker — WebSocket client, action dispatcher
    content.ts         # in-page DOM snapshot + click/fill executor
    popup/             # React side panel (status, Connect Gmail, Start Reset)
    types.ts           # shared state types
  manifest.json        # MV3 manifest (copied into dist/ on build)
  vite.config.js       # builds background / content / popup bundles
```

---

## Available scripts

| Location     | Command         | What it does                                  |
|--------------|-----------------|-----------------------------------------------|
| `backend/`   | `npm run dev`   | Run the server with auto-reload (nodemon+tsx) |
| `backend/`   | `npm run build` | Type-check + compile to `dist/`               |
| `extension/` | `npm run build` | Build the extension into `dist/`              |
| `extension/` | `npm run dev`   | Rebuild on change (watch mode)                |

---

## Troubleshooting

- **Side panel says "Offline."** The backend isn't running, or it's not on
  `localhost:4000`. Start `npm run dev` in `backend/` and reopen the panel.
- **"Connect Gmail first" when you click Start Reset.** You haven't completed the
  Arcade OAuth flow — click *Connect Gmail* and approve consent first.
- **Auth never completes.** Check `ARCADE_API_KEY` in `backend/.env` and that
  `ARCADE_USER_ID` in `arcade.ts` matches the account you're approving.
- **Extension changes don't show up.** Re-run `npm run build`, then hit the reload
  icon on the extension card in `chrome://extensions`.

---

## Security notes

- `backend/.env` is gitignored — API keys are never committed.
- Arcade holds the Google OAuth token; this app stores no Gmail credentials.
- Generated passwords are shown only in the side panel for the active session.
```