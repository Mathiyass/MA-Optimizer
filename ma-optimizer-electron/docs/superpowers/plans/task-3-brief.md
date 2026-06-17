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
