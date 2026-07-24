# Comprehensive Analysis: Dashboard & User Features Audit

**Project:** OpenQuiz AI  
**Auditor:** `teamwork_preview_explorer_m1_2`  
**Date:** 2026-07-24  
**Milestone:** M1 — Exploration & Analysis  

---

## 1. Executive Summary

This audit evaluates the current implementation state of the Dashboard and core user features in OpenQuiz AI against the specifications in `PROJECT.md` and Hallmark UI/UX standards.

Out of the 7 specified dashboard features:
- **Implemented with Gaps**: Decks / Word Sets (1/7), Streak Tracker (1/7), Spaced Repetition Notifications (1/7 - banner only).
- **Completely Missing**: Options Bar (0/7), Background Switcher (0/7), Bug Reporter (0/7), Learned Words Counter (0/7).

Total Implementation Completion: **~35%**. Significant design, state management, and component infrastructure work is required for Milestone 2 and Milestone 3.

---

## 2. Component Layout & Directory Inventory

The codebase currently contains the following relevant views and components:

### View Files (`src/app/`)
- `src/app/(dashboard)/dashboard/page.tsx` — Main dashboard page displaying SRS due banner (`SRSDashboardWidget`), 7-day forecast chart (`SRSForecastChart`), ecosystem navigation grid (6 cards), and word sets grid.
- `src/app/(dashboard)/layout.tsx` — Dashboard layout container with sidebar navigation, user profile footer, top header bar with `StreakWidget`, and `VocabProvider` wrapper.
- `src/app/(dashboard)/sets/page.tsx` — Full word sets management page with category filtering, search input, set creation/editing modal, and bulk import modal.
- `src/app/(dashboard)/settings/page.tsx` — Target band selection page.
- `src/app/layout.tsx` — Global root layout with static background `#090d16`.
- `src/app/globals.css` — Tailwind v4 CSS configuration, glassmorphism utilities (`.glass-panel`, `.glass-card`), CSS variables.

### Shared Components (`src/components/`)
- `StreakWidget.tsx` — Header streak pill badge with flame icon and confetti effect.
- `SRSForecastChart.tsx` — 7-day SRS review forecast bar chart using SVG/CSS height percentages.
- `BulkImportModal.tsx` — Modal for bulk importing word items.
- `DictionaryPopover.tsx` — Word lookup popover.
- `InteractiveText.tsx` — Clickable text reader for AI reading modules.
- `MultiSetSelector.tsx` — Selector for multiple vocabulary sets.
- `NavigationGuard.tsx` — Router guard.
- `WordSelector.tsx` — Vocabulary item selector.
- `ai-pronunciation-trainer.tsx` — Speech recognition & pronunciation scoring component.

### Contexts & State (`src/contexts/`)
- `VocabContext.tsx` — Context providing `vocabItems`, `vocabSets`, `isLoading`, `refreshVocab`, `addWordToSet`, `createSetAndAddWord`, `isWordSaved`.

---

## 3. Feature-by-Feature Audit Matrix

| # | Feature Name | Vietnamese Name | Status | Location | Key Findings & Gaps |
|---|--------------|-----------------|--------|----------|---------------------|
| 1 | **Options Bar** | Thanh tùy chọn | ❌ MISSING | N/A | Header bar in `layout.tsx:160` only contains static text title and `StreakWidget`. No quick options bar, view toggles, density switches, or quick settings exist. |
| 2 | **Background Switcher** | Nút đổi nền | ❌ MISSING | N/A | `PROJECT.md` explicitly mandates `useBackground()` hook and `BackgroundSwitcher` component. Zero background context or switcher button exists. `globals.css:29` and `layout.tsx:78` hardcode static background `#090d16`. |
| 3 | **Bug Reporter** | Report bug | ❌ MISSING | N/A | `PROJECT.md` specifies `BugReportModal` contract for bug/feedback capture. No modal or header trigger exists. |
| 4 | **Streak Tracker** | Chuỗi học tập | ⚠️ PARTIAL | `components/StreakWidget.tsx`, `dashboard/page.tsx:37` | Basic count pill badge implemented with confetti on activity. Lacks expanded popover modal, daily activity heatmap, streak repair, or streak history. |
| 5 | **Learned Words Counter** | Số từ đã học | ❌ MISSING | N/A | Dashboard lacks a metrics overview row. Total learned words, mastered count (SM-2 level >= 4), and overall progress percentage are not calculated or displayed on `dashboard/page.tsx`. |
| 6 | **Spaced Repetition Notifications** | Thông báo lặp ngắt quãng | ⚠️ PARTIAL | `dashboard/page.tsx:247` (`SRSDashboardWidget`) | Top welcome banner notifies due items for today. However, no header notification bell dropdown, background schedule reminders, or toast alert system exist. |
| 7 | **Decks / Word Sets** | Các bộ từ | ⚠️ PARTIAL | `dashboard/page.tsx:193`, `sets/page.tsx` | VocabSets fetched live from Supabase. Cards on dashboard lack word counts, progress indicators, search/filter controls, or direct set management controls. |

---

## 4. Deep-Dive Feature Analysis

### Feature 1: Options Bar (Thanh Tùy Chọn)
- **Observations**:
  - `src/app/(dashboard)/layout.tsx` (Lines 160–171):
    ```tsx
    <header className="h-16 glass-panel border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white hidden sm:block">Bảng Điều Khiển Học Tập</h1>
      </div>
      <div className="flex items-center gap-4">
        <StreakWidget />
      </div>
    </header>
    ```
- **Architectural Void**: No options toolbar exists. Needs a unified Header Options Bar containing quick band selector, theme mode trigger, notification bell, and bug report action.

### Feature 2: Background Switcher (Nút Đổi Nền)
- **Observations**:
  - `PROJECT.md` (Lines 27–28): `useBackground() hook provides current active theme background (gradient, dark glass, cosmic, ambient) and switcher function.`
  - Direct inspection of `src/contexts/` reveals only `VocabContext.tsx`.
  - Direct inspection of `src/app/globals.css` (Line 29) reveals hardcoded body background: `background-color: #090d16;`.
- **Architectural Void**: Need `BackgroundContext` and `BackgroundSwitcher` component allowing dynamic switching across 4 themes:
  1. *Dark Obsidian Glass* (Default)
  2. *Cosmic Deep Space*
  3. *Ambient Aurora Violet*
  4. *Cyber Electric Gradient*

### Feature 3: Bug Reporter (Report Bug)
- **Observations**:
  - `PROJECT.md` (Lines 31–32): `BugReportModal component captures bug reports and user feedback.`
  - No file `BugReportModal.tsx` exists in `src/components/`.
- **Architectural Void**: Requires `BugReportModal` component with feedback category dropdown (UI/UX, Audio/TTS, SRS Algorithm, AI Content), screenshot/note textarea, submission status indicator, and trigger button in the layout header or floating action button.

### Feature 4: Streak Tracker (Chuỗi)
- **Observations**:
  - `src/components/StreakWidget.tsx` fetches profile data and checks date difference between today and `last_active_date`.
  - Fires `canvas-confetti` when `streak-updated` event is dispatched.
- **Architectural Void**:
  - Lacks interactive popover card on click showing:
    - Current streak vs longest streak records.
    - 7-day activity calendar matrix.
    - Streak Freeze badge status.

### Feature 5: Learned Words Counter (Số Từ Đã Học)
- **Observations**:
  - `VocabContext.tsx` maintains all `vocabItems`.
  - `dashboard/page.tsx` renders SRS forecast and sets grid, but provides **zero** KPI metrics row.
- **Architectural Void**:
  - Missing a top dashboard Summary Stats Row with 4 KPI cards:
    1. **Tổng Từ Đã Học** (Total Learned Words count from `vocabItems.length`).
    2. **Từ Đã Thành Thục** (Mastered Words where SRS interval > 21 days or repetition count >= 4).
    3. **Cần Ôn Hôm Nay** (Due SRS items count).
    4. **Chuỗi Ngày Học** (Current streak days).

### Feature 6: Spaced Repetition Notifications (Thông Báo Lặp Ngắt Quãng)
- **Observations**:
  - `dashboard/page.tsx` line 247 renders `SRSDashboardWidget` which shows due count and custom greeting.
- **Architectural Void**:
  - Missing Header Notification Dropdown menu displaying due word breakdown (e.g. "5 từ IELTS Academic cần ôn ngay", "Hạn ôn tập tiếp theo: 20:00 hôm nay").
  - Missing toast notification system when words become due during an active session.

### Feature 7: Decks / Word Sets (Các Bộ Từ)
- **Observations**:
  - `dashboard/page.tsx` line 193 maps `sets` into 3-column glass cards.
  - Line 202 displays static badge `Bản ghi Supabase` instead of word count (`set.item_count`).
  - Cards offer navigation to `/sets/${set.id}/flashcards`, `/sets/${set.id}/srs`, `/quiz`.
- **Architectural Void**:
  - Dashboard set cards do not show word count (`set.item_count` or items count from `VocabContext`).
  - Missing visual progress bar showing set completion rate.
  - Missing category filter and quick search on the dashboard view itself.

---

## 5. Hallmark UI/UX & Responsive Layout Audit

1. **Typography & Styling**:
   - `globals.css` uses generic system fonts instead of dynamic premium typography (e.g. Inter / Plus Jakarta Sans / Outfit).
   - Card borders rely on basic static Tailwind colors (`border-slate-800`). Lacks animated ambient glow borders and high-end HSL color harmony.
2. **Layout Boundaries**:
   - `layout.tsx` uses standard fixed sidebar layout (`md:w-64`). On small mobile screens, header hides title (`hidden sm:block`) and sidebar turns into top block without responsive hamburger overlay or bottom nav bar.
3. **Empty States & Micro-interactions**:
   - Empty state on `dashboard/page.tsx` is clean, but lacks micro-animations when hovering or loading.
   - SRS Forecast chart uses simple div heights; hover tooltips are raw text.

---

## 6. Recommendations for Upcoming Milestones

1. **Milestone 2 (Design Infrastructure & State)**:
   - Build `BackgroundContext` & `useBackground()` hook with 4 themes.
   - Add `BackgroundSwitcher` component in `src/components/`.
   - Build `BugReportModal` component in `src/components/`.
   - Build Header `OptionsBar` component integrating background switcher, bug report button, and level settings.

2. **Milestone 3 (Dashboard Redesign & Feature Completion)**:
   - Create Summary Metrics KPI Row on `dashboard/page.tsx` (Total Learned Words, Mastered Words, SRS Due, Streak).
   - Enhance `StreakWidget` with popover calendar modal.
   - Implement Header Spaced Repetition Notification Dropdown.
   - Enhance Decks/Word Sets cards with real word count, progress bar, and search/filter bar.
