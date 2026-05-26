export function computeEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export interface Holiday {
  date: Date;
  name: string;
}

export function getFrenchHolidays(year: number): Holiday[] {
  const easter = computeEasterDate(year);

  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const holidays: Holiday[] = [
    { date: new Date(year, 0, 1), name: "Jour de l'an" },
    { date: addDays(easter, 1), name: "Lundi de Pâques" },
    { date: new Date(year, 4, 1), name: "Fête du Travail" },
    { date: new Date(year, 4, 8), name: "Victoire 1945" },
    { date: addDays(easter, 39), name: "Ascension" },
    { date: addDays(easter, 50), name: "Lundi de Pentecôte" },
    { date: new Date(year, 6, 14), name: "Fête nationale" },
    { date: new Date(year, 7, 15), name: "Assomption" },
    { date: new Date(year, 10, 1), name: "Toussaint" },
    { date: new Date(year, 10, 11), name: "Armistice" },
    { date: new Date(year, 11, 25), name: "Noël" },
  ];

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

const holidayCache = new Map<number, Set<string>>();

function getHolidaySet(year: number): Set<string> {
  if (!holidayCache.has(year)) {
    const set = new Set(getFrenchHolidays(year).map((h) => toDateStr(h.date)));
    holidayCache.set(year, set);
  }
  return holidayCache.get(year)!;
}

export function isHoliday(date: Date): boolean {
  return getHolidaySet(date.getFullYear()).has(toDateStr(date));
}

export function getHolidayName(date: Date): string | null {
  const str = toDateStr(date);
  const holidays = getFrenchHolidays(date.getFullYear());
  return holidays.find((h) => toDateStr(h.date) === str)?.name ?? null;
}
