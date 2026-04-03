import { exec, spawn, spawnSync, SpawnSyncOptionsWithEncoding } from 'child_process'
import { promisify } from 'util'

export const execPromise = promisify(exec)

export function spawnSyncChecked(cmd: string, args: string[], options: SpawnSyncOptionsWithEncoding<string> = { encoding: 'utf-8' }): { stdout: string, stderr: string } {
    const result = spawnSync(cmd, args, { ...options, windowsHide: true })
    if (result.status !== 0 && result.status !== null) {
        throw new Error(`Process ${cmd} exited with code ${result.status}\n${result.stderr || ''}`)
    }
    if (result.error) {
        throw result.error
    }
    return { stdout: result.stdout || '', stderr: result.stderr || '' }
}

export function spawnPromise(cmd: string, args: string[], options: any = {}): Promise<{ stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { ...options, windowsHide: true })
        let stdout = ''
        let stderr = ''
        proc.stdout?.on('data', (d) => stdout += d.toString())
        proc.stderr?.on('data', (d) => stderr += d.toString())
        proc.on('close', (code) => {
            if (code === 0) resolve({ stdout, stderr })
            else reject(new Error(`Process exited with code ${code}\n${stderr}`))
        })
        proc.on('error', reject)
    })
}

export const escapePS = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.replace(/'/g, "''");
};
