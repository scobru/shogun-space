
## 2026-03-22 - [GunDB Event Batching]
**Learning:** Gun.js `.map().on()` triggers callback events synchronously for every node it receives during the initial dataset load from peers or storage. This can result in O(N) DOM re-renders in quick succession if the view update logic is directly inside the `.on()` callback.
**Action:** Always wrap `.map().on()` DOM updates in a `setTimeout` debounce function (e.g., 80ms) when rendering list elements to ensure UI operations are batched in a single render pass, avoiding main thread blocking and layout thrashing.
