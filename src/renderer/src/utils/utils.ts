export function timeAgo(from: Date | number | string): string {
  const now = Date.now();
  const past = new Date(from).getTime();
  const diff = Math.max(0, now - past);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  // Less than a minute
  if (diff < minute) return 'Just now';

  // Less than an hour (show minutes)
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m`;
  }

  // Less than a day (show hours)
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h`;
  }

  // Less than a week (show days)
  if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}d`;
  }

  // Less than 4 weeks (show weeks)
  if (diff < 4 * week) {
    const weeks = Math.floor(diff / week);
    return `${weeks}w`;
  }

  // More than 4 weeks, show actual date
  const date = new Date(past);
  const currentYear = new Date().getFullYear();
  const pastYear = date.getFullYear();

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  const month = months[date.getMonth()];
  const day_num = date.getDate();

  // If same year, just show "Jan 15"
  if (pastYear === currentYear) {
    return `${month} ${day_num}`;
  }

  // If different year, show "Jan 15, 2024"
  return `${month} ${day_num}, ${pastYear}`;
}
