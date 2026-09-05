import * as path from 'path';

export function isDangerousPath(dirPath: string): boolean {
    if (!dirPath || typeof dirPath !== 'string' || !dirPath.trim()) return true;
    const trimmed = dirPath.trim();
    // Block drive roots like C:, C:\, D:, D:\
    if (/^[a-zA-Z]:\\?$/.test(trimmed)) return true;

    const normalized = path.resolve(trimmed).toLowerCase();
    const root = path.parse(normalized).root.toLowerCase();
    if (normalized === root || normalized.length <= 3) return true;

    const userProfile = (process.env.USERPROFILE || '').toLowerCase();
    const appData = (process.env.APPDATA || '').toLowerCase();
    const localAppData = (process.env.LOCALAPPDATA || '').toLowerCase();
    const winDir = (process.env.WINDIR || 'c:\\windows').toLowerCase();
    const progFiles = (process.env.PROGRAMFILES || 'c:\\program files').toLowerCase();
    const progFilesX86 = (process.env['PROGRAMFILES(X86)'] || 'c:\\program files (x86)').toLowerCase();

    const blockedRoots = [
        'c:\\', 'd:\\', 'e:\\',
        winDir,
        path.join(winDir, 'system32').toLowerCase(),
        progFiles,
        progFilesX86,
        userProfile,
        appData,
        localAppData,
        path.join(appData, 'mozilla', 'firefox', 'profiles').toLowerCase(),
        path.join(progFilesX86, 'steam', 'userdata').toLowerCase(),
        path.join(progFiles, 'steam', 'userdata').toLowerCase()
    ];

    if (blockedRoots.some(b => b && normalized === b)) {
        return true;
    }
    return false;
}
