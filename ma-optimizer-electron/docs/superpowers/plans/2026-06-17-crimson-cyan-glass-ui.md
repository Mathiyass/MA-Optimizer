# Crimson-Cyan Glass UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the entire application UI to feature a pristine Apple-like glassmorphic aesthetic combined with intense Neon Cyan (`#00FFDE`) and Crimson Red (`#FF003C`) accents.

**Architecture:** We will systematically update the Tailwind configuration, the layout shell, and then iterate through the major feature pages to apply the new color tokens, border radii, and background blur effects.

**Tech Stack:** React, Tailwind CSS, Framer Motion, TypeScript

## Global Constraints

- Version floors: N/A
- Platform requirements: Electron
- Design strictly adheres to: `backdrop-blur-3xl`, `border-white/5` or `10`, `rounded-2xl` up to `rounded-[2.5rem]`.
- Accent colors MUST be `#00FFDE` and `#FF003C`. Do not use arbitrary colors.

---

### Task 1: Update Tailwind Configuration and Base Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: N/A
- Produces: Tailwind theme values `accent-cyan` (`#00FFDE`) and `accent-violet` / `accent-crimson` (`#FF003C`) available for the rest of the application.

- [ ] **Step 1: Check existing Tailwind config**
Run: `cat tailwind.config.ts`
Expected: Outputs the current config so you know what needs replacing.

- [ ] **Step 2: Update tailwind.config.ts**
Modify the `colors` object to strictly set:
```typescript
                'accent-cyan': '#00FFDE',
                'accent-violet': '#FF003C', // Overriding violet to crimson for backward compat without breaking classes
                'danger': '#FF003C',
```
Update shadows to match these new intense colors.

- [ ] **Step 3: Verify the build does not break**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add tailwind.config.ts
git commit -m "style: update tailwind config with Crimson-Cyan glass tokens"
```

---

### Task 2: Core Layout Updates (App, Sidebar, Header, StatusBar)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/StatusBar.tsx`

**Interfaces:**
- Consumes: Tailwind tokens from Task 1.

- [ ] **Step 1: Update App.tsx ambient background**
Modify `App.tsx` to replace any solid backgrounds with `bg-app-bg` and add floating orbs if needed, ensuring `glass-bg` or `transparent` wraps the main content.

- [ ] **Step 2: Update Sidebar.tsx**
Change `bg-[rgba(10,12,20,0.85)]` to `bg-[rgba(15,17,26,0.6)] backdrop-blur-3xl`.
Ensure active tabs use `shadow-[0_0_15px_#00FFDE]`.

- [ ] **Step 3: Update Header.tsx and StatusBar.tsx**
Apply the new `backdrop-blur-3xl` and `border-white/5` paradigm.
Remove any conflicting background colors.

- [ ] **Step 4: Build check**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/components/layout/Header.tsx src/components/layout/StatusBar.tsx
git commit -m "style: apply glassmorphism to core layout shell"
```

---

### Task 3: Overhaul Primary Views (Dashboard & Performance)

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Performance.tsx`

- [ ] **Step 1: Refactor Dashboard**
Replace all card classes with `card-premium bg-[rgba(15,17,26,0.6)] backdrop-blur-3xl border border-white/5 rounded-[2.5rem]`.
Update glowing buttons to use the new Cyan/Crimson scheme.

- [ ] **Step 2: Refactor Performance**
Update charts and progress circles to explicitly use `#00FFDE` and `#FF003C`.
Enhance the layout with frosted glass containers.

- [ ] **Step 3: Build check**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/pages/Dashboard.tsx src/pages/Performance.tsx
git commit -m "style: apply crimson-cyan glass aesthetic to Dashboard and Performance"
```

---

### Task 4: Overhaul Secondary Views (Network, Startup, DriverUpdater, AppInstaller)

**Files:**
- Modify: `src/pages/Network.tsx`
- Modify: `src/pages/Startup.tsx`
- Modify: `src/pages/DriverUpdater.tsx`
- Modify: `src/pages/AppInstaller.tsx`

- [ ] **Step 1: Refactor Network and Startup**
Apply glassmorphic borders and blur backgrounds. Ensure toggle switches use the `#00FFDE` green-replacement.

- [ ] **Step 2: Refactor DriverUpdater and AppInstaller**
Add ambient gradient orbs (`absolute blur-[100px]`) behind the main header sections. Update all download buttons.

- [ ] **Step 3: Build check**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/pages/Network.tsx src/pages/Startup.tsx src/pages/DriverUpdater.tsx src/pages/AppInstaller.tsx
git commit -m "style: apply crimson-cyan glass aesthetic to secondary tools"
```

---

### Task 5: Overhaul Remaining Views (Cleaner, Gaming, Repair, Advanced, Privacy, Tools, Benchmark, About)

**Files:**
- Modify: All remaining components in `src/pages/` not covered by previous tasks.

- [ ] **Step 1: Refactor remaining pages**
Systematically sweep through these components and replace dark hard-coded colors with the translucent glassmorphic palette.

- [ ] **Step 2: Final build check**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/pages/
git commit -m "style: complete crimson-cyan glass overhaul across all remaining views"
```
