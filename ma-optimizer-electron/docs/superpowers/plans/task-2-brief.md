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
