/** System Health Score — weighted composite */
export function calculateHealthScore(cpu: number, ramPercent: number, applied: number): number {
    // Low CPU usage = good, Low RAM usage = good, more tweaks = better
    // Ensure inputs are within reasonable bounds before scoring
    const effectiveCpu = Math.min(100, Math.max(0, cpu))
    const effectiveRam = Math.min(100, Math.max(0, ramPercent))
    const effectiveApplied = Math.max(0, applied)

    const cpuScore = 100 - effectiveCpu
    const ramScore = 100 - effectiveRam
    const tweakScore = Math.min(effectiveApplied * 2, 100) // max 50 tweaks = 100

    return Math.round(cpuScore * 0.35 + ramScore * 0.35 + tweakScore * 0.3)
}
