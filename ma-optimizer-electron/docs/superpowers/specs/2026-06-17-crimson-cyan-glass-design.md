# Design Specification: Crimson-Cyan Glass UI Overhaul

## 1. Overview
The goal of this project is to completely overhaul the MA-Optimizer Electron UI to achieve the absolute "best possible" extreme premium aesthetic. The design language merges Apple's pristine glassmorphism (frosted glass, intense backdrop blurs, rounded elegance) with an aggressive, elite gamer palette using Neon Cyan Blue (`#00FFDE`) and Crimson Red (`#FF003C`).

## 2. Core Visual Language

### Colors & Variables
*   **Neon Cyan (`#00FFDE`)**: Used for active states, healthy stats, selected tabs, progress bars, and positive actions. Emits a matching cyan glow via `drop-shadow` and `box-shadow`.
*   **Crimson Red (`#FF003C`)**: Used for power modes, high-impact buttons, destructive actions, and alerts. Emits a matching red glow.
*   **Backgrounds**: Deep, dark translucent layers. `bg-black/40` to `bg-[rgba(15,17,26,0.6)]` with intense `backdrop-blur-xl` to `backdrop-blur-3xl`.
*   **Borders**: Soft, thin white translucency (`border-white/5` to `border-white/10`) to simulate edge-lighting on glass.

### Structure & Shapes
*   **Corner Radii**: Extreme rounding. `rounded-2xl` for small elements, `rounded-[2.5rem]` for main content cards and hero sections.
*   **Typography**: Clean `Inter` font. Tight tracking (`tracking-tight`) on headings. Wide tracking (`tracking-widest uppercase`) on badges and small labels.

### Micro-Animations
*   **Framer Motion**: Extensive use of spring physics (`type: "spring", stiffness: 400, damping: 30`) for interactions.
*   **Hover States**: Fluid scale-up (`scale: 1.02`), increased glow intensity, and slight background lightening on hover.

## 3. Implementation Steps

### Phase 1: Tailwind Configuration
*   Update `tailwind.config.ts` to include the specific new hex codes.
    *   Change `accent-cyan` to `#00FFDE`.
    *   Change `accent-violet` to `#FF003C` (and rename references to `accent-crimson` if necessary, or just override the hex).
    *   Ensure shadows and glow classes map accurately to these new hex codes.

### Phase 2: Core Layout Updates
*   **Sidebar (`Sidebar.tsx`)**: Update active states to use the intense Cyan glow. Update the logo/branding to feature the new colors. Update text sizing and tracking.
*   **Header (`Header.tsx`)**: Increase blur, refine borders, ensure the search and progress bars utilize the new Neon Cyan/Crimson palette.
*   **Status Bar (`StatusBar.tsx`)**: Update system metrics to use the new color scheme (Cyan for low usage, Crimson for high usage).

### Phase 3: Page Overhauls
*   Iterate through major pages (`Dashboard`, `MaPowerPlan`, `Performance`, `Cleaner`, `Network`, `Startup`, `DriverUpdater`, etc.).
*   Replace legacy dark-mode styles with the new extreme glassmorphic structures (`bg-[rgba(15,17,26,0.7)] backdrop-blur-3xl border border-white/5 rounded-[2.5rem]`).
*   Implement floating ambient background orbs (absolute positioned `div`s with `blur-[100px]`) using `#00FFDE` and `#FF003C` behind main cards.
*   Update all primary buttons to the new fluid hover interactions and glowing shadows.

## 4. Scope and Constraints
*   **Performance**: Since extensive use of `backdrop-blur` and complex shadows can be GPU intensive, we will ensure that moving parts are hardware-accelerated (`transform: translateZ(0)`) and background ambient pulses use CSS animations rather than JS recalculations.
*   **Consistency**: The color palette must strictly adhere to the two dominant accent colors to maintain the premium feel. Introducing other random colors will break the aesthetic.

## 5. Success Criteria
*   The entire application shell and all major feature pages consistently utilize the Crimson/Cyan glassmorphism.
*   Interactions feel fluid and snappy, imitating a premium Apple environment.
*   The UI invokes a sense of "elite performance" matching the app's purpose as an optimizer.
