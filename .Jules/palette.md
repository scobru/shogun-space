## 2024-05-23 - Interactive Grid Accessibility
**Learning:** Grid items that trigger actions (like playing music) often get implemented as `div`s with `onclick`, making them inaccessible to keyboard users.
**Action:** Always add `role="button"`, `tabindex="0"`, and `onkeydown` (Enter/Space) when making non-button elements interactive.
