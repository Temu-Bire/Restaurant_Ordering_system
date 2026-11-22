import { ReportFilterDto } from '../dto/report-filter.dto.js';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ChartBucketRange {
  chartTitle: string;
  labels: string[];
  start: Date;
  end: Date;
  previousStart: Date;
  buckets: { start: Date; end: Date }[];
}

export function getDateRange(filters?: ReportFilterDto, referenceDate: Date = new Date()): DateRange {
  const period = filters?.period ?? 'week';

  if (period === 'custom' && filters?.startDate) {
    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = filters.endDate ? new Date(filters.endDate) : new Date(referenceDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'today' || period === 'daily') {
    return getTodayRange(referenceDate);
  }

  if (period === 'yesterday') {
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'month' || period === 'monthly') {
    const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'year') {
    const start = new Date(referenceDate.getFullYear(), 0, 1);
    const end = new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  // Default: 'week' or 'weekly' (past 7 days from Monday or today)
  const start = new Date(referenceDate);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function getTodayRange(now: Date = new Date()): DateRange {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getWeekDaysRange(now: Date = new Date()): ChartBucketRange {
  const start = new Date(now);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - 7);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return {
    chartTitle: 'Revenue by Day (ETB)',
    labels,
    start,
    end,
    previousStart,
    buckets: labels.map((_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + index);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      return { start: bucketStart, end: bucketEnd };
    }),
  };
}

export function getMonthWeeksRange(now: Date = new Date()): ChartBucketRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const buckets: { start: Date; end: Date }[] = [];
  const cursor = new Date(start);
  let index = 1;
  const labels: string[] = [];

  while (cursor < end) {
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + 7);
    buckets.push({ start: new Date(cursor), end: bucketEnd > end ? end : bucketEnd });
    labels.push(`Week ${index++}`);
    cursor.setDate(cursor.getDate() + 7);
  }

  return {
    chartTitle: 'Revenue by Week (ETB)',
    labels,
    start,
    end,
    previousStart,
    buckets,
  };
}

export function getPeriodRange(period: 'daily' | 'weekly' | 'monthly' = 'daily', now: Date = new Date()): ChartBucketRange {
  if (period === 'monthly') return getMonthWeeksRange(now);
  return getWeekDaysRange(now);
}
