# OpenQuiz Redesign — Master Execution Plan

## Objective
Orchestrate the complete Hallmark UI/UX redesign of OpenQuiz web application:
1. Complete Aesthetic Overhaul: Hallmark UI/UX principles, dark modes, dynamic gradients, glassmorphism, Google Fonts (e.g. Outfit / Inter).
2. Fluid Responsive Dynamic Layouts: `min-w-*`, `min-h-*`, `w-full`, `h-full`, no fixed root dimensions (`w-[300px] h-[350px]`).
3. Micro-animations and hover states using Framer Motion / CSS transitions.
4. Comprehensive Dashboard Features:
   - Options Bar (thanh tùy chọn)
   - Background Switcher (nút đổi nền)
   - Bug Reporter (report bug)
   - Streak Tracker (chuỗi)
   - Learned Words Counter (số từ đã học)
   - Spaced Repetition Notifications (thông báo lặp ngắt quãng)
   - Decks / Word Sets Management (các bộ từ)
5. Zero compilation errors on `npm run build`.
6. Forensic Integrity Audit clean verdict.

## Phases & Milestones

### Milestone 1: Exploration & System Audit
- Dispatch 3 `teamwork_preview_explorer` agents to audit existing components, styling setup, pages, routing, and identify fixed dimensions or UI shortcomings.

### Milestone 2: Design System & Theme Infrastructure
- Implement Tailwind / CSS design tokens, custom Google Fonts integration, HSL dark mode support, glassmorphism utilities, and dynamic gradient tokens.

### Milestone 3: Dashboard & Specialized Features Redesign
- Redesign the Dashboard component and page with all requested features (options bar, background switcher, bug report modal/button, streak tracker, learned words count, spaced repetition notification banner/popover, study decks grid).

### Milestone 4: Global App & Study Modules Redesign
- Redesign Navigation, Footer, Homepage, Flashcard Study Module, Quiz Engine, Spaced Repetition View, AI Quiz Generator UI with fluid layout constraints, micro-animations, and glassmorphism.

### Milestone 5: Verification & Forensic Integrity Audit
- Run `npm run build` verification via Worker/Reviewer, verify root layout constraints, run Challenger stress tests, and run Forensic Integrity Auditor.

### Milestone 6: Victory Claim & Final Reporting
- Prepare final report and submit victory claim to Sentinel & parent.
