import { UsageRecord } from '@shared/types';

export interface DailySummary {
  totalAppTime: number;
  totalWebTime: number;
  totalTime: number;
  appBreakdown: Record<string, number>;
  webBreakdown: Record<string, number>;
}

export interface DashboardData {
  today: DailySummary;
  yesterday: DailySummary;
  last7Days: {
    dates: string[];
    totalTimes: number[];
  };
  topApps: { name: string; time: number }[];
  topWebsites: { name: string; time: number }[];
  productiveHours: number;
  unproductiveHours: number;
}
