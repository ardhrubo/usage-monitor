import { ipcRenderer } from 'electron';

export const getDailySummary = async (date: number): Promise<any> => {
  return await ipcRenderer.invoke('get-daily-summary', date);
};

export const getRecentUsage = async (limit: number = 100): Promise<any[]> => {
  return await ipcRenderer.invoke('get-recent-usage', limit);
};

export const exportToCSV = async (): Promise<string> => {
  return await ipcRenderer.invoke('export-csv');
};

export const trackWebsite = async (url: string, title: string): Promise<void> => {
  await ipcRenderer.invoke('track-website', { url, title });
};

export const startBackend = async (): Promise<void> => {
  await ipcRenderer.invoke('start-backend');
};

export const stopBackend = async (): Promise<void> => {
  await ipcRenderer.invoke('stop-backend');
};
