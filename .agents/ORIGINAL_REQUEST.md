# Original User Request

## Initial Request — 2026-07-24T13:34:40Z

# Teamwork Project Prompt

Redesign the entire OpenQuiz web application (all modules, homepage, dashboard, etc.) using Hallmark UI/UX principles to achieve a stunning, premium aesthetic. Incorporate the annotations from the provided dashboard reference (thanh tùy chọn, nút đổi nền, report bug, chuỗi, số từ đã học, thông báo lặp ngắt quãng, các bộ từ).

Working directory: C:\Users\admin\.gemini\antigravity\scratch\openquiz-ai
Integrity mode: benchmark

## Requirements

### R1. Complete Aesthetic Overhaul
Apply Hallmark-level design to all pages. Use curated HSL color palettes, dark modes, dynamic gradients, glassmorphism, and modern typography (e.g., Inter, Roboto, Outfit). Ensure consistent visual language across the homepage, dashboard, and all study modules.

### R2. Responsive Dynamic Layouts & Constraints
Implement responsive boundary constraints instead of hardcoded root pixel dimensions. Top-level layout containers must use fluid configurations (e.g., `min-w-[300px] min-h-[350px] w-full h-full`) to ensure graceful overflow on small viewports and full space utilization on large ones.

### R3. Micro-animations and Interactivity
Add smooth micro-animations (e.g., using framer-motion or CSS transitions) and rich interactive hover states for all buttons, cards, and interactive elements. Avoid generic or flat UI slop.

## Acceptance Criteria

### Objective Design Verification
- [ ] No hardcoded fixed dimensions (e.g., `w-[300px] h-[350px]`) exist on top-level root containers.
- [ ] Build completes successfully (`npm run build`) with zero compilation errors after the redesign.
- [ ] At least one custom Google Font is applied globally in the layout.
- [ ] Glassmorphism (`backdrop-blur` and semi-transparent backgrounds) and dynamic gradients are present in the CSS/Tailwind utility classes for major components.
- [ ] All requested dashboard elements (thanh tùy chọn, nút đổi nền, report bug, chuỗi, số từ đã học, thông báo lặp ngắt quãng, các bộ từ) are present in the new dashboard layout.
