import { exec } from 'child_process'
import { promisify } from 'util'

export const execPromise = promisify(exec)

export const escapePS = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.replace(/'/g, "''");
};
