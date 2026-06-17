### Task 2: Core Layout Updates (App, Sidebar, Header, StatusBar)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/StatusBar.tsx`

**Interfaces:**
- Consumes: Tailwind tokens from Task 1 (`accent-cyan`=#00FFDE, `accent-violet`=#FF003C).

- [ ] **Step 1: Update App.tsx ambient background**
Modify `App.tsx` to replace any solid backgrounds with translucent ones, and add floating ambient orbs behind the main content area (e.g. `blur-[100px] rounded-full absolute` using `#00FFDE` and `#FF003C`).

- [ ] **Step 2: Update Sidebar.tsx**
Change the main sidebar background from `bg-[rgba(10,12,20,0.85)]` to `bg-[rgba(15,17,26,0.6)] backdrop-blur-3xl`.
Ensure active tabs use intense glows (`shadow-[0_0_15px_rgba(0,255,222,0.4)]`).
Update text sizing and tracking for a premium feel.

- [ ] **Step 3: Update Header.tsx and StatusBar.tsx**
Apply the new `backdrop-blur-3xl` and `border-white/5` paradigm.
Remove any conflicting solid background colors. Use the new `#00FFDE` and `#FF003C` variables where appropriate (e.g., status indicators).

- [ ] **Step 4: Build check**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/components/layout/Header.tsx src/components/layout/StatusBar.tsx
git commit -m "style: apply crimson-cyan glassmorphism to core layout shell"
```
