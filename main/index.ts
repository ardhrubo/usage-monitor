import { DatabaseService } from '@main/database/db-service';
import { AppMonitor } from '@main/monitor/app/app-monitor';
import { WebMonitor } from '@main/monitor/web/web-monitor';

import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let win: BrowserWindow | null = null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e',
  });

  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  }
}

async function main() {
  const db = new DatabaseService();
  const appMonitor = new AppMonitor(db);
  const webMonitor = new WebMonitor(db);

  appMonitor.startMonitoring();
  webMonitor.startMonitoring();

  await app.whenReady();

  await createWindow();

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('app-ready', {
      timestamp: Date.now(),
    });
  });

  app.on('window-all-closed', async () => {
    appMonitor.stopMonitoring();
    webMonitor.stopMonitoring();
    await db.close();

    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
}

main().catch((err) => {
  console.error('Failed to initialize app:', err);
  app.quit();
});
