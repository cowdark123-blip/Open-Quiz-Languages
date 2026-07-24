# Project: OpenQuiz Redesign

## Architecture
- Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide React icons.
- Pages & Routes:
  - Homepage / Landing page (`src/app/page.tsx`)
  - Dashboard (`src/app/dashboard/page.tsx` or main dashboard view)
  - Study / Quiz modules (`src/app/study/...`, `src/app/quiz/...`)

## Code Layout
- `src/app`: App Router pages and global layout (`layout.tsx`, `globals.css`)
- `src/components`: UI components (Dashboard, Navigation, Study, Modals, Options, BackgroundSwitcher, BugReport, etc.)
- `src/contexts`: Theme and user state contexts
- `src/lib`: Utilities, AI helpers, Supabase client
- `src/types`: TypeScript definitions

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Audit codebase structure, components, fonts, layout constraints | none | DONE |
| 2 | Design Infrastructure | Typography, HSL themes, glassmorphism, dynamic background context | M1 | DONE |
| 3 | Dashboard Redesign | Redesign dashboard with all 7 requested features | M2 | DONE |
| 4 | Global UI & Study Modules | Redesign homepage, navbar, footer, flashcards, quiz generator | M3 | DONE |
| 5 | Verification & Audit | E2E build verification, layout constraint check, Forensic Audit | M4 | DONE |

## Interface Contracts
### Dashboard ↔ Background Context
- `useBackground()` hook provides current active theme background (gradient, dark glass, cosmic, ambient) and switcher function.
### Dashboard ↔ Spaced Repetition Notification
- Notification component displays due word review counts and trigger schedules.
### Bug Reporter ↔ Modal System
- `BugReportModal` component captures bug reports and user feedback.
