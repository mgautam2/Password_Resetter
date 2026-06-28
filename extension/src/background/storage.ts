import type { AgentState } from '../types';

export const STORAGE_KEY = 'arcade';

export function updateState(patch: Partial<AgentState>) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const current = (result[STORAGE_KEY] as object) ?? {};
    chrome.storage.local.set({ [STORAGE_KEY]: { ...current, ...patch } });
  });
}

export function appendToState(key: 'steps' | 'milestones', value: string) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const current = (result[STORAGE_KEY] as Record<string, unknown>) ?? {};
    const arr = [...((current[key] as string[]) ?? []), value];
    chrome.storage.local.set({ [STORAGE_KEY]: { ...current, [key]: arr } });
  });
}
