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

// Serato default hot-cue colors (RGB).
const SERATO_COLORS = [
  [0xcc, 0x00, 0x00], [0xcc, 0x44, 0x00], [0xcc, 0x88, 0x00], [0x88, 0xcc, 0x00],
  [0x00, 0xcc, 0x00], [0x00, 0xcc, 0x88], [0x00, 0x88, 0xcc], [0x88, 0x00, 0xcc],
]

// Encode a "Serato Markers2" GEOB payload from cue points.
// Format follows the reverse-engineered Serato spec (pyserato / Holzhaus).
function buildSeratoMarkers2(cues) {
  const chunks = [Buffer.from([0x01, 0x01])] // decoded payload version
  cues.forEach((cue, i) => {
    const color = SERATO_COLORS[i % SERATO_COLORS.length]
    const name = Buffer.from(cue.name || '', 'utf8')
    const body = Buffer.alloc(12 + name.length + 1)
    let o = 0
    body.writeUInt8(0x00, o); o += 1                 // field1
    body.writeUInt8(cue.index & 0xff, o); o += 1      // hotcue index
    body.writeUInt32BE((cue.positionMs >>> 0), o); o += 4 // position (ms)
    body.writeUInt8(0x00, o); o += 1                 // field3
    body.writeUInt8(color[0], o); o += 1             // color R
    body.writeUInt8(color[1], o); o += 1             // color G
    body.writeUInt8(color[2], o); o += 1             // color B
    body.writeUInt8(0x00, o); o += 1                 // field5a
    body.writeUInt8(0x00, o); o += 1                 // field5b
    name.copy(body, o); o += name.length
    body.writeUInt8(0x00, o)                         // name terminator
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length, 0)
    chunks.push(Buffer.from('CUE\x00', 'ascii'), len, body)
  })
  const decoded = Buffer.concat(chunks)
  const b64 = decoded.toString('base64')
  let wrapped = ''
  for (let i = 0; i < b64.length; i += 72) wrapped += b64.slice(i, i + 72) + '\n'
  return Buffer.concat([Buffer.from([0x01, 0x01]), Buffer.from(wrapped, 'ascii')])
}

// --- IPC: write ID3 tags into an MP3 file (Serato/standard) ---
ipcMain.handle('write-id3', async (_e, { filePath, tags }) => {
  if (!filePath) return { ok: false, error: 'No file path (track must be imported from disk).' }
  try {
    const NodeID3 = require('node-id3')
    const tagObj = {
      initialKey: tags.key || undefined, // TKEY
      bpm: tags.bpm ? String(Math.round(tags.bpm)) : undefined, // TBPM
      comment: tags.comment ? { language: 'eng', text: tags.comment } : undefined,
      ...(tags.artist ? { artist: tags.artist } : {}),
      ...(tags.title ? { title: tags.title } : {}),
    }
    if (Array.isArray(tags.seratoCues) && tags.seratoCues.length) {
      tagObj.generalObject = [{
        mimeType: 'application/octet-stream',
        filename: '',
        contentDescription: 'Serato Markers2',
        encapsulatedObject: buildSeratoMarkers2(tags.seratoCues),
      }]
    }
    const ok = NodeID3.update(tagObj, filePath)
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
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
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
