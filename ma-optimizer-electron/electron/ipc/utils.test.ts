import { test } from 'node:test';
import assert from 'node:assert';
import { escapePS } from './utils.ts';

test('escapePS - should escape single quotes', () => {
    assert.strictEqual(escapePS("normal string"), "normal string");
    assert.strictEqual(escapePS("it's a test"), "it''s a test");
    assert.strictEqual(escapePS("''"), "''''");
    assert.strictEqual(escapePS(null), "");
    assert.strictEqual(escapePS(undefined), "");
    assert.strictEqual(escapePS(123), "123");
});
