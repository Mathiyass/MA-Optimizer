import { test } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { isDangerousPath } from './cleanerSafety.ts';

test('cleanerSafety - isDangerousPath blocks drive roots', () => {
    assert.strictEqual(isDangerousPath('C:\\'), true);
    assert.strictEqual(isDangerousPath('C:'), true);
    assert.strictEqual(isDangerousPath('D:\\'), true);
    assert.strictEqual(isDangerousPath(''), true);
});

test('cleanerSafety - isDangerousPath blocks critical Windows & system directories', () => {
    assert.strictEqual(isDangerousPath('C:\\Windows'), true);
    assert.strictEqual(isDangerousPath('C:\\Windows\\System32'), true);
    assert.strictEqual(isDangerousPath('C:\\Program Files'), true);
    assert.strictEqual(isDangerousPath('C:\\Program Files (x86)'), true);
});

test('cleanerSafety - isDangerousPath blocks Steam userdata to protect game saves', () => {
    const steamUserdata = path.join('C:\\Program Files (x86)', 'Steam', 'userdata');
    assert.strictEqual(isDangerousPath(steamUserdata), true);
});

test('cleanerSafety - isDangerousPath blocks Firefox roaming profile root', () => {
    const appData = process.env.APPDATA || 'C:\\Users\\User\\AppData\\Roaming';
    const ffRoamingRoot = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
    assert.strictEqual(isDangerousPath(ffRoamingRoot), true);
});

test('cleanerSafety - isDangerousPath permits safe cache subdirectories', () => {
    const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\User\\AppData\\Local';
    const tempDir = path.join(localAppData, 'Temp');
    assert.strictEqual(isDangerousPath(tempDir), false);

    const safeSteamCache = path.join('C:\\Program Files (x86)', 'Steam', 'appcache');
    assert.strictEqual(isDangerousPath(safeSteamCache), false);
});
