## 2024-05-23 - Interactive Grid Accessibility
**Learning:** Grid items that trigger actions (like playing music) often get implemented as `div`s with `onclick`, making them inaccessible to keyboard users.
**Action:** Always add `role="button"`, `tabindex="0"`, and `onkeydown` (Enter/Space) when making non-button elements interactive.

## 2024-05-23 - Theme Selection A11y
**Learning:** Inline styles for `border-color` on interactive elements override CSS class-based state styles (:hover, .active), breaking visual feedback and accessibility indicators.
**Action:** Move state-dependent styles (like border color) to CSS classes and only use inline styles for static properties (like background color preview).
