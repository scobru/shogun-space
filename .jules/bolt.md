## 2025-02-18 - Gun.js Subscription Thrashing
**Learning:** Gun.js `map().on()` fires a callback for *every* item in a set individually, even on initial load. Connecting this directly to a render function (e.g., `renderOnlineUsers`) causes O(N) DOM updates, which freezes the UI for large lists.
**Action:** Always wrap render functions connected to `map().on()` listeners with a `debounce` utility to batch updates into a single render frame.
