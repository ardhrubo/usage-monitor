import { DailySummary } from '@shared/types';

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

export const formatTimePercentage = (time: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = ((time / total) * 100).toFixed(1);
  return `${percentage}%`;
};

export const getCategory = (time: number): 'high' | 'medium' | 'low' => {
  const hours = time / (1000 * 60 * 60);
  if (hours > 4) return 'high';
  if (hours > 2) return 'medium';
  return 'low';
};

export const getProductNameivity = (appName: string): 'productive' | 'unproductive' | 'neutral' => {
  const productiveApps = [
    'code', 'vscode', 'intellij', 'webstorm', 'pycharm', 'cursor',
    'sublime', 'vim', 'emacs', 'gitkraken', 'github', 'terminal',
    'powershell', 'cmd', 'docker', 'postman', 'figma', 'photoshop',
    'illustrator', 'blender', 'inkscape', 'gimp', 'android-studio',
    'xcode', 'eclipse', 'netbeans', 'atom', 'sublime-text', 'nova',
    'vscodium', 'jetbrains', 'visual-studio', 'monodevelop',
  ];

  const lowerName = appName.toLowerCase();
  for (const app of productiveApps) {
    if (lowerName.includes(app)) return 'productive';
  }

  const entertainmentApps = [
    'chrome', 'firefox', 'edge', 'safari', 'brave', 'opera',
    'discord', 'slack', 'teams', 'whatsapp', 'telegram',
    'youtube', 'spotify', 'netflix', 'twitch', 'tiktok',
    'instagram', 'facebook', 'twitter', 'linkedin', 'reddit',
    'steam', 'epic', 'origin', 'gog', 'uplay', 'blizzard',
    'game', 'player', 'video', 'movie', 'music',
  ];

  for (const app of entertainmentApps) {
    if (lowerName.includes(app)) return 'unproductive';
  }

  return 'neutral';
};
