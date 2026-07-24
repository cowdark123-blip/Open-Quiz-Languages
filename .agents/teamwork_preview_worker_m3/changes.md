# Summary of Changes — Milestone 3 Implementation

## Files Created / Modified

### 1. `src/components/dashboard/OptionsBar.tsx` (New)
- Options header toolbar integrated into the top of the dashboard page layout.
- Provides search/filter input, Background Switcher trigger, Bug Reporter trigger, SRS Notification Bell with unread badge counter, and interactive Streak Tracker pill button.

### 2. `src/components/dashboard/BackgroundSwitcher.tsx` (New)
- Interactive theme selector leveraging `useBackground()`.
- Supports 4 themes: `cosmic`, `glass`, `gradient`, `ambient`.
- Includes live preview thumbnails with theme color swatches, active indicators, and smooth toast feedback.

### 3. `src/components/dashboard/BugReportModal.tsx` (New)
- Modal triggerable from Options Bar.
- Supports bug category selection (UI/Layout, AI Generation, SRS/Study, Other), description text area, screenshot/URL reference tag, severity level selector (Low, Medium, High, Critical), submit loading state, and toast notification feedback.

### 4. `src/components/dashboard/StreakTracker.tsx` (New)
- Interactive widget displaying active streak count, animated flame icon with pulsing glow, personal high streak record, and click-to-open stats popover.
- Includes a 28-day (4-week) calendar heat grid showing study consistency and motivational badges.

### 5. `src/components/dashboard/LearnedWordsWidget.tsx` (New)
- Comprehensive KPI stats row displaying 4 metrics:
  - Total Learned Words ("Số từ đã học") with progress ring/bar.
  - Mastered words count ("Đã thành thạo").
  - In progress count ("Đang học").
  - SRS Review due count ("Cần ôn tập ngay").

### 6. `src/components/dashboard/SRSNotificationBanner.tsx` & `SRSNotificationDrawer.tsx` (New)
- `SRSNotificationBanner.tsx`: Prominent glassmorphic notification banner at top of dashboard when SRS reviews are due ("Bạn có X từ đến lịch lặp ngắt quãng hôm nay!") with instant "Bắt đầu ôn tập" CTA button.
- `SRSNotificationDrawer.tsx`: Notification Bell drawer listing due items, next review schedule, and direct flashcard/SRS review shortcuts.

### 7. `src/components/dashboard/WordSetCard.tsx`, `CreateDeckModal.tsx`, `DecksGrid.tsx` (New)
- `WordSetCard.tsx`: Glassmorphic card displaying deck title, description, level badge (A1-C2), word item count ("X từ"), completion progress bar ("Y%"), creation timestamp, hover lift micro-animations, and quick launcher buttons (Flashcards, SRS Review, Quiz).
- `CreateDeckModal.tsx`: Modal supporting manual deck creation and batch/AI list import.
- `DecksGrid.tsx`: Filterable card grid supporting search filtering, category tabs (IELTS, TOEIC, Business, General), and empty state with sample set seeding.

### 8. `src/app/(dashboard)/dashboard/page.tsx` (Modified)
- Complete redesign combining all 7 required features and components into a fluid, responsive layout adhering to dynamic constraints (`min-w-[300px] min-h-[350px] w-full h-full`, no fixed root dimensions).
- Applied HSL glassmorphism (`.glass-panel`, `.glass-card`), dynamic gradients, Outfit/Inter typography, and Framer Motion animations.
