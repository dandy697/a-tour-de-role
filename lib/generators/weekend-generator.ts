import { isHoliday, getHolidayName } from "@/lib/holidays/french-holidays";
import { isSchoolHoliday, type Zone } from "@/lib/holidays/school-holidays";

export type Agreement = "alternance" | "papa_impairs" | "maman_impairs";
export type Owner = "maman" | "papa" | "50/50";

export interface GeneratedWeekend {
  startDate: Date;
  endDate: Date;
  owner: Owner;
  type: "weekend" | "school-holiday";
  note?: string;
}

export interface GenerationResult {
  weekends: GeneratedWeekend[];
  alerts: string[];
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function generateWeekends(
  agreement: Agreement,
  year: number,
  zone: Zone = "zone-a"
): GenerationResult {
  const weekends: GeneratedWeekend[] = [];
  const alerts: string[] = [];

  // Find first Saturday of the year
  const current = new Date(year, 0, 1);
  while (current.getDay() !== 6) current.setDate(current.getDate() + 1);

  const endYear = new Date(year, 11, 31);
  let regularCount = 0;

  while (current <= endYear) {
    const saturday = new Date(current);
    const sunday = new Date(current);
    sunday.setDate(sunday.getDate() + 1);

    const satHoliday = isHoliday(saturday);
    const sunHoliday = isHoliday(sunday);
    const satSchool = isSchoolHoliday(saturday, zone);
    const sunSchool = isSchoolHoliday(sunday, zone);

    // School holiday weekends → 50/50
    if (satSchool || sunSchool) {
      weekends.push({
        startDate: new Date(saturday),
        endDate: new Date(sunday),
        owner: "50/50",
        type: "school-holiday",
        note: "Vacances scolaires",
      });
      current.setDate(current.getDate() + 7);
      continue;
    }

    // Public holidays → alert and skip alternation count
    if (satHoliday || sunHoliday) {
      const name = getHolidayName(saturday) || getHolidayName(sunday) || "Jour férié";
      alerts.push(`${name}: ${saturday.toLocaleDateString("fr-FR")}`);
      current.setDate(current.getDate() + 7);
      continue;
    }

    let owner: Owner;
    if (agreement === "alternance") {
      owner = regularCount % 2 === 0 ? "maman" : "papa";
    } else if (agreement === "papa_impairs") {
      owner = getISOWeekNumber(saturday) % 2 === 1 ? "papa" : "maman";
    } else {
      owner = getISOWeekNumber(saturday) % 2 === 1 ? "maman" : "papa";
    }

    weekends.push({
      startDate: new Date(saturday),
      endDate: new Date(sunday),
      owner,
      type: "weekend",
    });

    regularCount++;
    current.setDate(current.getDate() + 7);
  }

  return { weekends, alerts };
}

export function generateMultipleYears(
  agreement: Agreement,
  startYear: number,
  numYears = 3,
  zone: Zone = "zone-a"
): GenerationResult {
  const allWeekends: GeneratedWeekend[] = [];
  const allAlerts: string[] = [];

  for (let i = 0; i < numYears; i++) {
    const { weekends, alerts } = generateWeekends(agreement, startYear + i, zone);
    allWeekends.push(...weekends);
    allAlerts.push(...alerts);
  }

  return { weekends: allWeekends, alerts: allAlerts };
}
