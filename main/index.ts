import { DatabaseService } from '@main/database/db-service';
import { AppMonitor } from '@main/monitor/app/app-monitor';
import { WebMonitor } from '@main/monitor/web/web-monitor';

import { app, BrowserWindow, ipcMain } from 'electron';
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

  ipcMain.handle('get-daily-summary', async (event, date) => {
    try {
      const summary = await db.getDailySummary(date);
      return summary;
    } catch (err) {
      console.error('Error getting daily summary:', err);
      throw err;
    }
  });

  ipcMain.handle('get-recent-usage', async (event, limit: number) => {
    try {
      const usage = await db.getRecentUsage(limit);
      return usage;
    } catch (err) {
      console.error('Error getting recent usage:', err);
      throw err;
    }
  });

  ipcMain.handle('export-csv', async () => {
    try {
      const csv = await db.exportToCSV();
      return csv;
    } catch (err) {
      console.error('Error exporting CSV:', err);
      throw err;
    }
  });

  ipcMain.handle('track-website', async (event, { url, title }) => {
    try {
      webMonitor.trackUrl(url, title);
    } catch (err) {
      console.error('Error tracking website:', err);
      throw err;
    }
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
