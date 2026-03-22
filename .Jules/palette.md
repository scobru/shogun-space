## 2024-05-23 - Interactive Grid Accessibility
**Learning:** Grid items that trigger actions (like playing music) often get implemented as `div`s with `onclick`, making them inaccessible to keyboard users.
**Action:** Always add `role="button"`, `tabindex="0"`, and `onkeydown` (Enter/Space) when making non-button elements interactive.

## 2026-03-22 - Theme Card Accessibility Improvements
**Learning:** Theme cards implemented as `div`s with `onclick` handlers were completely inaccessible to keyboard users, and inline `border-color` styles prevented CSS hover and focus states from rendering.
**Action:** When implementing non-standard interactive grid items (like theme selectors), always ensure `role="button"`, `tabindex="0"`, and keyboard event handlers (`Enter`/`Space`) are included. Avoid hardcoded inline colors for interactive states, and provide clear `:focus-visible` styling for accessibility.
