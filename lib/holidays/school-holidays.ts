export type Zone = "zone-a" | "zone-b" | "zone-c";

interface Period {
  start: string;
  end: string;
}

interface YearHolidays {
  toussaint?: Period;
  noel?: Period;
  hiver?: Period;
  printemps?: Period;
  ete?: Period;
}

// Official French school holiday calendar
const SCHOOL_HOLIDAYS: Record<Zone, Record<number, YearHolidays>> = {
  "zone-a": {
    2025: {
      toussaint: { start: "2025-10-18", end: "2025-11-03" },
      noel: { start: "2025-12-20", end: "2026-01-05" },
    },
    2026: {
      hiver: { start: "2026-02-07", end: "2026-02-22" },
      printemps: { start: "2026-04-11", end: "2026-04-26" },
      ete: { start: "2026-07-04", end: "2026-09-01" },
      toussaint: { start: "2026-10-17", end: "2026-11-02" },
      noel: { start: "2026-12-19", end: "2027-01-04" },
    },
    2027: {
      hiver: { start: "2027-02-06", end: "2027-02-21" },
      printemps: { start: "2027-04-10", end: "2027-04-25" },
      ete: { start: "2027-07-03", end: "2027-09-01" },
      toussaint: { start: "2027-10-16", end: "2027-11-01" },
      noel: { start: "2027-12-18", end: "2028-01-03" },
    },
    2028: {
      hiver: { start: "2028-02-05", end: "2028-02-20" },
      printemps: { start: "2028-04-08", end: "2028-04-23" },
      ete: { start: "2028-07-01", end: "2028-09-01" },
    },
  },
  "zone-b": {
    2025: {
      toussaint: { start: "2025-10-18", end: "2025-11-03" },
      noel: { start: "2025-12-20", end: "2026-01-05" },
    },
    2026: {
      hiver: { start: "2026-02-14", end: "2026-03-01" },
      printemps: { start: "2026-04-18", end: "2026-05-03" },
      ete: { start: "2026-07-04", end: "2026-09-01" },
      toussaint: { start: "2026-10-17", end: "2026-11-02" },
      noel: { start: "2026-12-19", end: "2027-01-04" },
    },
    2027: {
      hiver: { start: "2027-02-13", end: "2027-02-28" },
      printemps: { start: "2027-04-17", end: "2027-05-02" },
      ete: { start: "2027-07-03", end: "2027-09-01" },
    },
    2028: {
      hiver: { start: "2028-02-12", end: "2028-02-27" },
      printemps: { start: "2028-04-15", end: "2028-04-30" },
      ete: { start: "2028-07-01", end: "2028-09-01" },
    },
  },
  "zone-c": {
    2025: {
      toussaint: { start: "2025-10-18", end: "2025-11-03" },
      noel: { start: "2025-12-20", end: "2026-01-05" },
    },
    2026: {
      hiver: { start: "2026-02-21", end: "2026-03-08" },
      printemps: { start: "2026-04-25", end: "2026-05-10" },
      ete: { start: "2026-07-04", end: "2026-09-01" },
      toussaint: { start: "2026-10-17", end: "2026-11-02" },
      noel: { start: "2026-12-19", end: "2027-01-04" },
    },
    2027: {
      hiver: { start: "2027-02-20", end: "2027-03-07" },
      printemps: { start: "2027-04-24", end: "2027-05-09" },
      ete: { start: "2027-07-03", end: "2027-09-01" },
    },
    2028: {
      hiver: { start: "2028-02-19", end: "2028-03-05" },
      printemps: { start: "2028-04-22", end: "2028-05-07" },
      ete: { start: "2028-07-01", end: "2028-09-01" },
    },
  },
};

export interface SchoolHoliday {
  name: string;
  start: Date;
  end: Date;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getSchoolHolidays(year: number, zone: Zone = "zone-a"): SchoolHoliday[] {
  const data = SCHOOL_HOLIDAYS[zone]?.[year] ?? {};
  return Object.entries(data).map(([name, period]) => ({
    name: capitalize(name),
    start: new Date(period.start),
    end: new Date(period.end),
  }));
}

export function isSchoolHoliday(date: Date, zone: Zone = "zone-a"): boolean {
  const holidays = getSchoolHolidays(date.getFullYear(), zone);
  const t = date.getTime();
  return holidays.some((h) => t >= h.start.getTime() && t <= h.end.getTime());
}
