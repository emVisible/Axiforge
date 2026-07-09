const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    let port = process.env.NEXUS_DEV_PORT || "5274";
    try {
      const fromFile = require("node:fs")
        .readFileSync(path.join(__dirname, "../.dev-port"), "utf8")
        .trim();
      if (fromFile) port = fromFile;
    } catch {
      /* dev.mjs 未写入时回退环境变量 */
    }
    win.loadURL(`http://localhost:${port}`);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle("nexus:get-version", () => app.getVersion());

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
