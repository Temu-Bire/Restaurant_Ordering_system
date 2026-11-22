import { describe, expect, it } from 'vitest';
import {
  getDateRange,
  getMonthWeeksRange,
  getPeriodRange,
  getTodayRange,
  getWeekDaysRange,
} from './date-range.helper.js';

describe('DateRangeHelper', () => {
  const fixedNow = new Date('2026-11-18T14:30:00.000Z'); // Wednesday

  describe('getTodayRange', () => {
    it('should return start at 00:00:00 and end at 23:59:59', () => {
      const { start, end } = getTodayRange(fixedNow);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });
  });

  describe('getDateRange', () => {
    it('should calculate today / daily range', () => {
      const range = getDateRange({ period: 'today' }, fixedNow);
      expect(range.start.getDate()).toBe(fixedNow.getDate());
    });

    it('should calculate yesterday range', () => {
      const range = getDateRange({ period: 'yesterday' }, fixedNow);
      expect(range.start.getDate()).toBe(fixedNow.getDate() - 1);
    });

    it('should calculate custom range with boundary times', () => {
      const range = getDateRange(
        { period: 'custom', startDate: '2026-11-01T00:00:00', endDate: '2026-11-10T23:59:59' },
        fixedNow,
      );
      expect(range.start.getFullYear()).toBe(2026);
      expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    });
  });

  describe('getWeekDaysRange & getMonthWeeksRange', () => {
    it('should generate 7 day buckets for weekly chart', () => {
      const chartRange = getWeekDaysRange(fixedNow);
      expect(chartRange.labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      expect(chartRange.buckets).toHaveLength(7);
      expect(chartRange.previousStart.getTime()).toBeLessThan(chartRange.start.getTime());
    });

    it('should generate week buckets for monthly chart', () => {
      const chartRange = getMonthWeeksRange(fixedNow);
      expect(chartRange.chartTitle).toContain('Revenue by Week');
      expect(chartRange.labels.length).toBeGreaterThanOrEqual(4);
    });

    it('should return correct range for daily and monthly periods via getPeriodRange', () => {
      const daily = getPeriodRange('daily', fixedNow);
      expect(daily.labels).toHaveLength(7);

      const monthly = getPeriodRange('monthly', fixedNow);
      expect(monthly.chartTitle).toContain('Revenue by Week');
    });
  });
});
