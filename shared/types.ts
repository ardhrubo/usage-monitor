type UsageRecordType = 'app' | 'website';

interface UsageRecord {
  id: string;
  type: UsageRecordType;
  name: string;
  url?: string;
  domain?: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
  isProductive?: boolean;
}

interface AppUsageRecord {
  id: string;
  type: 'app';
  name: string;
  windowTitle?: string;
  pid?: number;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
  isProductive?: boolean;
}

interface WebUsageRecord {
  id: string;
  type: 'website';
  name: string;
  url: string;
  domain: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
  isProductive?: boolean;
  title?: string;
}

export type { UsageRecord, AppUsageRecord, WebUsageRecord };
export { UsageRecordType };
