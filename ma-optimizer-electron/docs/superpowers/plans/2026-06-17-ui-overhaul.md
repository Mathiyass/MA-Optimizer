# UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the MA-Optimizer UI to a premium "Aurora Cockpit" design featuring fluid animations, deep space gradients with neon accents, and a highly structural data layout.

**Architecture:** We will implement an Aurora CSS shader in the background, update the global tailwind classes to use extreme glassmorphism, redesign the `Sidebar.tsx` into a floating dock, and rewrite `Dashboard.tsx` into an asymmetrical command center using `recharts` and `framer-motion`.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Recharts

## Global Constraints

- Use Neon Cyan (`#00FFDE`) and Crimson Red (`#FF003C`) as primary accents.
- All cards must use frosted glass with thin `border-white/5` borders (no solid fills).
- Typography should be highly tracked, uppercase headers, and monospaced values for metrics.
- Maintain existing local data gathering hooks (no breaking backend functionality).

---

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

---

### Task 2: Floating Dock Navigation (Sidebar)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx` (to match styling)
- Modify: `src/App.tsx` (to inject `.aurora-layer`)

**Interfaces:**
- Consumes: `.magnetic-dock`, `.glass-shell`
- Produces: Floating sidebar UI.

- [ ] **Step 1: Inject Aurora Layer in App.tsx**
Modify `src/App.tsx` to include the aurora background before the flex container:
```tsx
        <div className="h-screen w-screen flex bg-[#0d0f1a] text-white overflow-hidden relative selection:bg-[var(--accent-cyan)] selection:text-black">
            <div className="aurora-layer" />
            <MemoizedSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
```

- [ ] **Step 2: Update Sidebar Layout**
In `src/components/layout/Sidebar.tsx`, wrap the main sidebar in the floating dock style:
```tsx
        <div className="w-64 h-full flex flex-col magnetic-dock relative z-20">
```
Update navigation buttons to use sleek hover effects:
```tsx
        <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all duration-300 group relative
                ${isActive 
                    ? 'text-[#00FFDE] bg-[rgba(0,255,222,0.05)]' 
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
        >
            {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00FFDE] shadow-[0_0_10px_#00FFDE]" />
            )}
            <item.icon className="w-5 h-5" />
            <span className="text-[13px] font-bold uppercase tracking-widest">{item.label}</span>
        </button>
```

- [ ] **Step 3: Commit**
```bash
git add src/App.tsx src/components/layout/Sidebar.tsx
git commit -m "ui: redesign sidebar as floating magnetic dock"
```

---

### Task 3: Command Center Dashboard (The Cockpit)

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: System metrics from `window.api`
- Produces: Asymmetrical dashboard layout.

- [ ] **Step 1: Define Recharts Wave Component**
At the top of `src/pages/Dashboard.tsx` (or a separate file if preferred, but inline for now is fine if it's purely for dashboard):
```tsx
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
// Use existing hooks for metrics...
```

- [ ] **Step 2: Restructure Dashboard Layout**
Replace the grid of RingGauges with the Cockpit layout:
```tsx
    return (
        <div className="h-full w-full max-w-[100rem] mx-auto flex flex-col xl:flex-row gap-6 p-4">
            {/* Left Flank: Controls */}
            <div className="w-full xl:w-72 flex flex-col gap-4">
                <div className="glass-shell rounded-2xl p-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00FFDE] mb-4">Quick Actions</h3>
                    <button className="w-full py-4 glass-shell hover:bg-[#00FFDE]/10 border-[#00FFDE]/20 text-[#00FFDE] text-xs font-bold uppercase tracking-widest rounded-xl transition-all mb-3">
                        Optimize System
                    </button>
                    <button className="w-full py-4 glass-shell hover:bg-[#FF003C]/10 border-[#FF003C]/20 text-[#FF003C] text-xs font-bold uppercase tracking-widest rounded-xl transition-all">
                        Clear Memory
                    </button>
                </div>
            </div>

            {/* Center: Live Wave Chart */}
            <div className="flex-1 glass-shell rounded-2xl p-6 flex flex-col">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-6">Core Telemetry</h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpuHistory}>
                            <defs>
                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00FFDE" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00FFDE" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="load" stroke="#00FFDE" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right Flank: Telemetry Numbers */}
            <div className="w-full xl:w-80 flex flex-col gap-4">
                <div className="glass-shell rounded-2xl p-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">Realtime Load</h3>
                    <div className="text-4xl font-mono text-[#00FFDE] tracking-tighter">{cpuLoad.toFixed(1)}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-[#00FFDE]/50 mt-1">CPU Load</div>
                </div>
            </div>
        </div>
    )
```

- [ ] **Step 3: Maintain State Hooks for Chart Data**
Ensure `Dashboard.tsx` uses `useEffect` to append to `cpuHistory` arrays for the recharts graph. Keep array at max 60 items.

- [ ] **Step 4: Commit**
```bash
git add src/pages/Dashboard.tsx
git commit -m "ui: implement asymmetrical cockpit dashboard"
```

---

### Task 4: Sub-page Styling (AppInstaller, Drivers)

**Files:**
- Modify: `src/pages/AppInstaller.tsx`
- Modify: `src/pages/DriverUpdater.tsx`

**Interfaces:**
- Consumes: Global `.glass-shell` classes

- [ ] **Step 1: Apply Glass Shell to Cards**
In `AppInstaller.tsx` and `DriverUpdater.tsx`, replace `card-premium` with `glass-shell`:
```tsx
className="glass-shell p-6 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.04] transition-all"
```

- [ ] **Step 2: Update Typography**
Change list items to use the premium monospace metrics style:
```tsx
<div className="text-[11px] uppercase tracking-widest font-black opacity-50">Version</div>
<div className="font-mono text-[#00FFDE]">{app.Version}</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/AppInstaller.tsx src/pages/DriverUpdater.tsx
git commit -m "ui: propagate cockpit styling to subpages"
```
