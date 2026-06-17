import { test } from 'node:test';
import assert from 'node:assert';
import { useLogStore } from './logStore.ts';

test('logStore - initial state', () => {
    useLogStore.getState().clear();
    const state = useLogStore.getState();
    assert.strictEqual(state.lines.length, 0);
    assert.strictEqual(state.nextId, 1);
});

test('logStore - addLine', () => {
    useLogStore.getState().clear();
    const { addLine } = useLogStore.getState();

    addLine('Test log 1');
    let state = useLogStore.getState();
    assert.strictEqual(state.lines.length, 1);
    assert.strictEqual(state.lines[0].text, 'Test log 1');
    assert.strictEqual(state.lines[0].id, 1);
    assert.strictEqual(state.nextId, 2);
    assert.match(state.lines[0].timestamp, /^\d{2}:\d{2}:\d{2}$/);

    addLine('Test log 2');
    state = useLogStore.getState();
    assert.strictEqual(state.lines.length, 2);
    assert.strictEqual(state.lines[1].text, 'Test log 2');
    assert.strictEqual(state.lines[1].id, 2);
    assert.strictEqual(state.nextId, 3);
});

test('logStore - clear', () => {
    const { addLine, clear } = useLogStore.getState();
    addLine('Log to be cleared');
    clear();

    const state = useLogStore.getState();
    assert.strictEqual(state.lines.length, 0);
    assert.strictEqual(state.nextId, 1);
});

test('logStore - 1000 line limit', () => {
    useLogStore.getState().clear();
    const { addLine } = useLogStore.getState();

    // Add 1001 lines
    for (let i = 1; i <= 1001; i++) {
        addLine(`Log ${i}`);
    }

    const state = useLogStore.getState();
    assert.strictEqual(state.lines.length, 1000);
    // Should contain logs from 2 to 1001
    assert.strictEqual(state.lines[0].text, 'Log 2');
    assert.strictEqual(state.lines[999].text, 'Log 1001');
    assert.strictEqual(state.nextId, 1002);
});
