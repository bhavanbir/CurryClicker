const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("curryDesktop", {
  readSave: () => ipcRenderer.invoke("save:read"),
  writeSave: (data) => ipcRenderer.invoke("save:write", data),
  unlockAchievement: (id) => ipcRenderer.invoke("steam:achievement", id),
  submitDayScore: (value) => ipcRenderer.invoke("steam:score", value),
  getSteamPlayerName: () => ipcRenderer.invoke("steam:playerName"),
  getServerTime: () => ipcRenderer.invoke("steam:serverTime"),
});
