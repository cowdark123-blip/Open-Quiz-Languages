## 2026-07-24T13:39:23Z
You are teamwork_preview_worker_m3.
Your working directory is: C:\Users\admin\.gemini\antigravity\scratch\openquiz-ai\.agents\teamwork_preview_worker_m3
Project root: C:\Users\admin\.gemini\antigravity\scratch\openquiz-ai
Scope document: C:\Users\admin\.gemini\antigravity\scratch\openquiz-ai\PROJECT.md

Task: Implement Milestone 3 — Complete Dashboard & 7 Required Features Redesign.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Requirements:
1. **Options Bar (thanh tùy chọn)** — `src/components/dashboard/OptionsBar.tsx`:
   - Header options toolbar integrated into the top of the dashboard layout.
   - Contains: Background Switcher button/dropdown, Bug Report trigger button, SRS Notification Bell with unread badge, Streak Tracker pill, Search/Filter bar.
2. **Background Switcher (nút đổi nền)** — `src/components/dashboard/BackgroundSwitcher.tsx`:
   - Interactive theme selector leveraging `useBackground()`.
   - Supports 4 themes: cosmic, glass, gradient, ambient with live preview thumbnails, active indicators, and smooth transition feedback.
3. **Bug Reporter (report bug)** — `src/components/dashboard/BugReportModal.tsx`:
   - Modal triggerable from Options Bar or floating trigger.
   - Includes bug category selection (UI/Layout, AI Generation, SRS/Study, Other), description text area, screenshot/URL tag, severity selector, submit state, and toast notification feedback.
4. **Streak Tracker (chuỗi)** — `src/components/dashboard/StreakTracker.tsx`:
   - Interactive widget showing active streak count, animated flame icon, high streak record, and click-to-open stats popover with weekly calendar heat grid.
5. **Learned Words Counter (số từ đã học)** — `src/components/dashboard/LearnedWordsWidget.tsx`:
   - Comprehensive KPI stats row displaying:
     - Total Learned Words ("Số từ đã học") with radial progress ring or animated progress bar.
     - Mastered words count ("Đã thành thạo").
     - In progress count ("Đang học").
     - SRS Review due count ("Cần ôn tập ngay").
6. **Spaced Repetition Notifications (thông báo lặp ngắt quãng)** — `src/components/dashboard/SRSNotificationBanner.tsx` and `SRSNotificationDrawer.tsx`:
   - Prominent glassmorphic notification banner at top of dashboard when SRS reviews are due ("Bạn có X từ đến lịch lặp ngắt quãng hôm nay!") with instant "Bắt đầu ôn tập" CTA button.
   - Notification Bell drawer listing due items and next review schedule.
7. **Decks / Word Sets (các bộ từ)** — `src/components/dashboard/DecksGrid.tsx` & `WordSetCard.tsx`:
   - Glassmorphic card grid displaying word sets.
   - Cards display deck title, description, level badge (A1-C2), word item count ("X từ"), completion progress bar ("Y%"), last studied timestamp, and hover lift micro-animations.
   - Includes "Create New Deck" / "Import Deck" modal.
8. **Dashboard Page Redesign (`src/app/dashboard/page.tsx` or `src/app/(dashboard)/...`)**:
   - Combine all components into a fluid, responsive layout adhering to dynamic constraints (`min-w-[300px] min-h-[350px] w-full h-full`, no fixed root dimensions).
   - Apply Hallmark principles, HSL glassmorphism (`.glass-panel`, `.glass-card`), dynamic gradients, Outfit/Inter typography, and Framer Motion stagger animations.
9. **Build Verification**:
   - Execute `npm run build` and ensure 0 compilation errors.

Document changes in `changes.md` and `handoff.md` in your working directory. Send a message to parent (ID: 6493dd20-513d-467d-ae9e-e366753cf7af) when finished with build verification results.
