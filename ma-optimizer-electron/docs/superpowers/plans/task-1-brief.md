### Task 1: Dependencies & Global CSS

**Files:**
- Modify: `package.json`
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS utility classes (`aurora-layer`, `glass-shell`, `magnetic-dock`)

- [ ] **Step 1: Install recharts**
```bash
npm install recharts
```

- [ ] **Step 2: Update `index.css` for Aurora & Glass**
```css
/* Add to src/index.css */
@keyframes aurora-shift {
  0% { background-position: 50% 50%, 50% 50%; }
  50% { background-position: 100% 50%, 0% 50%; }
  100% { background-position: 50% 50%, 50% 50%; }
}

.aurora-layer {
  position: fixed;
  inset: -50%;
  background-image: 
    radial-gradient(ellipse at 100% 0%, rgba(0, 255, 222, 0.05) 20%, transparent 60%),
    radial-gradient(ellipse at 0% 100%, rgba(255, 0, 60, 0.05) 20%, transparent 60%);
  background-size: 200% 200%;
  animation: aurora-shift 20s ease-in-out infinite;
  z-index: -1;
  pointer-events: none;
}

.glass-shell {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02);
}

.magnetic-dock {
  background: rgba(10, 15, 25, 0.4);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
```

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json src/index.css
git commit -m "feat: setup UI overhaul dependencies and global CSS"
```
