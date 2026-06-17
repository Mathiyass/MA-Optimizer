import { test } from 'node:test';
import assert from 'node:assert';
import { getTweaksByCategory, getTweaksByCategoryAndTab, getSafeTweaks } from './tweaks.ts';

test('getTweaksByCategory - filters tweaks by category', () => {
    const performanceTweaks = getTweaksByCategory('performance');
    assert.ok(performanceTweaks.length > 0);
    assert.ok(performanceTweaks.every(t => t.category === 'performance'));

    // Specific item check
    const hasAnimsOff = performanceTweaks.some(t => t.id === 'perf_anims_off');
    assert.strictEqual(hasAnimsOff, true, 'performance category should include perf_anims_off');

    const privacyTweaks = getTweaksByCategory('privacy');
    assert.ok(privacyTweaks.length > 0);
    assert.ok(privacyTweaks.every(t => t.category === 'privacy'));

    const hasTelemetry = privacyTweaks.some(t => t.id === 'priv_telemetry');
    assert.strictEqual(hasTelemetry, true, 'privacy category should include priv_telemetry');
});

test('getTweaksByCategory - returns empty array for non-existent category', () => {
    const nonExistent = getTweaksByCategory('non-existent-category');
    assert.strictEqual(nonExistent.length, 0);
});

test('getTweaksByCategoryAndTab - filters tweaks by category and tab', () => {
    const perfVisualTweaks = getTweaksByCategoryAndTab('performance', 'visual');
    assert.ok(perfVisualTweaks.length > 0);
    assert.ok(perfVisualTweaks.every(t => t.category === 'performance' && t.tab === 'visual'));

    // Specific item check
    const hasAnimsOff = perfVisualTweaks.some(t => t.id === 'perf_anims_off');
    assert.strictEqual(hasAnimsOff, true, 'performance/visual should include perf_anims_off');

    const gamingGeneralTweaks = getTweaksByCategoryAndTab('gaming', 'general');
    assert.ok(gamingGeneralTweaks.length > 0);
    assert.ok(gamingGeneralTweaks.every(t => t.category === 'gaming' && t.tab === 'general'));
});

test('getTweaksByCategoryAndTab - returns empty array for invalid combinations', () => {
    const invalidCombo = getTweaksByCategoryAndTab('performance', 'non-existent-tab');
    assert.strictEqual(invalidCombo.length, 0);

    const wrongCategory = getTweaksByCategoryAndTab('privacy', 'visual'); // visual tab belongs to performance
    assert.strictEqual(wrongCategory.length, 0);
});

test('getSafeTweaks - filters only safe tweaks', () => {
    const safeTweaks = getSafeTweaks();
    assert.ok(safeTweaks.length > 0);
    assert.ok(safeTweaks.every(t => t.risk === 'safe'));

    // Verify some known safe tweaks are present
    const hasAnimsOff = safeTweaks.some(t => t.id === 'perf_anims_off');
    assert.strictEqual(hasAnimsOff, true, 'safe tweaks should include perf_anims_off');

    // Verify some known moderate/aggressive tweaks are absent
    const hasHags = safeTweaks.some(t => t.id === 'perf_hags'); // risk: moderate
    assert.strictEqual(hasHags, false, 'safe tweaks should NOT include perf_hags');

    const hasSpectre = safeTweaks.some(t => t.id === 'perf_spectre'); // risk: aggressive
    assert.strictEqual(hasSpectre, false, 'safe tweaks should NOT include perf_spectre');
});
