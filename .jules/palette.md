PALETTE'S JOURNAL

## 2026-02-22 - [Pattern: Implicit Labels]
**Learning:** The application heavily relies on `placeholder` attributes as the sole visual label for inputs, which is an accessibility anti-pattern.
**Action:** Systematically introduce `.sr-only` labels for inputs where visual design constraints prevent visible labels, and ensure `for`/`id` association is present for all form elements.
