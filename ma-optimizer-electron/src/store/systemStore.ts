import { create } from 'zustand'

interface SystemStore {
    cpu: number
    cpuCores: number[]
    ram: { total: number; used: number; free: number; percent: number }
    disk: { readPerSec: number; writePerSec: number }
    network: { rxSec: number; txSec: number }
    updateCpu: (val: number, cores?: number[]) => void
    updateRam: (data: SystemStore['ram']) => void
    updateDisk: (data: SystemStore['disk']) => void
    updateNetwork: (data: SystemStore['network']) => void
}

export const useSystemStore = create<SystemStore>((set) => ({
    cpu: 0,
    cpuCores: [],
    ram: { total: 0, used: 0, free: 0, percent: 0 },
    disk: { readPerSec: 0, writePerSec: 0 },
    network: { rxSec: 0, txSec: 0 },
    updateCpu: (val, cores) => set({ cpu: val, cpuCores: cores || [] }),
    updateRam: (data) => set({ ram: data }),
    updateDisk: (data) => set({ disk: data }),
    updateNetwork: (data) => set({ network: data }),
}))
