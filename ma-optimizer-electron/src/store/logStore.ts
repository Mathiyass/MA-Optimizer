import { create } from 'zustand'

interface LogLine {
    id: number
    text: string
    timestamp: string
}

interface LogStore {
    lines: LogLine[]
    nextId: number
    addLine: (text: string) => void
    clear: () => void
}

function getTimestamp(): string {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

export const useLogStore = create<LogStore>((set) => ({
    lines: [],
    nextId: 1,
    addLine: (text) =>
        set((s) => {
            const newLines = [...s.lines, { id: s.nextId, text, timestamp: getTimestamp() }]
            // Keep last 1000 lines
            return {
                lines: newLines.slice(-1000),
                nextId: s.nextId + 1,
            }
        }),
    clear: () => set({ lines: [], nextId: 1 }),
}))
