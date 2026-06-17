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
