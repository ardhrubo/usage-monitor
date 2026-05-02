import { DatabaseService } from '@main/database/db-service';
import { UsageRecordType } from '@shared/types';

export class AppMonitor {
  private db: DatabaseService;
  private activeApp: {
    name: string;
    startTime: number;
    windowTitle?: string;
    pid?: number;
  } | null = null;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  startMonitoring() {
    console.log(`Starting app monitoring on ${process.platform}`);

    switch (process.platform) {
      case 'win32':
        this.setupWindowsMonitor();
        break;
      case 'darwin':
        this.setupMacMonitor();
        break;
      case 'linux':
        this.setupLinuxMonitor();
        break;
      default:
        console.error(`Platform ${process.platform} not supported`);
    }
  }

  private async switchApp(newAppName: string, newWindowTitle?: string, newPid?: number) {
    if (this.activeApp) {
      const duration = Date.now() - this.activeApp.startTime;
      await this.db.insertAppUsage({
        type: UsageRecordType.App,
        name: this.activeApp.name,
        windowTitle: this.activeApp.windowTitle,
        pid: this.activeApp.pid,
        startTime: this.activeApp.startTime,
        endTime: Date.now(),
        timestamp: Date.now(),
        isProductive: this.isProductiveApp(this.activeApp.name),
      });
    }

    this.activeApp = {
      name: newAppName,
      startTime: Date.now(),
      windowTitle: newWindowTitle,
      pid: newPid,
    };
  }

  private isProductiveApp(appName: string): boolean {
    const productiveApps = [
      'code', 'vscode', 'intellij', 'webstorm', 'pycharm', 'cursor',
      'sublime', 'vim', 'emacs', 'gitkraken', 'github', 'terminal',
      'powershell', 'cmd', 'docker', 'postman', 'figma', 'photoshop',
      'illustrator', 'blender', 'inkscape', 'gimp', 'android-studio',
      'xcode', 'eclipse', 'netbeans', 'atom', 'sublime-text', 'nova',
      'vscodium', 'jetbrains', 'visual-studio', 'monodevelop',
    ];

    const lowerName = appName.toLowerCase();
    return productiveApps.some((app) => lowerName.includes(app));
  }

  private setupWindowsMonitor() {
    console.log('Windows monitor setup - placeholder');
  }

  private setupMacMonitor() {
    console.log('macOS monitor setup - placeholder');
  }

  private setupLinuxMonitor() {
    console.log('Linux monitor setup - placeholder');
  }

  stopMonitoring() {
    if (this.activeApp) {
      this.db.insertAppUsage({
        type: UsageRecordType.App,
        name: this.activeApp.name,
        windowTitle: this.activeApp.windowTitle,
        pid: this.activeApp.pid,
        startTime: this.activeApp.startTime,
        endTime: Date.now(),
        timestamp: Date.now(),
        isProductive: this.isProductiveApp(this.activeApp.name),
      });
    }
  }
}
