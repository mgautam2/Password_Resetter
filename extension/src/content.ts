import { snapshot } from './snapshot';

// Wait until the DOM stops mutating for `quiet` ms, or until `max` ms elapses.
const waitForSettle = (quiet = 300, max = 3000): Promise<void> =>
  new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout>;
    const done = () => { observer.disconnect(); clearTimeout(timer); resolve(); };
    const reset = () => { clearTimeout(timer); timer = setTimeout(done, quiet); };
    const observer = new MutationObserver(reset);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    reset();
    setTimeout(done, max);
  });

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getDOM') {
    waitForSettle().then(() => sendResponse(snapshot()));
    return true;
  }

  if (request.action === 'click') {
    const el = document.querySelector(request.selector);
    if (!el) return sendResponse(`ERROR: selector not found: ${request.selector}`);
    (el as HTMLElement).click();
    waitForSettle().then(() => sendResponse(snapshot()));
    return true;
  }

  if (request.action === 'fill') {
    const el = document.querySelector(request.selector) as HTMLInputElement;
    if (!el) return sendResponse(`ERROR: selector not found: ${request.selector}`);
    el.focus();
    // Use the native setter so React/Vue controlled inputs pick up the change.
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(el, request.value);
    else el.value = request.value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: request.value }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    waitForSettle().then(() => sendResponse(snapshot()));
    return true;
  }

  return true;
});
