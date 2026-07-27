# CodeQuest — Improvement TODO (ALL DONE ✓)

## Phase A: Design Improvements
- [x] A1. Custom scrollbar styling in style.css
- [x] A2. Modal animations (fade + scale) for question editor & submission modals
- [x] A3. Button loading states (spinner inside buttons)
- [x] A4. Multiple toast support (stacked notifications) — all pages
- [x] A5. Empty state animations (subtle pulse/glow)
- [x] A6. Responsive table scroll-hint shadows
- [x] A7. Participant "terminal" typing effect on console head
- [x] A8. Connection status dot indicator — admin, participant, code-challenge pages

## Phase B: Functionality Fixes
- [x] B1. Admin start quiz validation (check questions exist before starting timer)
- [x] B2. Admin timer reset cleanup
- [x] B3. Unsaved changes guard on question modal
- [x] B4. Question modal auto-fill score/time on letter select
- [x] B5. Participant connection status dot indicator
- [x] B6. Fix question timer negative display edge case (Math.max(0, ...))
- [x] B7. Prevent answer double-click race condition (lockingAnswer flag + disable buttons)
- [x] B8. Code challenge auto-save draft to sessionStorage
- [x] B9. Accessibility: meta descriptions, favicon, lang attributes on all pages
- [x] B10. Admin export enhancement (normalized scores, extra columns)

## Phase C: Bug Fixes
- [x] C1. Fix participant paused timer title attribute
- [x] C2. Fix keyboard serial display for non-seeded keys (shows "—" properly)
- [x] C3. Fix code challenge double-redirect race (redirectedToResults flag)
- [x] C4. Add Firebase listener cleanup (off() calls)
- [x] C5. Fix HTML validation (unclosed tags, duplicate IDs)
- [x] C6. Modal overlay HTML structure fixed (proper nesting with .modal-overlay .panel)
- [x] C7. Clean up duplicate CSS keyframes

