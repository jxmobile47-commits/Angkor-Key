const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !!process.env.ELECTRON_START_URL
let mainWindow = null

// --- IPC: save a text file (e.g. Rekordbox XML) via a save dialog ---
ipcMain.handle('save-file', async (_e, { defaultName, content }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'export.xml',
    filters: [{ name: 'XML', extensions: ['xml'] }, { name: 'All Files', extensions: ['*'] }],
  })
  if (canceled || !filePath) return { ok: false, canceled: true }
  fs.writeFileSync(filePath, content, 'utf8')
  return { ok: true, filePath }
})

// --- IPC: write ID3 tags into an MP3 file (Serato/standard) ---
ipcMain.handle('write-id3', async (_e, { filePath, tags }) => {
  if (!filePath) return { ok: false, error: 'No file path (track must be imported from disk).' }
  try {
    const NodeID3 = require('node-id3')
    const ok = NodeID3.update(
      {
        initialKey: tags.key || undefined, // TKEY
        bpm: tags.bpm ? String(Math.round(tags.bpm)) : undefined, // TBPM
        comment: tags.comment ? { language: 'eng', text: tags.comment } : undefined,
        ...(tags.artist ? { artist: tags.artist } : {}),
        ...(tags.title ? { title: tags.title } : {}),
      },
      filePath
    )
    return { ok: ok === true, filePath }
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) }
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0b0f17',
    title: 'Angkor Key',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Minimal application menu (keeps standard shortcuts like Copy/Paste, Reload, Quit)
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
