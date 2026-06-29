import { io } from 'socket.io-client';
import type { Action } from '../types';
import { STORAGE_KEY, updateState, appendToState } from './storage';
import { navigateTab, getDOM, sendToContent, getActiveTabId, setActiveTabId } from './tabs';

const BACKEND_URL = 'http://localhost:4000';

// Clear any stale state from a previous session on startup.
chrome.storage.local.remove(STORAGE_KEY);

// MV3 service workers lack XMLHttpRequest — force WebSocket transport.
const socket = io(BACKEND_URL, { autoConnect: false, transports: ['websocket'] });

// Set to true only when the user explicitly clicks "Connect Gmail"
let authTabRequested = false;

// ── socket lifecycle ─────────────────────────────────────────────────────────

socket.on('connect', () => updateState({ status: 'idle', connected: true }));
socket.on('disconnect', () => updateState({ connected: false }));
socket.on('connect_error', () => updateState({ connected: false }));

// ── action dispatcher ────────────────────────────────────────────────────────

socket.on('action', async (action: Action) => {
  try {
    let dom: string;

    switch (action.type) {
      case 'navigate': {
        const tabId = await navigateTab(action.url);
        setActiveTabId(tabId);
        dom = await getDOM(tabId);
        break;
      }
      case 'click':
        dom = await sendToContent(getActiveTabId()!, { action: 'click', selector: action.selector });
        break;
      case 'fill':
        dom = await sendToContent(getActiveTabId()!, { action: 'fill', selector: action.selector, value: action.value });
        break;
      case 'read':
        dom = await sendToContent(getActiveTabId()!, { action: 'getDOM' });
        break;
    }

    socket.emit('dom_result', dom!);
  } catch (err) {
    socket.emit('dom_result', `ERROR: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
  }
});

// ── agent progress ───────────────────────────────────────────────────────────

socket.on('status', ({ message }: { message: string }) => {
  appendToState('steps', message);
  updateState({ status: 'running', message });
});

socket.on('milestone', ({ label }: { label: string }) => {
  appendToState('milestones', label);
});

// ── gmail auth ───────────────────────────────────────────────────────────────

socket.on('auth_status', ({ authorized, url }: { authorized: boolean; url?: string }) => {
  updateState({ gmailAuthorized: authorized });
  // Only open the OAuth tab if the user explicitly clicked "Connect Gmail"
  if (!authorized && url && authTabRequested) {
    authTabRequested = false;
    chrome.tabs.create({ url });
  }
});

// ── session terminal events ──────────────────────────────────────────────────

socket.on('session_done', ({ password, message }: { password: string; message: string }) => {
  updateState({ status: 'success', message, password });
});

socket.on('session_stuck', ({ reason }: { reason: string }) => {
  updateState({ status: 'stuck', message: reason });
});

// ── side panel lifecycle ─────────────────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId! });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return;
  socket.connect();
  port.onDisconnect.addListener(() => {
    setActiveTabId(null);
    socket.disconnect();
    chrome.storage.local.remove(STORAGE_KEY);
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'start_reset') {
    updateState({ status: 'running', message: 'Starting...', steps: [], milestones: [] });
    socket.emit('start_reset');
  }

  if (request.action === 'authorize_gmail') {
    authTabRequested = true;
    socket.emit('authorize_gmail');
  }

  if (request.action === 'new_session') {
    const tabId = getActiveTabId();
    if (tabId) {
      chrome.tabs.remove(tabId);
      setActiveTabId(null);
    }
    // Full reset — preserve connected + auth state
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const current = (result[STORAGE_KEY] as { connected?: boolean; gmailAuthorized?: boolean }) ?? {};
      chrome.storage.local.set({
        [STORAGE_KEY]: { status: 'idle', connected: current.connected ?? false, gmailAuthorized: current.gmailAuthorized ?? false },
      });
    });
  }
});
