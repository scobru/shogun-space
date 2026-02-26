## 2024-05-23 - Interactive Grid Accessibility
**Learning:** Grid items that trigger actions (like playing music) often get implemented as `div`s with `onclick`, making them inaccessible to keyboard users.
**Action:** Always add `role="button"`, `tabindex="0"`, and `onkeydown` (Enter/Space) when making non-button elements interactive.

## 2024-05-23 - Theme Selection A11y
**Learning:** Inline styles for `border-color` on interactive elements override CSS class-based state styles (:hover, .active), breaking visual feedback and accessibility indicators.
**Action:** Move state-dependent styles (like border color) to CSS classes and only use inline styles for static properties (like background color preview).

## 2025-02-25 - SPA Navigation Accessibility
**Learning:** Single-page applications (SPAs) often fail to reset scroll position and manage focus when changing views, disorienting users (especially those using keyboards or screen readers).
**Action:** On view change: 1) Reset scroll container to top (scrollTop=0), 2) Move focus to the new content container (tabindex="-1"), 3) Use aria-current="page" on the active navigation link.
