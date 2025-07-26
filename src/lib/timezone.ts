import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { enUS, fr, it, Locale } from 'date-fns/locale';

// Location to timezone mapping
export const LOCATION_TIMEZONES = {
  menton: 'Europe/Paris',
  monaco: 'Europe/Monaco', 
  nice: 'Europe/Paris',
  cannes: 'Europe/Paris',
  antibes: 'Europe/Paris',
  lyon: 'Europe/Paris',
  all_locations: 'Europe/Paris' // Default to Paris timezone
} as const;

export type LocationKey = keyof typeof LOCATION_TIMEZONES;

// Date format constants
export const DATE_FORMATS = {
  FULL_DATETIME: 'dd/MM/yyyy HH:mm',
  DATE_ONLY: 'dd/MM/yyyy',
  TIME_ONLY: 'HH:mm',
  FULL_WITH_SECONDS: 'dd/MM/yyyy HH:mm:ss',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  ITALIAN_DATE: 'dd MMM yyyy'
} as const;

// Get timezone for a location
export const getTimezoneForLocation = (location: string | null | undefined): string => {
  if (!location || location === 'all_locations') {
    return LOCATION_TIMEZONES.all_locations;
  }
  
  const timezone = LOCATION_TIMEZONES[location as LocationKey];
  return timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Get current time for a specific location
export const getCurrentTimeForLocation = (location: string | null | undefined): Date => {
  const timezone = getTimezoneForLocation(location);
  return toZonedTime(new Date(), timezone);
};

// Format date for a specific location and timezone
export const formatDateForLocation = (
  date: Date | string,
  location: string | null | undefined,
  formatString: string = DATE_FORMATS.FULL_DATETIME,
  locale?: Locale
): string => {
  const timezone = getTimezoneForLocation(location);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return formatInTimeZone(dateObj, timezone, formatString, { locale });
  } catch (error) {
    console.error('Error formatting date for location:', error);
    return format(dateObj, formatString, { locale });
  }
};

// Convert local time to UTC for database storage
export const convertLocalToUTC = (
  localDate: Date,
  location: string | null | undefined
): Date => {
  const timezone = getTimezoneForLocation(location);
  try {
    return fromZonedTime(localDate, timezone);
  } catch (error) {
    console.error('Error converting local time to UTC:', error);
    return localDate;
  }
};

// Convert UTC time from database to local time for display
export const convertUTCToLocal = (
  utcDate: Date | string,
  location: string | null | undefined
): Date => {
  const timezone = getTimezoneForLocation(location);
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  try {
    return toZonedTime(dateObj, timezone);
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return dateObj;
  }
};

// Get timestamp for database insertion
export const getLocationTimestamp = (location: string | null | undefined): string => {
  const now = new Date();
  const timezone = getTimezoneForLocation(location);
  
  try {
    return formatInTimeZone(now, timezone, DATE_FORMATS.ISO_DATETIME);
  } catch (error) {
    console.error('Error getting location timestamp:', error);
    return now.toISOString();
  }
};

// Format relative time (e.g., "2 hours ago") for location
export const formatRelativeTimeForLocation = (
  date: Date | string,
  location: string | null | undefined,
  locale: 'en' | 'fr' | 'it' = 'en'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localDate = convertUTCToLocal(dateObj, location);
  const now = getCurrentTimeForLocation(location);
  
  const diffInMinutes = Math.floor((now.getTime() - localDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  // For older dates, show formatted date
  return formatDateForLocation(localDate, location, DATE_FORMATS.DATE_ONLY);
};

// Get locale object for date-fns
export const getDateLocale = (language: 'en' | 'fr' | 'it' = 'en') => {
  const locales = { en: enUS, fr, it };
  return locales[language] || enUS;
};