import { exec, spawn, spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process'
import { promisify } from 'util'

export const execPromise = promisify(exec)

export function spawnSyncChecked(cmd: string, args: string[], options: SpawnSyncOptionsWithStringEncoding = { encoding: 'utf-8' }): { stdout: string, stderr: string } {
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
    const maxBuffer = options.maxBuffer || 10 * 1024 * 1024; // 10MB default
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { ...options, windowsHide: true, shell: false })
        let stdout = ''
        let stderr = ''
        let totalSize = 0

        proc.stdout?.on('data', (d: Buffer) => {
            totalSize += d.length
            if (totalSize > maxBuffer) {
                proc.kill()
                reject(new Error(`Process ${cmd} exceeded maxBuffer (${maxBuffer} bytes)`))
            }
            stdout += d.toString()
        })
        proc.stderr?.on('data', (d: Buffer) => {
            stderr += d.toString()
        })
        proc.on('close', (code) => {
            if (code === 0) resolve({ stdout, stderr })
            else reject(new Error(`Process exited with code ${code}\n${stderr}`))
        })
        proc.on('error', (err: Error) => reject(err))
    })
}

export const escapePS = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.replace(/'/g, "''");
};
