### Task 4: Glassification of Inner Pages

**Files:**
- Modify: `src/pages/AppInstaller.tsx`
- Modify: `src/pages/DriverUpdater.tsx`
- Modify: `src/pages/Benchmark.tsx`

**Interfaces:**
- Consumes: `.glass-shell` and `table` styling adjustments.
- Produces: Visual consistency across all inner tools.

- [ ] **Step 1: Replace Card Backgrounds**
Find all instances of `bg-[var(--card-bg)]`, `bg-[#131623]`, `bg-card-bg`, and `bg-[rgba(15,17,26,0.6)]` in the three files.
Replace them with: `glass-shell` or `bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-white/5`.

- [ ] **Step 2: Typography & Borders**
Ensure table headers (`<th>`) and section headers are uppercase and tracked (`uppercase tracking-widest text-xs`).
Change solid borders (`border-[var(--border)]` or `border-[#2a2d3d]`) to thin frosted borders (`border-white/5` or `border-white/10`).

- [ ] **Step 3: Commit**
```bash
git add src/pages/AppInstaller.tsx src/pages/DriverUpdater.tsx src/pages/Benchmark.tsx
git commit -m "ui: glassify inner pages and enforce typography constraints"
```
