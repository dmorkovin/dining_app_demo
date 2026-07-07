type HoursEntry = { open: string | null; close: string | null; closed: boolean };
type HoursMap = Record<string, HoursEntry> | null;

interface StationOpenResult {
  isOpen: boolean;
  todayHours: string;
  statusLabel: string;
}

function parseTime(timeStr: string, referenceDate: Date): Date {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date(NaN);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  const result = new Date(referenceDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function isStationOpen(hours: HoursMap): StationOpenResult {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const closed: StationOpenResult = {
    isOpen: false,
    todayHours: 'Closed today',
    statusLabel: 'Closed',
  };

  if (!hours) return closed;

  const entry = hours[dayName];
  if (!entry) return closed;

  if (entry.closed) return closed;

  if (!entry.open || !entry.close) return closed;

  const openTime = parseTime(entry.open, now);
  const closeTime = parseTime(entry.close, now);

  if (isNaN(openTime.getTime()) || isNaN(closeTime.getTime())) return closed;

  const todayHours = `${entry.open} - ${entry.close}`;
  const isOpen = now >= openTime && now <= closeTime;

  return {
    isOpen,
    todayHours,
    statusLabel: isOpen ? 'Open Now' : 'Closed',
  };
}
