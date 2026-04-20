import { test } from 'node:test';
import assert from 'node:assert';
import { useSystemStore } from './systemStore.ts';

const initialState = {
    cpu: 0,
    cpuCores: [],
    ram: { total: 0, used: 0, free: 0, percent: 0 },
    disk: { readPerSec: 0, writePerSec: 0 },
    network: { rxSec: 0, txSec: 0 },
};

test('systemStore - initial state', () => {
    // Reset state before test
    useSystemStore.setState(initialState);
    const state = useSystemStore.getState();
    assert.strictEqual(state.cpu, 0);
    assert.deepStrictEqual(state.cpuCores, []);
    assert.deepStrictEqual(state.ram, { total: 0, used: 0, free: 0, percent: 0 });
    assert.deepStrictEqual(state.disk, { readPerSec: 0, writePerSec: 0 });
    assert.deepStrictEqual(state.network, { rxSec: 0, txSec: 0 });
});

test('systemStore - updateCpu', () => {
    useSystemStore.setState(initialState);
    const { updateCpu } = useSystemStore.getState();

    // Update with cores
    updateCpu(50, [10, 20, 30, 40]);
    let state = useSystemStore.getState();
    assert.strictEqual(state.cpu, 50);
    assert.deepStrictEqual(state.cpuCores, [10, 20, 30, 40]);

    // Update without cores (should default to [])
    updateCpu(25);
    state = useSystemStore.getState();
    assert.strictEqual(state.cpu, 25);
    assert.deepStrictEqual(state.cpuCores, []);
});

test('systemStore - updateRam', () => {
    useSystemStore.setState(initialState);
    const { updateRam } = useSystemStore.getState();
    const ramData = { total: 16384, used: 8192, free: 8192, percent: 50 };

    updateRam(ramData);
    const state = useSystemStore.getState();
    assert.deepStrictEqual(state.ram, ramData);
});

test('systemStore - updateDisk', () => {
    useSystemStore.setState(initialState);
    const { updateDisk } = useSystemStore.getState();
    const diskData = { readPerSec: 100, writePerSec: 50 };

    updateDisk(diskData);
    const state = useSystemStore.getState();
    assert.deepStrictEqual(state.disk, diskData);
});

test('systemStore - updateNetwork', () => {
    useSystemStore.setState(initialState);
    const { updateNetwork } = useSystemStore.getState();
    const networkData = { rxSec: 1000, txSec: 500 };

    updateNetwork(networkData);
    const state = useSystemStore.getState();
    assert.deepStrictEqual(state.network, networkData);
});
