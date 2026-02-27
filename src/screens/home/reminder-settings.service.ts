export function formatReminderTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function buildReminderTimeOptions() {
  const options: Array<{ label: string; hour: number; minute: number }> = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += 15) {
      options.push({
        label: formatReminderTime(h, m),
        hour: h,
        minute: m,
      });
    }
  }
  return options;
}

export function buildReminderPresets(localNow: Date) {
  return [
    {
      hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 15) / 60)) % 24,
      minute: (localNow.getMinutes() + 15) % 60,
      label: 'In 15m',
    },
    {
      hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 30) / 60)) % 24,
      minute: (localNow.getMinutes() + 30) % 60,
      label: 'In 30m',
    },
    {
      hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 60) / 60)) % 24,
      minute: (localNow.getMinutes() + 60) % 60,
      label: 'In 1h',
    },
  ];
}

export function normalizeReminderTime(nextHour: number, nextMinute: number) {
  const totalMinutesInDay = 24 * 60;
  const totalInputMinutes = nextHour * 60 + nextMinute;
  const normalizedTotalMinutes = ((totalInputMinutes % totalMinutesInDay) + totalMinutesInDay) % totalMinutesInDay;
  return {
    hour: Math.floor(normalizedTotalMinutes / 60),
    minute: normalizedTotalMinutes % 60,
  };
}

