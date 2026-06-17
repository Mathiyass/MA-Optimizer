### Task 5: Overhaul Remaining Views

**Files:**
- Modify: `src/pages/Startup.tsx`
- Modify: `src/pages/DriverUpdater.tsx`
- Modify: `src/pages/AppInstaller.tsx`
- Modify: `src/pages/Cleaner.tsx`
- Modify: `src/pages/Repair.tsx`
- Modify: `src/pages/Advanced.tsx`
- Modify: `src/pages/Tools.tsx`
- Modify: `src/pages/Benchmark.tsx`
- Modify: `src/pages/About.tsx`
- Modify: `src/pages/MaPowerPlan.tsx` (if not done yet)

**Interfaces:**
- Consumes: Tailwind tokens and structural changes from Tasks 1-4.

- [ ] **Step 1: Apply global glassmorphism constraints**
Ensure ALL remaining views use the correct translucent glass panels (`bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5` or similar transparent layers).
Ensure ALL border radii conform to `rounded-2xl` up to `rounded-[2.5rem]`. Do not use `rounded`, `rounded-md`, `rounded-lg`, or `rounded-xl`.

- [ ] **Step 2: Apply color palette constraints**
Purge ALL arbitrary colors (`#00ff88`, `#cc00ff`, `#ffd700`, `#76b900`, etc).
Replace them strictly with `#00FFDE` (cyan) and `#FF003C` (crimson).

- [ ] **Step 3: Update all buttons, cards, and progress bars**
Check `Benchmark.tsx` dials and progress indicators.
Check `Cleaner.tsx` scan rings and buttons.
Check `AppInstaller.tsx` grids.

- [ ] **Step 4: Build check**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/pages/
git commit -m "style: complete crimson-cyan glass overhaul across all remaining views"
```
