// Attributes worth keeping — enough to build selectors and read form state.
// Everything else (data-v-* Vue noise, inline style, maxlength, aria-invalid…)
// is dropped to cut tokens.
const KEEP_ATTRS = new Set(['id', 'name', 'type', 'class', 'role', 'href', 'value', 'placeholder', 'for', 'aria-label']);

// Snapshot the body on a clone (never mutate the live page mid-reset), then
// trim it: drop noise + page furniture and prune attributes to the allowlist.
// Keeps structure and text intact so the agent can still infer success/error.
export const snapshot = (): string => {
  const clone = document.body.cloneNode(true) as HTMLElement;

  // Drop noise + irrelevant page furniture.
  clone.querySelectorAll('script, style, noscript, svg, link, footer, header, nav').forEach((el) => el.remove());

  // Drop attributes outside the allowlist (kills data-v-*, inline style, etc.).
  clone.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (!KEEP_ATTRS.has(attr.name)) el.removeAttribute(attr.name);
    }
  });

  return clone.innerHTML;
};
