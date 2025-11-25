export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(input: string | number): string {
  // If it's a timestamp
  if (typeof input === 'number') {
    const date = new Date(input);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // If it's a time string (e.g., "14:30")
  const [hours, minutes] = input.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDateTime(dateString: string, timeString: string): string {
  return `${formatDate(dateString)} at ${formatTime(timeString)}`;
}

export function getTodayDate(): string {
  const today = new Date();
  // Ensure we get local date string YYYY-MM-DD
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMaxDate(): string {
  return getTodayDate();
}

export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getMaxTime(date: string): string | undefined {
  const today = getTodayDate();
  if (date === today) {
    return getCurrentTime();
  }
  return undefined;
}

export function getTimezone(): string {
  const date = new Date();
  // getTimezoneOffset returns the difference in minutes between UTC and Local Time.
  // Positive values are west of UTC, negative values are east of UTC.
  // e.g., IST is -330. NY is 300.
  const timezoneOffset = date.getTimezoneOffset();
  
  // We want to invert this for ISO 8601 format (e.g. IST should be +05:30)
  const offset = -timezoneOffset;
  
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const offsetHours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const offsetMinutes = (absOffset % 60).toString().padStart(2, '0');
  
  return `${sign}${offsetHours}:${offsetMinutes}`;
}

export function formatDateTimeWithTZ(date: Date): string {
  const tzOffset = getTimezone();
  const isoString = date.toISOString().slice(0, -1); // Remove 'Z' at the end
  return `${isoString}${tzOffset}`;
}
