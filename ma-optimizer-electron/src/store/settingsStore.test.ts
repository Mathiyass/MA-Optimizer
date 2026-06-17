import { test } from 'node:test';
import assert from 'node:assert';
import { useSettingsStore } from './settingsStore.ts';

const initialState = {
    appliedTweaks: {},
    totalCleaned: 0,
    tweakBackups: {},
    hasRunBefore: false,
    lastPage: 'dashboard',
};

test('settingsStore.ts - initial state', () => {
    useSettingsStore.setState(initialState);
    const state = useSettingsStore.getState();
    assert.deepStrictEqual(state.appliedTweaks, {});
    assert.strictEqual(state.totalCleaned, 0);
    assert.deepStrictEqual(state.tweakBackups, {});
    assert.strictEqual(state.hasRunBefore, false);
    assert.strictEqual(state.lastPage, 'dashboard');
});

test('settingsStore.ts - setTweakApplied', () => {
    useSettingsStore.setState(initialState);
    const { setTweakApplied } = useSettingsStore.getState();

    setTweakApplied('tweak1', true);
    let state = useSettingsStore.getState();
    assert.deepStrictEqual(state.appliedTweaks, { tweak1: true });

    setTweakApplied('tweak2', false);
    state = useSettingsStore.getState();
    assert.deepStrictEqual(state.appliedTweaks, { tweak1: true, tweak2: false });

    setTweakApplied('tweak1', false);
    state = useSettingsStore.getState();
    assert.deepStrictEqual(state.appliedTweaks, { tweak1: false, tweak2: false });
});

test('settingsStore.ts - addCleaned', () => {
    useSettingsStore.setState(initialState);
    const { addCleaned } = useSettingsStore.getState();

    addCleaned(1024);
    let state = useSettingsStore.getState();
    assert.strictEqual(state.totalCleaned, 1024);

    addCleaned(2048);
    state = useSettingsStore.getState();
    assert.strictEqual(state.totalCleaned, 3072);
});

test('settingsStore.ts - backupTweak', () => {
    useSettingsStore.setState(initialState);
    const { backupTweak } = useSettingsStore.getState();

    backupTweak('tweak1', 'original-value');
    let state = useSettingsStore.getState();
    assert.deepStrictEqual(state.tweakBackups, { tweak1: 'original-value' });

    // Should not overwrite existing backup
    backupTweak('tweak1', 'new-value');
    state = useSettingsStore.getState();
    assert.deepStrictEqual(state.tweakBackups, { tweak1: 'original-value' });

    backupTweak('tweak2', { key: 'val' });
    state = useSettingsStore.getState();
    assert.deepStrictEqual(state.tweakBackups, {
        tweak1: 'original-value',
        tweak2: { key: 'val' }
    });
});

test('settingsStore.ts - setHasRunBefore', () => {
    useSettingsStore.setState(initialState);
    const { setHasRunBefore } = useSettingsStore.getState();

    setHasRunBefore(true);
    let state = useSettingsStore.getState();
    assert.strictEqual(state.hasRunBefore, true);

    setHasRunBefore(false);
    state = useSettingsStore.getState();
    assert.strictEqual(state.hasRunBefore, false);
});

test('settingsStore.ts - setLastPage', () => {
    useSettingsStore.setState(initialState);
    const { setLastPage } = useSettingsStore.getState();

    setLastPage('cleaner');
    let state = useSettingsStore.getState();
    assert.strictEqual(state.lastPage, 'cleaner');

    setLastPage('tweaks');
    state = useSettingsStore.getState();
    assert.strictEqual(state.lastPage, 'tweaks');
});
