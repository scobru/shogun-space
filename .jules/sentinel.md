## 2026-02-21 - XSS via Unsanitized Onclick Injections
**Vulnerability:** User-controlled data (e.g., mail sender, message author) was interpolated directly into `onclick` attribute strings without escaping double quotes or single quotes properly, allowing attribute injection (XSS).
**Learning:** Simple HTML escaping is insufficient for data placed inside event handler strings (JS context within HTML attribute).
**Prevention:** Always use a double-layer escaping strategy (`escHtml(escJS(value))`) when placing untrusted data into inline event handlers, or better yet, avoid inline handlers and use `addEventListener` with `data-*` attributes.
