## 2025-02-18 - Inline Event Handler XSS
**Vulnerability:** Found multiple XSS vulnerabilities in inline event handlers (e.g., `onclick="..."`) where user input containing single quotes was injected directly into the JavaScript string context, breaking the syntax and allowing arbitrary code execution.
**Learning:** The application uses `escHtml` to escape HTML special characters but relied on manual string concatenation for inline handlers without escaping JavaScript special characters (like single quotes).
**Prevention:** Use a dedicated `escJS` helper function to escape single quotes and backslashes when injecting data into JavaScript strings within HTML attributes. Better yet, avoid inline event handlers and attach events using `addEventListener` to separate data from code.
