import { test } from 'node:test';
import assert from 'node:assert';
import { calculateHealthScore } from './health.ts';

test('calculateHealthScore - ideal case', () => {
    // 0% CPU, 0% RAM, 50 tweaks (max score)
    // cpuScore = 100, ramScore = 100, tweakScore = 100
    // 100 * 0.35 + 100 * 0.35 + 100 * 0.3 = 35 + 35 + 30 = 100
    assert.strictEqual(calculateHealthScore(0, 0, 50), 100);
    assert.strictEqual(calculateHealthScore(0, 0, 100), 100); // 100 tweaks also maxes out
});

test('calculateHealthScore - worst case', () => {
    // 100% CPU, 100% RAM, 0 tweaks
    // cpuScore = 0, ramScore = 0, tweakScore = 0
    assert.strictEqual(calculateHealthScore(100, 100, 0), 0);
});

test('calculateHealthScore - weight verification', () => {
    // CPU only impact (100% RAM, 0 tweaks)
    // 0% CPU -> cpuScore = 100. 100 * 0.35 = 35
    assert.strictEqual(calculateHealthScore(0, 100, 0), 35);

    // RAM only impact (100% CPU, 0 tweaks)
    // 0% RAM -> ramScore = 100. 100 * 0.35 = 35
    assert.strictEqual(calculateHealthScore(100, 0, 0), 35);

    // Tweaks only impact (100% CPU, 100% RAM)
    // 50 tweaks -> tweakScore = 100. 100 * 0.3 = 30
    assert.strictEqual(calculateHealthScore(100, 100, 50), 30);
});

test('calculateHealthScore - mixed cases', () => {
    // 20% CPU, 40% RAM, 10 tweaks
    // cpuScore = 80, ramScore = 60, tweakScore = 20
    // 80 * 0.35 + 60 * 0.35 + 20 * 0.3 = 28 + 21 + 6 = 55
    assert.strictEqual(calculateHealthScore(20, 40, 10), 55);
});

test('calculateHealthScore - rounding', () => {
    // 10% CPU, 10% RAM, 5 tweaks
    // cpuScore = 90, ramScore = 90, tweakScore = 10
    // 90 * 0.35 + 90 * 0.35 + 10 * 0.3 = 31.5 + 31.5 + 3 = 66
    assert.strictEqual(calculateHealthScore(10, 10, 5), 66);

    // 15% CPU, 10% RAM, 5 tweaks
    // cpuScore = 85, ramScore = 90, tweakScore = 10
    // 85 * 0.35 + 90 * 0.35 + 10 * 0.3 = 29.75 + 31.5 + 3 = 64.25 -> 64
    assert.strictEqual(calculateHealthScore(15, 10, 5), 64);
});

test('calculateHealthScore - edge cases (clamping)', () => {
    // Negative inputs
    // CPU -50 -> effectiveCpu = 0 -> cpuScore = 100.
    assert.strictEqual(calculateHealthScore(-50, 0, 50), 100);

    // Large inputs
    // CPU 150 -> effectiveCpu = 100 -> cpuScore = 0
    assert.strictEqual(calculateHealthScore(150, 150, -10), 0);
});
