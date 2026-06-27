let backgroundTabId: number | null = null

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId! })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === backgroundTabId && changeInfo.status === 'complete') {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => document.documentElement.outerHTML,
      },
      (results) => {
        const html = results?.[0]?.result;
      }
    )
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openUrl') {
    chrome.tabs.create({ url: request.url, active: false }, (tab) => {
      backgroundTabId = tab.id ?? null
      sendResponse({ success: true })
    })
    return true
  }
})
