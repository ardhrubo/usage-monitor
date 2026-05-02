import { createConnection, Browser } from 'sqlite3';
import { UsageRecord, AppUsageRecord, WebUsageRecord, UsageRecordType } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/usage.db');

export class DatabaseService {
  private db: Browser;

  constructor() {
    this.db = new createConnection(DB_PATH);
    this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `CREATE TABLE IF NOT EXISTS usage_records (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            url TEXT,
            domain TEXT,
            window_title TEXT,
            pid INTEGER,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            is_productive INTEGER
          )`
        );

        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_timestamp ON usage_records(timestamp)`
        );

        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_type ON usage_records(type)`
        );

        resolve();
      });
    });
  }

  async insertAppUsage(record: Omit<AppUsageRecord, 'id' | 'duration'>): Promise<string> {
    const id = uuidv4();
    const duration = record.endTime - record.startTime;

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO usage_records (id, type, name, window_title, pid, start_time, end_time, duration, timestamp, is_productive) 
         VALUES (?, 'app', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, record.name, record.windowTitle, record.pid, record.startTime, record.endTime, duration, record.timestamp, record.isProductive ? 1 : 0],
        (err) => {
          if (err) return reject(err);
          resolve(id);
        }
      );
    });
  }

  async insertWebUsage(record: Omit<WebUsageRecord, 'id' | 'duration'>): Promise<string> {
    const id = uuidv4();
    const duration = record.endTime - record.startTime;

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO usage_records (id, type, name, url, domain, start_time, end_time, duration, timestamp, is_productive) 
         VALUES (?, 'website', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, record.name, record.url, record.domain, record.startTime, record.endTime, duration, record.timestamp, record.isProductive ? 1 : 0],
        (err) => {
          if (err) return reject(err);
          resolve(id);
        }
      );
    });
  }

  async getUsageByDateRange(startDate: number, endDate: number): Promise<UsageRecord[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM usage_records 
         WHERE timestamp >= ? AND timestamp <= ? 
         ORDER BY timestamp DESC`,
        [startDate, endDate],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows as unknown as UsageRecord[]);
        }
      );
    });
  }

  async getDailySummary(date: number): Promise<{
    totalAppTime: number;
    totalWebTime: number;
    totalTime: number;
    appBreakdown: Record<string, number>;
    webBreakdown: Record<string, number>;
  }> {
    return new Promise((resolve, reject) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const query = `
        SELECT type, name, SUM(duration) as total_duration
        FROM usage_records
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY type, name
      `;

      this.db.all(query, [startOfDay.getTime(), endOfDay.getTime()], (err, rows) => {
        if (err) return reject(err);

        const result = {
          totalAppTime: 0,
          totalWebTime: 0,
          totalTime: 0,
          appBreakdown: {} as Record<string, number>,
          webBreakdown: {} as Record<string, number>,
        };

        for (const row of rows as any[]) {
          const duration = row.total_duration;
          if (row.type === 'app') {
            result.totalAppTime += duration;
            result.appBreakdown[row.name] = duration;
          } else if (row.type === 'website') {
            result.totalWebTime += duration;
            result.webBreakdown[row.name] = duration;
          }
          result.totalTime += duration;
        }

        resolve(result);
      });
    });
  }

  async getRecentUsage(limit: number = 100): Promise<UsageRecord[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM usage_records ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows as unknown as UsageRecord[]);
        }
      );
    });
  }

  async exportToCSV(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM usage_records ORDER BY timestamp DESC`,
        [],
        (err, rows) => {
          if (err) return reject(err);

          const headers = [
            'ID',
            'Type',
            'Name',
            'URL',
            'Domain',
            'StartTime',
            'EndTime',
            'Duration',
            'Timestamp',
            'IsProductive',
          ];

          const csvRows = [headers.join(',')];
          for (const row of rows as any[]) {
            csvRows.push(
              [
                row.id,
                row.type,
                `"${row.name}"`,
                `"${row.url || ''}"`,
                `"${row.domain || ''}"`,
                new Date(row.start_time).toISOString(),
                new Date(row.end_time).toISOString(),
                `${row.duration}ms`,
                new Date(row.timestamp).toISOString(),
                row.is_productive ? 'Yes' : 'No',
              ].join(',')
            );
          }

          resolve(csvRows.join('\n'));
        }
      );
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
