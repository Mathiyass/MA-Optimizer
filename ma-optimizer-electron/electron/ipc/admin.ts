import { ipcMain, app } from 'electron'
import { execSync } from 'child_process'

function checkIsAdmin(): boolean {
    try {
        execSync('net session', { stdio: 'ignore', timeout: 5000 })
        return true
    } catch {
        return false
    }
}

ipcMain.handle('admin:isAdmin', () => checkIsAdmin())

ipcMain.on('admin:relaunch', () => {
    const { shell } = require('electron')
    shell.openExternal(`file://${app.getPath('exe')}`)
    app.quit()
})

export { checkIsAdmin }
