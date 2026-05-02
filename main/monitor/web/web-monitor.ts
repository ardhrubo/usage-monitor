import { DatabaseService } from '@main/database/db-service';
import { UsageRecordType } from '@shared/types';

interface WebSiteInfo {
  url: string;
  title: string;
  startTime: number;
}

export class WebMonitor {
  private db: DatabaseService;
  private activeSite: WebSiteInfo | null = null;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  startMonitoring() {
    console.log('Starting web monitoring');
    console.log('Web monitor started - placeholder');
  }

  trackUrl(url: string, title: string) {
    const domain = this.extractDomain(url);

    if (this.activeSite) {
      const duration = Date.now() - this.activeSite.startTime;
      this.db.insertWebUsage({
        type: UsageRecordType.Web,
        name: this.activeSite.title || this.activeSite.url,
        url: this.activeSite.url,
        domain: this.extractDomain(this.activeSite.url),
        startTime: this.activeSite.startTime,
        endTime: Date.now(),
        timestamp: Date.now(),
        isProductive: this.isProductiveSite(this.activeSite.url),
        title: this.activeSite.title,
      });
    }

    this.activeSite = {
      url,
      title,
      startTime: Date.now(),
    };
  }

  private extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  private isProductiveSite(url: string): boolean {
    const productiveDomains = [
      'github.com', 'stackoverflow.com', 'stackoverflow.co', 'gitlab.com',
      'bitbucket.org', 'vscode.dev', 'code.visualstudio.com',
      'developer.mozilla.org', 'docs.microsoft.com', 'docs.python.org',
      'www.typescriptlang.org', 'nodejs.org', 'npmjs.com', 'webpack.js.org',
      'react.dev', 'angular.io', 'vuejs.org', 'tailwindcss.com',
      'figma.com', 'adobe.com', 'dribbble.com', 'dhl.com', 'ups.com',
      'fedex.com', 'postman.com', 'insomnia.rest', 'curl.se',
    ];

    return productiveDomains.some((domain) => url.includes(domain));
  }

  stopMonitoring() {
    if (this.activeSite) {
      this.db.insertWebUsage({
        type: UsageRecordType.Web,
        name: this.activeSite.title || this.activeSite.url,
        url: this.activeSite.url,
        domain: this.extractDomain(this.activeSite.url),
        startTime: this.activeSite.startTime,
        endTime: Date.now(),
        timestamp: Date.now(),
        isProductive: this.isProductiveSite(this.activeSite.url),
        title: this.activeSite.title,
      });
    }
  }
}
