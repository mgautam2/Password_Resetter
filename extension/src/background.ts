import { io } from 'socket.io-client';

type NavigateAction = { type: 'navigate'; url: string };
type ClickAction    = { type: 'click';    selector: string };
type FillAction     = { type: 'fill';     selector: string; value: string };
type ReadAction     = { type: 'read' };
type Action = NavigateAction | ClickAction | FillAction | ReadAction;

// MV3 service workers have no XMLHttpRequest, so socket.io's default long-polling
// handshake fails. Force the WebSocket transport, which is available here.
const socket = io('http://localhost:4000', {
  autoConnect: false,
  transports: ['websocket'],
});

let activeTabId: number | null = null;

// ── socket connection ────────────────────────────────────────────────────────

socket.on('connect', () => {
  console.log('[bg] connected to backend');
  updateState({ status: 'idle', connected: true });
});

socket.on('disconnect', () => { 
  console.log('[bg] disconnected from backend');
  updateState({ connected: false });
});

// ── action dispatcher ────────────────────────────────────────────────────────

socket.on('action', async (action: Action) => {
  console.log('[bg] action', action);
  updateState({ status: 'running', message: action.type });

  try {
    if (action.type === 'navigate') {
      activeTabId = await navigateTab(action.url!);
      const dom = await getDOM(activeTabId);
      socket.emit('dom_result', dom);
    }

    if (action.type === 'click') {
      const dom = await sendToContent(activeTabId!, { action: 'click', selector: action.selector });
      socket.emit('dom_result', dom);
    }

    if (action.type === 'fill') {
      const dom = await sendToContent(activeTabId!, { action: 'fill', selector: action.selector, value: action.value });
      socket.emit('dom_result', dom);
    }

    if (action.type === 'read') {
      const dom = await sendToContent(activeTabId!, { action: 'getDOM' });
      socket.emit('dom_result', dom);
    }
  } catch (err) {
    console.error('[bg] action failed', err);
    socket.emit('dom_result', `ERROR: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
  }
});

// ── terminal events ──────────────────────────────────────────────────────────

socket.on('session_done', ({ password, message }: { password: string; message: string }) => {
  updateState({ status: 'success', message, password });
});

socket.on('session_stuck', ({ reason }: { reason: string }) => {
  updateState({ status: 'stuck', message: reason });
});

// ── side panel trigger ───────────────────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId! });
});

// ── side panel lifecycle ─────────────────────────────────────────────────────
// The panel opens a long-lived port on mount. Open → connect the socket.
// Close → port disconnects → tear down the socket (the server stops the agent
// on disconnect) and wipe the stored state.

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return;

  console.log('[bg] panel opened — connecting socket');
  socket.connect();

  port.onDisconnect.addListener(() => {
    console.log('[bg] panel closed — disconnecting socket');
    socket.disconnect();
    chrome.storage.local.remove(STORAGE_KEY);
  });
});

// ── agent progress ───────────────────────────────────────────────────────────

socket.on('status', ({ message }: { message: string }) => {
  chrome.storage.local.get('arcade', (result) => {
    const current = (result['arcade'] as Record<string, unknown>) ?? {};
    const steps = [...((current['steps'] as string[]) ?? []), message];
    chrome.storage.local.set({ arcade: { ...current, status: 'running', message, steps } });
  });
});

socket.on('milestone', ({ label }: { label: string }) => {
  chrome.storage.local.get('arcade', (result) => {
    const current = (result['arcade'] as Record<string, unknown>) ?? {};
    const milestones = [...((current['milestones'] as string[]) ?? []), label];
    chrome.storage.local.set({ arcade: { ...current, milestones } });
  });
});

// ── start reset (from side panel) ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'start_reset') {
    updateState({ status: 'running', message: 'Starting...', steps: [], milestones: [] });
    socket.emit('start_reset');
  }
});

// ── helpers ──────────────────────────────────────────────────────────────────

function navigateTab(url: string): Promise<number> {
  return new Promise((resolve) => {
    if (activeTabId) {
      chrome.tabs.update(activeTabId, { url }, (tab) => resolve(tab!.id!));
    } else {
      chrome.tabs.create({ url, active: false }, (tab) => resolve(tab.id!));
    }
  });
}

function getDOM(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabs.onUpdated.addListener(function listener(id, changeInfo) {
      if (id !== tabId || changeInfo.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.sendMessage(tabId, { action: 'getDOM' }, (dom) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(dom);
      });
    });
  });
}

function sendToContent(tabId: number, msg: object): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, msg, (dom) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(dom);
    });
  });
}

const STORAGE_KEY = 'arcade';

function updateState(patch: object) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const current = (result[STORAGE_KEY] as object) ?? {};
    chrome.storage.local.set({ [STORAGE_KEY]: { ...current, ...patch } });
  });
}
