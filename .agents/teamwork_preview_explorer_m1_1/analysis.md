# OpenQuiz AI — Codebase Layout, Fonts, CSS & Structure Audit Report

**Date**: 2026-07-24  
**Auditor**: `teamwork_preview_explorer_m1_1`  
**Milestone**: M1 - Exploration & Analysis  

---

## 1. Executive Summary

This report provides a comprehensive audit of the layout, fonts, CSS configuration, and page structure for the **OpenQuiz AI** application (`C:\Users\admin\.gemini\antigravity\scratch\openquiz-ai`).

### Key Findings Overview
- **Custom Google Fonts**: ❌ **Not configured or loaded.** The project currently relies on standard system fallbacks (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...`). `next/font/google` is absent in `src/app/layout.tsx` and `@import` font URLs are absent in `src/app/globals.css`.
- **Layout & Fluid Dimension Constraints**: ✅ **Compliant.** All root/top-level containers across pages (`src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `dashboard/page.tsx`, `sets/page.tsx`) utilize fluid boundaries (`min-h-screen`, `w-full`, `max-w-7xl mx-auto`, `flex-1`, `min-w-0`). No rigid root dimensions (e.g. hardcoded `w-[300px]` or `h-[350px]` on outer viewports) exist that break responsive rendering.
- **Tailwind & CSS Configuration**: Uses **Tailwind CSS v4** (`@tailwindcss/postcss` v4) with inline CSS variable definitions in `src/app/globals.css`. There is no custom `tailwind.config.ts/js` file.
- **Color Palette & Dark Mode**: Hardcoded dark mode (`className="dark"` on `<html>`, `#090d16` background). CSS HSL variables (`--background`, `--primary`, `--card`, etc.) are defined under `:root` in `globals.css`.
- **Glassmorphism & Gradients**: Functional `.glass-panel`, `.glass-card`, `.text-gradient`, `.glow-purple`, and `.glow-cyan` utilities are defined in `globals.css` and used across landing, dashboard, and card interfaces. Dynamic background theme switcher context (`useBackground`) is not yet implemented.

---

## 2. Detailed Audit Findings

### 2.1 Font Configuration & Typography Audit

| File Checked | Implementation Status | Details |
|--------------|----------------------|---------|
| `src/app/layout.tsx` | ❌ Missing Custom Fonts | Defines `RootLayout`. HTML element hardcodes `<html lang="vi" className="dark">`. No `next/font/google` (e.g., Inter, Outfit, Roboto) imported or applied to `<body>`. |
| `src/app/globals.css` | ⚠️ Fallback Only | Line 31 specifies: `font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;`. |
| `package.json` | ❌ No font packages | Standard dependencies (`next`, `react`, `framer-motion`, `lucide-react`, `tailwindcss`). |

**Impact**: Typography lacks modern brand identity. Fonts revert to default system sans-serif depending on client OS.

---

### 2.2 Root Layout Constraints & Dimensions Audit

A deep search was conducted across all files in `src/` for hardcoded pixel width/height declarations on structural containers.

#### File-by-File Breakdown:

1. **`src/app/layout.tsx`**
   - Root `<body>`: `className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-purple-500/30 selection:text-purple-200"`
   - **Verdict**: ✅ Fluid (`min-h-screen`, full width).

2. **`src/app/(dashboard)/layout.tsx`**
   - Outer shell: `<div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row">`
   - Sidebar: `<aside className="w-full md:w-64 glass-panel border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0">`
   - Content Wrapper: `<div className="flex-1 flex flex-col min-w-0">`
   - Main Viewport: `<main className="flex-1 p-6 md:p-8 overflow-y-auto relative">`
   - **Verdict**: ✅ Fluid layout. Sidebar is responsive (`w-full` on mobile, fixed width `md:w-64` on desktop with `shrink-0`), content area uses `flex-1` and `min-w-0` to avoid layout distortion.

3. **`src/app/page.tsx` (Homepage / Landing)**
   - Root container: `<div className="min-h-screen bg-[#090d16] text-slate-100 relative overflow-hidden">`
   - Header: `<header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">`
   - Inner sections: `<section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">`
   - Decorative background elements: `<div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />` (Decorative glow blobs only).
   - **Verdict**: ✅ Fluid layout.

4. **`src/app/(auth)/login/page.tsx` & `register/page.tsx`**
   - Outer container: `<div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 relative overflow-hidden">`
   - Card container: `<div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">`
   - **Verdict**: ✅ Fluid layout (`w-full max-w-md`).

5. **`src/app/(dashboard)/dashboard/page.tsx` & `sets/page.tsx`**
   - Top layout wrapper: `<div className="space-y-8 max-w-7xl mx-auto">`
   - Grids: `grid grid-cols-2 md:grid-cols-3 gap-4`, `grid grid-cols-1 md:grid-cols-3 gap-6`
   - **Verdict**: ✅ Fluid grid layouts.

6. **Component-Level Fixed Measurements**:
   - `src/components/ai-pronunciation-trainer.tsx`: Modal container uses `w-full max-w-[400px]`. Correct fluid scaling behavior.
   - `src/app/(dashboard)/sets/[id]/flashcards/page.tsx`: Card perspective container uses `min-h-[420px]`. Correct use of `min-h-*`.
   - `src/app/(dashboard)/sets/[id]/srs/page.tsx`: Card container uses `min-h-[380px]`. Correct use of `min-h-*`.

---

### 2.3 Color Palette, Glassmorphism & Theme Configuration

#### CSS Variables (`src/app/globals.css`)
```css
@layer base {
  :root {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --card: 224 71% 6%;
    --card-foreground: 213 31% 91%;
    --popover: 224 71% 4%;
    --popover-foreground: 213 31% 91%;
    --primary: 263 70% 58%;
    --primary-foreground: 210 40% 98%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 40% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 215.4 16.3% 56.9%;
    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 263 70% 58%;
    --radius: 0.75rem;
  }
}
```

#### Color Themes Identified:
- **Base Background**: `#090d16` (Deep Midnight Dark)
- **Primary Accent**: Purple (`#8b5cf6`, `purple-600`) & Indigo (`indigo-600`)
- **Secondary Accents**: Cyan (`#06b6d4`, `cyan-500`), Emerald (`emerald-400`/`emerald-600`), Rose (`rose-500`), Amber (`amber-500`)
- **Card Backgrounds**: `rgba(15, 23, 42, 0.65)` (Slate 900 translucent)

#### Glassmorphism Utilities:
```css
.glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
```

#### Missing Infrastructure for Milestone 2:
1. **Dynamic Background Theme Context**: Currently, background themes are static (`#090d16` hardcoded). The `useBackground()` hook mentioned in `PROJECT.md` is not yet created.
2. **Font Loading**: `next/font/google` integration for Inter / Outfit font variables.

---

## 3. Recommendations for Milestone 2

1. **Configure Google Fonts**:
   - In `src/app/layout.tsx`, import `Inter` and `Outfit` via `next/font/google`.
   - Apply font CSS variables to `<html>` / `<body>` to enable global typography styling.
2. **Build Dynamic Background Context (`useBackground`)**:
   - Create `src/contexts/BackgroundContext.tsx` offering theme options: Dark Glass (default), Gradient Pulse, Cosmic, Ambient.
3. **Refine Tailwind HSL Theme Mapping**:
   - Extend Tailwind v4 `@theme` block or CSS custom properties for uniform dark/light color token resolution.
