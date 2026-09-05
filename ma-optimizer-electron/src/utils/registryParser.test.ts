import { test } from 'node:test';
import assert from 'node:assert';
import { parseRegQueryOutput } from './registryParser.ts';

test('parseRegQueryOutput - DWORD values with hex prefix', () => {
    const output = `
HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl
    Win32PrioritySeparation    REG_DWORD    0x1a
`;
    const result = parseRegQueryOutput(output);
    assert.deepStrictEqual(result, { type: 'REG_DWORD', value: 26 });
});

test('parseRegQueryOutput - DWORD zero value', () => {
    const output = `
HKEY_CURRENT_USER\\Control Panel\\Desktop
    MinAnimate    REG_DWORD    0x0
`;
    const result = parseRegQueryOutput(output);
    assert.deepStrictEqual(result, { type: 'REG_DWORD', value: 0 });
});

test('parseRegQueryOutput - String value', () => {
    const output = `
HKEY_CURRENT_USER\\Control Panel\\Desktop
    MenuShowDelay    REG_SZ    400
`;
    const result = parseRegQueryOutput(output);
    assert.deepStrictEqual(result, { type: 'REG_SZ', value: '400' });
});

test('parseRegQueryOutput - Default value (/ve)', () => {
    const output = `
HKEY_CURRENT_USER\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32
    (Default)    REG_SZ    Classic
`;
    const result = parseRegQueryOutput(output);
    assert.deepStrictEqual(result, { type: 'REG_SZ', value: 'Classic' });
});

test('parseRegQueryOutput - Default value not set', () => {
    const output = `
HKEY_CURRENT_USER\\Software\\Classes
    (Default)    REG_SZ    (value not set)
`;
    const result = parseRegQueryOutput(output);
    assert.strictEqual(result, null);
});

test('parseRegQueryOutput - Empty or non-matching output', () => {
    assert.strictEqual(parseRegQueryOutput(''), null);
    assert.strictEqual(parseRegQueryOutput('ERROR: The system was unable to find the specified registry key or value.'), null);
});
