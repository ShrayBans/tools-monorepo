import todesktop from "@todesktop/runtime"
import { app, BrowserWindow, ipcMain } from "electron"
import fs from "fs"
import os from "os"
import path from "path"

todesktop.init() // must run first
const isDev = !app.isPackaged

// IPC handlers for file system access
ipcMain.handle('read-claude-config', async () => {
  try {
    const claudeConfigPath = path.join(os.homedir(), '.claude.json')
    const fileContents = await fs.promises.readFile(claudeConfigPath, 'utf8')
    return { success: true, data: JSON.parse(fileContents) }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(process.cwd(), 'electron-preload.js'), // Add preload script
    },
    icon: './icon.png', // Will be created in next step
    show: false, // Don't show until ready
  })

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show()
  })

  if (isDev) {
    win.loadURL('http://localhost:5173') // Vite dev server
    // Optional: Open DevTools in development
    win.webContents.openDevTools()
  } else {
    win.loadFile('dist/index.html') // after vite build
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})