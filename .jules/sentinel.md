## 2024-05-22 - Stored XSS in Topics and Inline Handlers
**Vulnerability:** Found multiple Stored XSS vectors where user-controlled data (topics, usernames, notification types) was interpolated into HTML strings, specifically inside `onclick` handlers and `innerHTML`.
**Learning:** `escHtml` implementation missed escaping single quotes (`'`), which allowed breaking out of single-quoted JS strings in `onclick` attributes. Also, `topics` were not validated strictly, allowing arbitrary injection.
**Prevention:**
1. Use strict allowlist validation (regex) for identifiers like topics and usernames before using them in code.
2. Update `escHtml` to escape `'` as `&#39;` to be safer in HTML attributes.
3. Avoid inline event handlers (`onclick="..."`) where possible, preferring `addEventListener`.
