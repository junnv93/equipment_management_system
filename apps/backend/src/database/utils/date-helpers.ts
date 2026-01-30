/**
 * Date helper functions for seed data generation
 * Provides consistent date calculations relative to today
 */

/**
 * Get a date N days ago from today
 * @example daysAgo(7) → Date 7 days in the past
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get a date N days in the future from today
 * @example daysLater(30) → Date 30 days from now
 */
export function daysLater(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get a date N months ago from today
 * @example monthsAgo(3) → Date 3 months in the past
 */
export function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get a date N months in the future from today
 * @example monthsLater(6) → Date 6 months from now
 */
export function monthsLater(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get today's date at midnight
 */
export function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get tomorrow's date at midnight
 */
export function tomorrow(): Date {
  return daysLater(1);
}

/**
 * Get yesterday's date at midnight
 */
export function yesterday(): Date {
  return daysAgo(1);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Convert a Date to ISO date string (YYYY-MM-DD)
 * Useful for PostgreSQL date columns
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
