# Changes Log — Milestone 4

## Summary of Changes

### 1. Landing Page Redesign (`src/app/page.tsx`)
- Complete overhaul using Hallmark principles, HSL glassmorphism (`.glass-panel`, `.glass-card`), Outfit & Inter font styling, and dynamic background gradients.
- Added interactive showcase tabs for **Flashcards 3D**, **SRS Spaced Repetition**, **Quiz Engine**, and **AI Vocab Generator**.
- Embedded responsive dynamic layout boundaries (`responsive-boundary`, `min-w-[300px] min-h-[350px] w-full h-full`).

### 2. Navigation & Footer (`src/components/navigation/Navbar.tsx` & `src/components/navigation/Footer.tsx`)
- **`Navbar.tsx`**: Top navigation header with glassmorphism backdrop blur, active link indicators via `usePathname()`, trigger buttons for `BackgroundSwitcher` and `BugReportModal`, user authentication state management, and a responsive mobile navigation drawer with slide-in animations.
- **`Footer.tsx`**: Polished footer featuring brand identity, quick links, study module shortcuts, social links, and copyright info.

### 3. Authentication Views (`src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx`)
- Modernized login and register cards with HSL glassmorphism, subtle gradient glow, smooth input focus states, responsive boundary constraints, and Supabase OAuth integration (Google & GitHub).

### 4. Study & Practice Modules (`src/components/study/`)
- **`Flashcards3D.tsx`**: Interactive 3D card flip module with `perspective-1000`, `transform-style-3d`, audio TTS integration (`playTTS`), keyboard shortcuts guide, progress counter, mastered/learning badges, and star bookmark toggle.
- **`QuizEngine.tsx`**: Clean question cards, options with animated hover/selection states, SVG timer ring countdown, and score summary with `canvas-confetti` celebration effect.
- **`SRSView.tsx`**: SM-2 quality ratings (Easy/Good/Hard/Again), term queue, review summary card, and integrated 7-day review forecast chart (`SRSForecastChart`).
- **`AIVocabGenerator.tsx`**: Modern prompt input, AI model selector dropdown (Groq Llama 3.3 70B, Llama 3.1 8B, Gemini Pro), loading animations, and instant deck export to Supabase DB.

### 5. Layout & Page Integrations
- Updated `src/app/(dashboard)/layout.tsx` to preserve navigation context and streak widget.
- Added `responsive-boundary` class and `SRSForecastChart` / `canvas-confetti` integration to `src/app/(dashboard)/sets/[id]/flashcards/page.tsx`, `src/app/(dashboard)/quiz/page.tsx`, and `src/app/(dashboard)/sets/[id]/srs/page.tsx`.
