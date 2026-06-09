const { contextBridge, ipcRenderer } = require('electron')

// Expose a small, safe API surface to the renderer.
contextBridge.exposeInMainWorld('angkorKey', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  saveFile: (defaultName, content) => ipcRenderer.invoke('save-file', { defaultName, content }),
  writeId3: (filePath, tags) => ipcRenderer.invoke('write-id3', { filePath, tags }),
})
