let activeTabId: number | null = null;

export function getActiveTabId() { return activeTabId; }
export function setActiveTabId(id: number | null) { activeTabId = id; }

export function navigateTab(url: string): Promise<number> {
  return new Promise((resolve) => {
    if (activeTabId) {
      chrome.tabs.update(activeTabId, { url }, (tab) => resolve(tab!.id!));
    } else {
      chrome.tabs.create({ url, active: false }, (tab) => resolve(tab.id!));
    }
  });
}

export function getDOM(tabId: number): Promise<string> {
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

export function sendToContent(tabId: number, msg: object): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, msg, (dom) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(dom);
    });
  });
}
