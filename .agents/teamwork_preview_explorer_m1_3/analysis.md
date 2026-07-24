# OpenQuiz AI — Study Modules, Contexts, and State Management Audit Report

## Executive Summary
This document presents the detailed architectural and technical audit of all **Study Modules**, **State Management / Contexts**, **Framer Motion Micro-Animations**, and **Build Configuration** for OpenQuiz AI.

Overall, the application features an extensive suite of 8+ AI-powered interactive study tools (Flashcards 3D, SRS SM-2, Quiz Engine, Dictation, Grammar Assistant, Reading Comprehension, AI Pronunciation Trainer, and Conversation Roleplay Chat) backed by Supabase PostgreSQL and Groq LLM (Llama 3.3 70B & 3.1 8B).

---

## 1. Audit of Study Modules

### 1.1 Flashcards Module (`src/app/(dashboard)/sets/[id]/flashcards/page.tsx`)
- **Key Features & Mechanics**:
  - 3D Card Flipping implemented with Framer Motion (`rotateY: isFlipped ? 180 : 0`, `transform-style-3d`, `backface-hidden`).
  - Pre-session setup screen allowing filtering by learning status (`all`, `new`, `learning`, `mastered`, `starred`) and sorting (`shuffle`, `az`, `newest`, `oldest`).
  - Integrated `AIPronunciationTrainer` embedded directly in the card back for instant voice feedback.
  - Status badges (`🔴 Chưa học`, `🟡 Đang học`, `🟢 Đã thành thạo`, `⭐ Đã gắn sao`, `⚠️ Trùng`).
  - Full keyboard accessibility: `Space` / `Up` / `Down` (Flip), `Left` / `1` (Need Review), `Right` / `2` (Mastered), `A` / `S` / `P` (TTS Audio).
  - Persistence: Uses `NavigationGuard` and `localStorage` (`saveActiveSession('flashcards', setId, ...)`) to prompt and resume unfinished sessions.
- **SRS Sync**: Marking a card "Đã thuộc" immediately updates local state and fires background `saveSRSProgress()` with repetition=4, interval=21 (`status: 'mastered'`).

### 1.2 Spaced Repetition (SRS) Engine & View (`src/app/(dashboard)/sets/[id]/srs/page.tsx`, `src/lib/srs/sm2.ts`, `src/components/SRSForecastChart.tsx`)
- **Algorithm Implementation (`sm2.ts`)**:
  - Full SuperMemo-2 (SM-2) implementation with 4 grades: `again` (reset interval to 1d, ease factor -0.20), `hard` (interval x1.2, ease factor -0.15), `good` (interval x easeFactor), `easy` (interval x easeFactor x 1.3, ease factor +0.15).
  - Helper `getSM2IntervalPreviews()` calculates interval forecast previews displayed directly on rating buttons (e.g., `Hẹn: 1 ngày`, `Hẹn: 4 ngày`, `Hẹn: 7 ngày`).
- **SRS Forecast Chart (`SRSForecastChart.tsx`)**:
  - Aggregates all user SRS items over the next 7 days based on `next_review_date`.
  - Dynamic bar chart visualization with hover tooltips and current day highlighting (`bg-gradient-to-t from-purple-600 to-cyan-400`).
  - Re-evaluates due counts on window focus / popstate events.

### 1.3 Quiz Engine (`src/app/(dashboard)/quiz/page.tsx`)
- **Key Features**:
  - Multi-set selection (`MultiSetSelector`) and individual word filtering (`WordSelector`).
  - Question count slider (3 to 30 questions).
  - Automatic distractor generation via `shuffleArray` using other vocabulary items from selected sets.
  - Interactive vocabulary lookup on question terms via `InteractiveText`.
  - Summary screen with exact percentage score, detailed wrong answer review, and database persistence (`saveQuizResult`).

### 1.4 AI Vocabulary Generator & Bulk Import (`src/app/api/ai/generate-vocab/route.ts`, `src/components/BulkImportModal.tsx`, `src/app/(dashboard)/sets/[id]/page.tsx`)
- **Single AI Lookup (`/api/ai/generate-vocab`)**:
  - Calls Groq API (`llama-3.3-70b-versatile` with `llama-3.1-8b-instant` fallback) with system prompt enforcing valid JSON schema containing `term`, `ipa`, `definition`, `vietnamese_translation`, `example_sentence`, `synonyms`.
- **Bulk Import Modal (`BulkImportModal.tsx`)**:
  - Parses raw text (Word, Excel, Quizlet) supporting custom field delimiters (Tab, Comma, Custom) and card separators (Newline, Semicolon).
  - Preview table with inline editing, internal & database duplicate detection (`isTermDup`, `isDefDup`), and one-click duplicate removal.
  - Optional AI auto-filling for incomplete fields across all imported rows, with batch progress tracking.
  - Option to overwrite existing database records (`UPDATE`) vs appending new records (`INSERT`).

### 1.5 Dictation / Nghe chép chính tả (`src/app/(dashboard)/dictation/page.tsx`, `src/app/api/ai/dictation/route.ts`)
- **Key Features**:
  - Groq AI generates contextual example sentences using selected vocabulary words and target band level.
  - Dual-speed Web Speech API / TTS audio playback (normal rate vs 0.75x slow speed).
  - Custom diff engine (`diffResult`) analyzing user input against target sentence and color-coding correct, wrong/extra, and missing words.
  - Streak integration triggering custom `'streak-updated'` event.

### 1.6 Grammar AI Assistant (`src/app/(dashboard)/grammar/page.tsx`, `src/app/api/ai/grammar/route.ts`)
- **Key Features**:
  - Mode 1: Grammar Correction & Explanation (`check` action) analyzing arbitrary user text.
  - Mode 2: Topic-based Practice Generator (`practice` action) covering 6 key topics (Tenses, Relative Clauses, Conditionals, Passive Voice, Prepositions, Reported Speech) combined with user vocabulary.

### 1.7 Reading Comprehension (`src/app/(dashboard)/reading/page.tsx`, `src/app/api/ai/reading/route.ts`)
- **Key Features**:
  - Groq AI generates tailored articles (Short ~100-150 words, Medium ~200-250 words, Long ~350-400 words) incorporating target vocabulary.
  - Article text wrapped with `InteractiveText` for instant dictionary popup lookup.
  - Generates multiple-choice reading comprehension questions with detailed explanations.

### 1.8 Speaking & AI Pronunciation Trainer (`src/app/(dashboard)/speaking/page.tsx`, `src/components/ai-pronunciation-trainer.tsx`, `/api/ai/speaking-eval`)
- **Key Features**:
  - Browser SpeechRecognition & MediaRecorder integration with 30s countdown timer and real-time audio waveform visualizer.
  - Groq Llama 3.3 voice evaluation endpoint (`/api/ai/speaking-eval`).
  - Color-coded syllable breakdown with IPA, stress markers (`'`), and syllable-level feedback tooltips.

### 1.9 Conversation Roleplay Chat (`src/app/(dashboard)/conversation/page.tsx`, `src/app/api/ai/chat/route.ts`)
- **Key Features**:
  - 5 Roleplay scenarios (Job interview, Hotel booking, Coffee ordering, Asking directions, Supermarket shopping).
  - Speech-to-Text (`/api/ai/stt`) voice input and TTS response playback.
  - Real-time AI grammar corrections (`grammarFix`) and native phrasing recommendations (`nativeSuggestion`).
  - Conversation state persisted in Supabase table `conversation_histories`.

---

## 2. State Management & Contexts Audit

### 2.1 VocabContext (`src/contexts/VocabContext.tsx`)
- **Scope**: Manages global list of user vocabulary sets (`vocabSets`) and items (`vocabItems`).
- **Provided Functions**: `refreshVocab()`, `addWordToSet()`, `createSetAndAddWord()`, `isWordSaved()`.

### 2.2 Critical Findings & Inconsistencies in State Management
1. **Local State Lag in VocabContext**:
   - In `addWordToSet()`, new items are pushed into `vocabItems` state, but `item_count` inside `vocabSets` is NOT re-calculated locally. `set.item_count` remains outdated until `refreshVocab()` is called.
2. **Punctuation Mismatch in `isWordSaved()`**:
   - `isWordSaved(term)` strips punctuation from input `term` (`cleanTerm = term.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"")`), but compares it against `item.term.toLowerCase().trim()` without stripping punctuation from `item.term`.
3. **Decentralized CRUD Updates**:
   - Page components (such as `sets/[id]/page.tsx`, `flashcards/page.tsx`, `srs/page.tsx`) perform updates, deletes, and star toggles directly via `data-service.ts` and mutate local `useState`. They do NOT trigger `refreshVocab()` or update `VocabContext`. Consequently, components relying on `VocabContext` hold stale data until full page reload.
4. **Session Persistence Pattern**:
   - Study modules (`flashcards`, `quiz`, `dictation`, `grammar`, `reading`) utilize `saveActiveSession` / `loadActiveSession` / `deleteActiveSession` with `localStorage` keys (`active_session_${moduleType}_${resourceId}`) and `NavigationGuard` to manage uncompleted learning sessions seamlessly.
5. **Event-Driven Streak Sync**:
   - Learning activities dispatch a custom window event (`window.dispatchEvent(new Event('streak-updated'))`) to force the `StreakWidget` to re-fetch profile data.

---

## 3. Micro-Animations, Hover States, & UI Responsiveness Audit

### 3.1 Framer Motion Animations
- **3D Card Flip**: `motion.div` in `flashcards/page.tsx` uses `transform-style-3d`, `rotateY: isFlipped ? 180 : 0`, `backface-hidden` with `transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }`.
- **AnimatePresence Mode**: Smooth card entry/exit transitions across Flashcards and SRS (`initial={{ opacity: 0, x: 20 }}`, `animate={{ opacity: 1, x: 0 }}`).
- **Pronunciation Modal**: Smooth backdrop fade and modal scale-up (`scale: 0.95 -> 1`).
- **Waveform Animation**: Dynamic height pulsing on recording waveform bars using Framer Motion loop arrays.

### 3.2 Hover States & Responsive Boundaries
- **Interactive Buttons**: Setup screens utilize interactive hover states with scale effects (`scale-[1.02]`, `scale-[1.05]`), colored borders (`border-purple-500`, `border-cyan-500`), and ambient glow shadows (`shadow-[0_0_20px_rgba(168,85,247,0.15)]`).
- **Layout Boundaries**: Fixed minimum card heights (e.g. `min-h-[420px]`) are used with fluid responsive widths (`w-full max-w-4xl mx-auto px-4`), preventing layout squishing on mobile viewports.

---

## 4. Build Setup & Dependency Analysis

### 4.1 Dependency Checklist (`package.json`)
- **Framework**: Next.js 16.2.11 (App Router), React 19.2.4, React DOM 19.2.4.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss` ^4, `tailwindcss` ^4), `clsx` ^2.1.1, `tailwind-merge` ^3.6.0.
- **Animation & Icons**: `framer-motion` ^12.42.2, `lucide-react` ^1.26.0, `canvas-confetti` ^1.9.4.
- **Backend & AI**: `@supabase/ssr` ^0.12.3, `@supabase/supabase-js` ^2.110.8, `groq-sdk` ^1.3.0, `@google/generative-ai` ^0.24.1.

### 4.2 Compiler Configuration (`tsconfig.json`)
- Target: `ES2017`
- Module Resolution: `bundler`
- Strict Mode: `true`
- Path Aliases: `@/*` -> `./src/*`

---

## 5. Architectural Recommendations for Implementation Phase
1. **Centralize VocabContext Updates**:
   - Expose `updateItemInContext`, `deleteItemFromContext`, `toggleStarInContext`, and `updateSetInContext` inside `VocabContext` so all study pages update global state in unison.
2. **Standardize Word Matching**:
   - Normalize punctuation stripping across both sides in `isWordSaved()`.
3. **Enhance Optimistic UI**:
   - Extend optimistic state updates for deletion and starring across all study views with graceful fallback on network failure.
