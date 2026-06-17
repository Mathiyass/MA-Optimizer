4323e82 fix: address review feedback for dashboard progress bars and styles
4c0b5ed style: apply premium crimson-cyan styling to primary views

 .../docs/superpowers/plans/task-3-report.md        | 31 +++++++++++
 .../src/components/ui/TweakCard.tsx                |  8 +--
 ma-optimizer-electron/src/pages/Dashboard.tsx      | 60 +++++++++++-----------
 ma-optimizer-electron/src/pages/Performance.tsx    |  4 +-
 4 files changed, 68 insertions(+), 35 deletions(-)

diff --git a/ma-optimizer-electron/docs/superpowers/plans/task-3-report.md b/ma-optimizer-electron/docs/superpowers/plans/task-3-report.md
new file mode 100644
index 0000000..ef28cb7
--- /dev/null
+++ b/ma-optimizer-electron/docs/superpowers/plans/task-3-report.md
@@ -0,0 +1,31 @@
+# Task 3 Report
+
+## What I implemented
+- Replaced standard flat cards with frosted glass cards (`bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] hover:bg-[rgba(255,255,255,0.05)]`) in `Dashboard.tsx` and `Performance.tsx`.
+- Updated typography to glowing for key metrics in `Dashboard.tsx` (`text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`).
+- Replaced standard progress bars with neon glowing ones in `Dashboard.tsx` (`shadow-[0_0_15px_#00FFDE]`).
+- Adjusted progress bar container `overflow-hidden` to `overflow-visible` to ensure neon glows are not clipped.
+- Applied intense hover states and glassmorphism styling to `TweakCard.tsx` (the interactive cards used in the `Performance` view).
+
+## What I tested and test results
+- Ran `npm run typecheck`
+- Expected: PASS
+- Result: PASS (`tsc --noEmit && tsc -p tsconfig.electron.json --noEmit` completed without errors)
+
+## Files changed
+- `src/pages/Dashboard.tsx`
+- `src/pages/Performance.tsx`
+- `src/components/ui/TweakCard.tsx`
+
+## Self-review findings
+- Checked if the `PremiumCard` component was strictly required. Decided to apply styles directly to the elements to minimize refactoring risk and unnecessary abstractions, which fulfills the requirement as creating the component was explicitly marked as optional.
+- Verified that the intense hover state on interactive cards (`TweakCard`) matches the specified colors (`#00FFDE` and `#FF003C`).
+
+## Issues or concerns
+- None.
+
+## Review Fixes (June 17)
+- **Fix 1:** Addressed stacked progress bars visual bug in `Dashboard.tsx` by separating the glowing elements into an `overflow-visible` absolutely positioned container beneath an `overflow-hidden` container clipping the actual solid bars. This preserves the flush junction while maintaining the unclipped neon glow.
+- **Fix 2:** Added missing cyan hover shadow `hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]` to the Disk Storage/Network Traffic telemetry card.
+- **Fix 3:** Extracted repeated glassmorphism styling strings in `Dashboard.tsx` into a `premiumCardClass` constant to adhere to DRY principles.
+- **Verification:** Re-ran `npm run typecheck`, which passed successfully.
diff --git a/ma-optimizer-electron/src/components/ui/TweakCard.tsx b/ma-optimizer-electron/src/components/ui/TweakCard.tsx
index b454deb..ef40d47 100644
--- a/ma-optimizer-electron/src/components/ui/TweakCard.tsx
+++ b/ma-optimizer-electron/src/components/ui/TweakCard.tsx
@@ -13,32 +13,32 @@ interface TweakCardProps {
     loading?: boolean
     disabled?: boolean
     registryPath?: string
 }
 
 export function TweakCard({ title, description, risk, enabled, onChange, loading, disabled, registryPath }: TweakCardProps) {
     const [showInfo, setShowInfo] = useState(false)
 
     const borderColor = enabled
         ? risk === 'aggressive'
-            ? 'border-[#ff003c]/40 bg-[#ff003c]/[0.03] shadow-[0_0_30px_rgba(255,0,60,0.1)]'
-            : 'border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/[0.03] shadow-[0_0_30px_rgba(0,255,222,0.1)]'
-        : 'border-white/5 bg-[rgba(15,17,26,0.6)] hover:border-white/20'
+            ? 'border-[#ff003c]/40 bg-[#ff003c]/[0.03] shadow-[0_0_30px_rgba(255,0,60,0.1)] hover:border-[#FF003C] hover:shadow-[0_0_30px_rgba(255,0,60,0.3)]'
+            : 'border-[#00FFDE]/40 bg-[#00FFDE]/[0.03] shadow-[0_0_30px_rgba(0,255,222,0.1)] hover:border-[#00FFDE] hover:shadow-[0_0_30px_rgba(0,255,222,0.3)]'
+        : 'border-white/5 bg-[rgba(255,255,255,0.03)] hover:border-[#00FFDE] hover:bg-[rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]'
 
     return (
         <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, ease: 'easeOut' }}
             whileHover={{ scale: 1.01, translateY: -2 }}
             className={`
-                relative p-5 rounded-2xl border transition-all duration-300 card-premium backdrop-blur-xl
+                relative p-5 rounded-3xl border transition-all duration-300 backdrop-blur-3xl
                 ${borderColor}
                 ${disabled ? 'opacity-50 pointer-events-none' : ''}
             `}
         >
             <div className="flex items-start justify-between gap-5">
                 <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3 mb-2">
                         <span className="text-white font-bold text-[15px] tracking-wide">{title}</span>
                         <RiskBadge risk={risk} />
                         {registryPath && (
diff --git a/ma-optimizer-electron/src/pages/Dashboard.tsx b/ma-optimizer-electron/src/pages/Dashboard.tsx
index a852c06..aa5da95 100644
--- a/ma-optimizer-electron/src/pages/Dashboard.tsx
+++ b/ma-optimizer-electron/src/pages/Dashboard.tsx
@@ -91,20 +91,22 @@ function HealthGauge({ score }: { score: number }) {
                     <span className="text-text-muted text-[10px] mt-0.5">/ 100</span>
                 </div>
             </div>
             <div className={`text-sm font-semibold mt-2 ${color.text}`}>{color.label}</div>
             <div className="text-text-dim text-[10px]">System Health</div>
         </div>
     )
 }
 
 export function Dashboard() {
+    const premiumCardClass = "bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-[rgba(255,255,255,0.05)]"
+    
     const cpu = useSystemStore(s => s.cpu)
     const ram = useSystemStore(s => s.ram)
     const disk = useSystemStore(s => s.disk)
     const net = useSystemStore(s => s.network)
     const setPage = useAppStore(s => s.setPage)
     const addNotification = useAppStore(s => s.addNotification)
     const applied = useSettingsStore(s => Object.values(s.appliedTweaks).filter(Boolean).length)
     const cleaned = useSettingsStore(s => s.totalCleaned)
     const [osInfo, setOsInfo] = useState<{ platform: string; distro: string; release: string; build: string; hostname: string; arch: string } | null>(null)
     const [uptime, setUptime] = useState(0)
@@ -268,34 +270,34 @@ export function Dashboard() {
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="mt-8 pt-8 border-t border-white/5"
                     >
                         <div className="flex justify-between mb-2">
                             <span className="text-[var(--accent-cyan)] text-sm font-bold flex items-center gap-2" style={{ textShadow: 'var(--glow-cyan)' }}>
                                 <RefreshCw className="w-4 h-4 animate-spin" /> {optSteps[optStep].label}
                             </span>
                             <span className="text-[var(--text-muted)] text-sm font-mono">{optProgress}%</span>
                         </div>
-                        <div className="w-full h-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-hidden relative">
+                        <div className="w-full h-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-visible relative">
                             <motion.div
-                                className="absolute inset-y-0 left-0 bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]"
+                                className="absolute inset-y-0 left-0 bg-[#00FFDE] shadow-[0_0_15px_#00FFDE] rounded-full"
                                 animate={{ width: `${optProgress}%` }}
                                 transition={{ type: 'spring', stiffness: 50 }}
                             />
                         </div>
                     </motion.div>
                 )}
             </motion.div>
 
             {/* Telemetry and System Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
-                <motion.div variants={item} className="col-span-1 lg:col-span-2 card-premium rounded-3xl p-8 transition-all hover:shadow-[0_0_30px_rgba(0,255,222,0.1)] border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-2xl">
+                <motion.div variants={item} className={`col-span-1 lg:col-span-2 ${premiumCardClass} hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                     <div className="flex items-center gap-4 mb-8">
                         <div className="p-3 rounded-xl bg-gradient-to-br from-[rgba(0,255,222,0.1)] to-transparent border border-[var(--accent-cyan)]/30 shadow-[var(--glow-cyan)]">
                             <Monitor className="w-6 h-6 text-[var(--accent-cyan)]" />
                         </div>
                         <div>
                             <h3 className="text-white text-lg font-black tracking-wide">System Specification</h3>
                             <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-widest">Hardware Info</p>
                         </div>
                     </div>
                     <div className="space-y-3">
@@ -307,107 +309,107 @@ export function Dashboard() {
                             { label: 'System Uptime', value: formatUptime(uptime), icon: Clock },
                         ].map((row, idx) => (
                             <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[var(--border)] last:border-0">
                                 <span className="text-[var(--text-secondary)]">{row.label}</span>
                                 <span className={`text-[var(--text-primary)] font-semibold ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                             </div>
                         ))}
                     </div>
                 </motion.div>
 
-                <motion.div variants={item} className="card-premium rounded-3xl p-8 flex flex-col items-center justify-center group transition-all hover:shadow-[0_0_30px_rgba(0,255,222,0.1)] border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-2xl">
+                <motion.div variants={item} className={`${premiumCardClass} flex flex-col items-center justify-center group hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                     <RingGauge value={cpu} label="CPU" sublabel={`${cpu.toFixed(0)}% Load`} size={140} />
                 </motion.div>
 
-                <motion.div variants={item} className="card-premium rounded-3xl p-8 flex flex-col items-center justify-center group transition-all hover:shadow-[0_0_30px_rgba(0,255,222,0.1)] border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-2xl">
+                <motion.div variants={item} className={`${premiumCardClass} flex flex-col items-center justify-center group hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                     <RingGauge value={ram.percent} label="RAM" sublabel={`${formatBytes(ram.used)} / ${formatBytes(ram.total)}`} size={140} />
                 </motion.div>
 
-                <motion.div variants={item} className="card-premium rounded-3xl p-8 space-y-8 flex flex-col justify-center border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-2xl">
+                <motion.div variants={item} className={`${premiumCardClass} space-y-8 flex flex-col justify-center hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                     <div>
                         <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2">
                                 <div className="p-1.5 rounded-lg border border-[var(--border)] bg-[rgba(0,255,222,0.05)] shadow-[var(--glow-cyan)]">
                                     <HardDrive className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                 </div>
                                 <span className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Disk Storage I/O</span>
                             </div>
                         </div>
                         <div className="space-y-3">
                             <div className="flex justify-between items-end">
                                 <div className="flex flex-col">
                                     <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Read</span>
-                                    <span className="text-sm font-mono text-[var(--accent-cyan)] font-bold" style={{ textShadow: 'var(--glow-cyan)' }}>{formatBytes(disk.readPerSec)}/s</span>
+                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-bold">{formatBytes(disk.readPerSec)}/s</span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                     <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Write</span>
-                                    <span className="text-sm font-mono text-[var(--accent-cyan)] opacity-70 font-bold">{formatBytes(disk.writePerSec)}/s</span>
+                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-70 font-bold">{formatBytes(disk.writePerSec)}/s</span>
                                 </div>
                             </div>
-                            <div className="h-1.5 w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-hidden flex">
-                                <motion.div
-                                    className="h-full bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]"
-                                    animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }}
-                                />
-                                <motion.div
-                                    className="h-full bg-[var(--accent-cyan)] opacity-40"
-                                    animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }}
-                                />
+                            <div className="relative h-1.5 w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-full">
+                                <div className="absolute inset-0 flex overflow-visible pointer-events-none">
+                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE]" animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
+                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE] opacity-40" animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
+                                </div>
+                                <div className="absolute inset-0 flex overflow-hidden rounded-full pointer-events-none">
+                                    <motion.div className="h-full bg-[#00FFDE]" animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
+                                    <motion.div className="h-full bg-[#00FFDE] opacity-40" animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
+                                </div>
                             </div>
                         </div>
                     </div>
 
                     <div className="h-px bg-[var(--border)] opacity-50" />
 
                     <div>
                         <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2">
                                 <div className="p-1.5 rounded-lg border border-[var(--border)] bg-[rgba(0,255,222,0.05)] shadow-[var(--glow-cyan)]">
                                     <Wifi className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                 </div>
                                 <span className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Network Traffic</span>
                             </div>
                         </div>
                         <div className="space-y-3">
                             <div className="flex justify-between items-end">
                                 <div className="flex flex-col">
                                     <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Download</span>
-                                    <span className="text-sm font-mono text-[var(--accent-cyan)] font-bold" style={{ textShadow: 'var(--glow-cyan)' }}>{formatBytes(net.rxSec)}/s</span>
+                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-bold">{formatBytes(net.rxSec)}/s</span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                     <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Upload</span>
-                                    <span className="text-sm font-mono text-[var(--accent-cyan)] opacity-70 font-bold">{formatBytes(net.txSec)}/s</span>
+                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-70 font-bold">{formatBytes(net.txSec)}/s</span>
                                 </div>
                             </div>
-                            <div className="h-1.5 w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-hidden flex">
-                                <motion.div
-                                    className="h-full bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]"
-                                    animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }}
-                                />
-                                <motion.div
-                                    className="h-full bg-[var(--accent-cyan)] opacity-40"
-                                    animate={{ width: `${Math.min((net.txSec / (50 * 1024 * 1024)) * 100, 100)}%` }}
-                                />
+                            <div className="relative h-1.5 w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-full">
+                                <div className="absolute inset-0 flex overflow-visible pointer-events-none">
+                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE]" animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
+                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE] opacity-40" animate={{ width: `${Math.min((net.txSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
+                                </div>
+                                <div className="absolute inset-0 flex overflow-hidden rounded-full pointer-events-none">
+                                    <motion.div className="h-full bg-[#00FFDE]" animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
+                                    <motion.div className="h-full bg-[#00FFDE] opacity-40" animate={{ width: `${Math.min((net.txSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
+                                </div>
                             </div>
                         </div>
                     </div>
                 </motion.div>
             </div>
 
             <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                 {quickCards.map((c, i) => (
                     <motion.button
                         key={i}
                         onClick={() => setPage(c.page)}
                         whileHover={{ y: -6, scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
-                        className={`relative overflow-hidden rounded-[2rem] p-8 text-left group transition-all duration-300 card-premium border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-2xl ${c.glow}`}
+                        className={`relative overflow-hidden text-left group duration-300 hover:border-white/10 ${premiumCardClass} ${c.glow}`}
                     >
                         <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                         
                         <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                             <c.icon className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                         </div>
                         <div className="text-white font-black text-xl mb-2 tracking-tight">{c.label}</div>
                         <div className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">{c.desc}</div>
                         
                         <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 border border-white/10">
diff --git a/ma-optimizer-electron/src/pages/Performance.tsx b/ma-optimizer-electron/src/pages/Performance.tsx
index 40221c2..569ccc4 100644
--- a/ma-optimizer-electron/src/pages/Performance.tsx
+++ b/ma-optimizer-electron/src/pages/Performance.tsx
@@ -263,36 +263,36 @@ export function Performance() {
                         </button>
                     </div>
                 </div>
             </motion.div>
 
             <div className="mt-8">
                 <TabGroup tabs={tabs} active={tab} onChange={setTab} />
             </div>
 
             {tab === 'services' ? (
-                <div className="card-premium rounded-3xl p-8 border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-2xl mt-6">
+                <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-[rgba(255,255,255,0.05)] hover:border-white/10 mt-6">
                     <ServicesTab />
                 </div>
             ) : (
                 <div className="grid gap-4 mt-6">
                     {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                     {items.length === 0 && <div className="text-[var(--text-muted)] text-center py-12 font-bold tracking-widest uppercase">No tweaks in this category</div>}
                 </div>
             )}
 
             {optimizing && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,12,20,0.85)] backdrop-blur-3xl">
                     <motion.div
                         initial={{ opacity: 0, scale: 0.9, y: 20 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
-                        className="card-premium border border-[var(--accent-cyan)]/30 rounded-3xl p-10 w-[500px] shadow-[0_0_50px_rgba(0,255,222,0.15)] bg-[rgba(15,17,26,0.9)] relative overflow-hidden"
+                        className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-[var(--accent-cyan)]/30 rounded-[2.5rem] p-10 w-[500px] shadow-[0_0_50px_rgba(0,255,222,0.15)] relative overflow-hidden"
                     >
                         {/* Scanning beam effect */}
                         <motion.div 
                             className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-cyan)]/10 to-transparent h-[200%]"
                             animate={{ top: ['-100%', '100%'] }}
                             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                         />
 
                         <div className="relative z-10">
                             <div className="flex items-center gap-4 mb-8 justify-center">
