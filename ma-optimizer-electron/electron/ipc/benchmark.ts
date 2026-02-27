import { ipcMain } from 'electron'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { sendLog } from './logger'

function formatScore(ms: number, baseline: number): number {
    return Math.round((baseline / ms) * 1000)
}

// CPU Benchmark — prime number calculation
ipcMain.handle('benchmark:cpu', async () => {
    sendLog('[Benchmark] Starting CPU benchmark...')

    // Single-thread: calculate primes up to 500,000
    const singleStart = performance.now()
    let primeCount = 0
    for (let n = 2; n < 500000; n++) {
        let isPrime = true
        for (let i = 2; i * i <= n; i++) {
            if (n % i === 0) { isPrime = false; break }
        }
        if (isPrime) primeCount++
    }
    const singleTime = performance.now() - singleStart

    // Multi-thread simulation: heavier computation
    const multiStart = performance.now()
    const iterations = 5000000
    let hash = 0
    for (let i = 0; i < iterations; i++) {
        hash = (hash * 131 + i) % 1000000007
    }
    const multiTime = performance.now() - multiStart

    const cpuCount = os.cpus().length
    const singleScore = formatScore(singleTime, 800)
    const multiScore = formatScore(multiTime, 300) * Math.min(cpuCount, 8)

    const result = {
        singleThread: {
            time: Math.round(singleTime),
            score: singleScore,
            primeCount,
        },
        multiThread: {
            time: Math.round(multiTime),
            score: multiScore,
            cores: cpuCount,
        },
        totalScore: singleScore + multiScore,
        timestamp: new Date().toISOString(),
    }

    // Save result
    try {
        const Store = require('electron-store')
        const store = new Store()
        const history = store.get('benchmarkHistory', []) as any[]
        history.push(result)
        store.set('benchmarkHistory', history.slice(-20))
    } catch { }

    sendLog(`[Benchmark] CPU complete — Single: ${singleScore}, Multi: ${multiScore}, Total: ${result.totalScore}`)
    return result
})

// Memory Benchmark — sequential read/write + random access
ipcMain.handle('benchmark:memory', async () => {
    sendLog('[Benchmark] Starting memory benchmark...')

    // Sequential write: fill 256MB buffer
    const bufSize = 256 * 1024 * 1024
    const writeStart = performance.now()
    const buf = Buffer.alloc(bufSize)
    for (let i = 0; i < bufSize; i += 4) {
        buf.writeUInt32LE(i, i)
    }
    const writeTime = performance.now() - writeStart
    const writeMBps = Math.round((bufSize / 1024 / 1024) / (writeTime / 1000))

    // Sequential read
    const readStart = performance.now()
    let readSum = 0
    for (let i = 0; i < bufSize; i += 4) {
        readSum += buf.readUInt32LE(i)
    }
    const readTime = performance.now() - readStart
    const readMBps = Math.round((bufSize / 1024 / 1024) / (readTime / 1000))

    // Random access latency
    const randomStart = performance.now()
    const randomOps = 1000000
    let randomSum = 0
    for (let i = 0; i < randomOps; i++) {
        const offset = (Math.floor(Math.random() * (bufSize / 4))) * 4
        randomSum += buf.readUInt32LE(offset)
    }
    const randomTime = performance.now() - randomStart
    const randomLatencyNs = Math.round((randomTime * 1000000) / randomOps)

    const result = {
        sequentialRead: { mbps: readMBps, time: Math.round(readTime) },
        sequentialWrite: { mbps: writeMBps, time: Math.round(writeTime) },
        randomAccess: { latencyNs: randomLatencyNs, ops: randomOps, time: Math.round(randomTime) },
        totalScore: Math.round((readMBps + writeMBps) / 2 + (1000000 / randomLatencyNs) * 100),
        timestamp: new Date().toISOString(),
    }

    try {
        const Store = require('electron-store')
        const store = new Store()
        const history = store.get('benchmarkHistory', []) as any[]
        history.push({ type: 'memory', ...result })
        store.set('benchmarkHistory', history.slice(-20))
    } catch { }

    sendLog(`[Benchmark] Memory complete — Read: ${readMBps} MB/s, Write: ${writeMBps} MB/s, Latency: ${randomLatencyNs}ns`)
    return result
})

// Disk Benchmark — sequential + 4K random
ipcMain.handle('benchmark:disk', async (_, drive: string) => {
    sendLog(`[Benchmark] Starting disk benchmark on ${drive || 'C:'}...`)

    const testDir = path.join(drive || 'C:', 'MA-Optimizer-Benchmark-Temp')
    const testFile = path.join(testDir, 'bench.dat')
    const fileSize = 512 * 1024 * 1024 // 512MB

    try {
        if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })

        // Sequential write
        const writeData = crypto.randomBytes(1024 * 1024) // 1MB chunk
        const writeStart = performance.now()
        const fd = fs.openSync(testFile, 'w')
        for (let i = 0; i < 512; i++) {
            fs.writeSync(fd, writeData)
        }
        fs.closeSync(fd)
        const writeTime = performance.now() - writeStart
        const seqWriteMBps = Math.round((fileSize / 1024 / 1024) / (writeTime / 1000))

        // Sequential read
        const readStart = performance.now()
        const rdFd = fs.openSync(testFile, 'r')
        const readBuf = Buffer.alloc(1024 * 1024)
        let bytesRead = 0
        while (bytesRead < fileSize) {
            const read = fs.readSync(rdFd, readBuf, 0, readBuf.length, bytesRead)
            if (read === 0) break
            bytesRead += read
        }
        fs.closeSync(rdFd)
        const readTime = performance.now() - readStart
        const seqReadMBps = Math.round((fileSize / 1024 / 1024) / (readTime / 1000))

        // 4K random read
        const randomReadStart = performance.now()
        const randFd = fs.openSync(testFile, 'r')
        const smallBuf = Buffer.alloc(4096)
        let iops = 0
        const maxFileBlocks = Math.floor(fileSize / 4096)
        const testDuration = 3000 // 3 seconds
        while (performance.now() - randomReadStart < testDuration) {
            const offset = Math.floor(Math.random() * maxFileBlocks) * 4096
            fs.readSync(randFd, smallBuf, 0, 4096, offset)
            iops++
        }
        fs.closeSync(randFd)
        const actualDuration = performance.now() - randomReadStart
        const readIOPS = Math.round(iops / (actualDuration / 1000))

        // Cleanup
        try { fs.unlinkSync(testFile) } catch { }
        try { fs.rmdirSync(testDir) } catch { }

        const result = {
            sequentialRead: { mbps: seqReadMBps },
            sequentialWrite: { mbps: seqWriteMBps },
            random4kRead: { iops: readIOPS },
            totalScore: seqReadMBps + seqWriteMBps + Math.round(readIOPS / 10),
            drive: drive || 'C:',
            timestamp: new Date().toISOString(),
        }

        try {
            const Store = require('electron-store')
            const store = new Store()
            const history = store.get('benchmarkHistory', []) as any[]
            history.push({ type: 'disk', ...result })
            store.set('benchmarkHistory', history.slice(-20))
        } catch { }

        sendLog(`[Benchmark] Disk complete — SeqRead: ${seqReadMBps} MB/s, SeqWrite: ${seqWriteMBps} MB/s, 4K IOPS: ${readIOPS}`)
        return result
    } catch (e: any) {
        // Cleanup on error
        try { fs.unlinkSync(testFile) } catch { }
        try { fs.rmdirSync(testDir) } catch { }
        sendLog(`[Benchmark] Disk benchmark failed: ${e.message}`)
        return null
    }
})
