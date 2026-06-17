import { test } from 'node:test';
import assert from 'node:assert';
import { tweaks, getTweaksByCategory, getTweaksByCategoryAndTab, getSafeTweaks } from './tweaks.ts';

test('getTweaksByCategory - returns correct tweaks for existing category', () => {
    // Check specific known tweaks
    const performanceTweaks = getTweaksByCategory('performance');
    assert.ok(performanceTweaks.length > 0);
    assert.ok(performanceTweaks.some(t => t.id === 'perf_anims_off'));
    assert.ok(performanceTweaks.every(t => t.category === 'performance'));

    const privacyTweaks = getTweaksByCategory('privacy');
    assert.ok(privacyTweaks.length > 0);
    assert.ok(privacyTweaks.some(t => t.id === 'priv_telemetry'));
    assert.ok(privacyTweaks.every(t => t.category === 'privacy'));

    // Tautological check for all categories
    const categories = Array.from(new Set(tweaks.map(t => t.category)));
    for (const cat of categories) {
        const filtered = getTweaksByCategory(cat);
        const expected = tweaks.filter(t => t.category === cat);
        assert.deepStrictEqual(filtered, expected);
    }
});

test('getTweaksByCategory - returns empty array for non-existent category', () => {
    assert.deepStrictEqual(getTweaksByCategory('non-existent-category'), []);
});

test('getTweaksByCategoryAndTab - returns correct tweaks for existing category and tab', () => {
    // Check specific known combinations
    const visualPerf = getTweaksByCategoryAndTab('performance', 'visual');
    assert.ok(visualPerf.length > 0);
    assert.ok(visualPerf.some(t => t.id === 'perf_anims_off'));
    assert.ok(visualPerf.every(t => t.category === 'performance' && t.tab === 'visual'));

    const telemetryPriv = getTweaksByCategoryAndTab('privacy', 'telemetry');
    assert.ok(telemetryPriv.length > 0);
    assert.ok(telemetryPriv.some(t => t.id === 'priv_telemetry'));
    assert.ok(telemetryPriv.every(t => t.category === 'privacy' && t.tab === 'telemetry'));

    // Tautological check for all combinations
    const combinations = Array.from(new Set(tweaks.map(t => `${t.category}|${t.tab}`)));
    for (const combo of combinations) {
        const [cat, tab] = combo.split('|');
        const filtered = getTweaksByCategoryAndTab(cat, tab);
        const expected = tweaks.filter(t => t.category === cat && t.tab === tab);
        assert.deepStrictEqual(filtered, expected);
    }
});

test('getTweaksByCategoryAndTab - returns empty array for non-existent category or tab', () => {
    assert.deepStrictEqual(getTweaksByCategoryAndTab('performance', 'non-existent-tab'), []);
    assert.deepStrictEqual(getTweaksByCategoryAndTab('non-existent-category', 'visual'), []);
});

test('getSafeTweaks - returns only tweaks with safe risk', () => {
    const safeTweaks = getSafeTweaks();
    const expected = tweaks.filter(t => t.risk === 'safe');

    assert.ok(safeTweaks.length > 0);
    assert.ok(safeTweaks.every(t => t.risk === 'safe'));
    assert.ok(safeTweaks.some(t => t.id === 'perf_anims_off')); // known safe tweak
    assert.deepStrictEqual(safeTweaks, expected);
});
