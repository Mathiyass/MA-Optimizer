import { BrowserWindow } from 'electron'
import * as winston from 'winston'
import * as path from 'path'
import { app } from 'electron'

const logDir = path.join(app.getPath('userData'), 'logs')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) =>
            `[${timestamp}] [${level.toUpperCase()}] ${message}`
        )
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'ma-optimizer.log'),
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3,
            tailable: true,
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 3,
        }),
    ],
})

if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: winston.format.colorize({ all: true }),
    }))
}

function sendLog(message: string) {
    logger.info(message)
    try {
        const wins = BrowserWindow.getAllWindows()
        if (wins.length > 0) {
            wins[0].webContents.send('log:line', message)
        }
    } catch { }
}

function sendError(message: string) {
    logger.error(message)
    try {
        const wins = BrowserWindow.getAllWindows()
        if (wins.length > 0) {
            wins[0].webContents.send('log:line', `[ERROR] ${message}`)
        }
    } catch { }
}

export { logger, sendLog, sendError }
