## 2024-05-23 - GunDB Listener Performance
**Learning:** GunDB `map().on()` listeners fire individually for every item in a set, which can cause massive DOM thrashing on initial load or large updates if not debounced.
**Action:** Always wrap render functions called within `map().on()` with a debounce utility to batch DOM updates. Ensure to handle cleanup (cancellation) when switching contexts (e.g., chat rooms) to avoid race conditions.
