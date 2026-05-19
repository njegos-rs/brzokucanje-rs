const APP_TIME_ZONE = 'Europe/Belgrade'

type DateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
}

function getDateParts(date: Date, timeZone: string): DateParts {
  const parts = getFormatter(timeZone).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number.parseInt(part.value, 10)]),
  )

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  }
}

function getDateKey(parts: Pick<DateParts, 'year' | 'month' | 'day'>): string {
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`
}

function zonedDateTimeToUtc(
  dateKey: string,
  time: { hour: number; minute: number; second: number },
  timeZone: string,
): Date {
  const [year, month, day] = dateKey.split('-').map((part) => Number.parseInt(part, 10))

  let guessMs = Date.UTC(year, month - 1, day, time.hour, time.minute, time.second)
  const targetMs = Date.UTC(year, month - 1, day, time.hour, time.minute, time.second)

  // Reconcile the UTC guess with the real zoned wall-clock time, including DST transitions.
  for (let i = 0; i < 4; i++) {
    const actual = getDateParts(new Date(guessMs), timeZone)
    const actualMs = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second)
    const diffMs = actualMs - targetMs
    if (diffMs === 0) break
    guessMs -= diffMs
  }

  return new Date(guessMs)
}

export function getCurrentDateInAppTimeZone(now: Date = new Date()): string {
  return getDateKey(getDateParts(now, APP_TIME_ZONE))
}

export function getDayRangeInAppTimeZone(now: Date = new Date()): { startIso: string; endIso: string } {
  const today = getCurrentDateInAppTimeZone(now)

  const start = zonedDateTimeToUtc(today, { hour: 0, minute: 0, second: 0 }, APP_TIME_ZONE)
  const end = zonedDateTimeToUtc(today, { hour: 24, minute: 0, second: 0 }, APP_TIME_ZONE)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}
