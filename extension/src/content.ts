import { snapshot } from './snapshot';

// Give SPA content (e.g. a reset modal) a moment to mount before we read.
const settle = () => new Promise((r) => setTimeout(r, 800));

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getDOM') {
    settle().then(() => sendResponse(snapshot()));
    return true;
  }

  if (request.action === 'click') {
    const el = document.querySelector(request.selector);
    if (!el) return sendResponse(`ERROR: selector not found: ${request.selector}`);
    (el as HTMLElement).click();
    settle().then(() => sendResponse(snapshot()));
    return true;
  }

  if (request.action === 'fill') {
    const el = document.querySelector(request.selector) as HTMLInputElement;
    if (!el) return sendResponse(`ERROR: selector not found: ${request.selector}`);
    el.focus();
    el.value = request.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    settle().then(() => sendResponse(snapshot()));
    return true;
  }

  return true;
});
