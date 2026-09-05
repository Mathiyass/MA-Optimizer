export function parseRegQueryOutput(stdout: string): { type: string; value: any } | null {
    if (!stdout) return null
    const lines = stdout.split(/\r?\n/)
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('HKEY_')) continue
        // Match: [optional name or (Default)] REG_TYPE [optional value]
        const match = trimmed.match(/^(?:(\(Default\)|[^\t]+?)\s+)?(REG_[A-Z_]+)(?:\s+(.*))?$/i)
        if (match) {
            const regType = match[2].toUpperCase()
            const rawVal = match[3] !== undefined ? match[3].trim() : ''
            if (rawVal === '(value not set)') {
                return null
            }
            if (regType === 'REG_DWORD' || regType === 'REG_QWORD') {
                const parsed = parseInt(rawVal, rawVal.startsWith('0x') ? 16 : 10)
                return { type: regType, value: isNaN(parsed) ? 0 : parsed }
            } else {
                return { type: regType, value: rawVal }
            }
        }
    }
    return null
}
