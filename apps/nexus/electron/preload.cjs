const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexus", {
  getVersion: () => ipcRenderer.invoke("nexus:get-version"),
});
