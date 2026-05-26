"use client";

import { useState } from "react";
import { getFrenchHolidays } from "@/lib/holidays/french-holidays";
import { getSchoolHolidays } from "@/lib/holidays/school-holidays";
import type { Zone } from "@/lib/holidays/school-holidays";

interface WeekendData {
  id: string;
  startDate: string;
  endDate: string;
  owner: string;
  type: string;
}

interface FamilyData {
  id: string;
  name: string;
  mamanLabel: string;
  papaLabel: string;
  zone: string;
}

interface CalendarGridProps {
  family: FamilyData;
  weekends: WeekendData[];
  initialYear: number;
  initialMonth: number;
  tenantSlug: string;
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export function CalendarGrid({
  family,
  weekends,
  initialYear,
  initialMonth,
  tenantSlug: _tenantSlug,
}: CalendarGridProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const holidays = getFrenchHolidays(year);
  const schoolHols = getSchoolHolidays(year, family.zone as Zone);

  const holidaySet = new Set(holidays.map((h) => toDateStr(h.date)));
  const holidayNameMap = new Map(holidays.map((h) => [toDateStr(h.date), h.name]));

  function isInSchoolHoliday(date: Date) {
    const t = date.getTime();
    return schoolHols.some((h) => t >= h.start.getTime() && t <= h.end.getTime());
  }

  function getWeekendForDate(dateStr: string) {
    return weekends.find(
      (w) =>
        toDateStr(new Date(w.startDate)) === dateStr ||
        toDateStr(new Date(w.endDate)) === dateStr
    );
  }

  function goMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  // Build calendar grid for the month
  const firstDay = new Date(year, month, 1);
  // Monday-based: 0=Mon…6=Sun
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function ownerColor(owner: string) {
    if (owner === "maman") return "bg-pink-100 text-pink-800 border-pink-200";
    if (owner === "papa") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-purple-100 text-purple-800 border-purple-200";
  }

  function ownerLabel(owner: string) {
    if (owner === "maman") return family.mamanLabel;
    if (owner === "papa") return family.papaLabel;
    return "50/50";
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <button
          onClick={() => goMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ‹
        </button>
        <h2 className="font-bold text-lg">
          {MONTHS_FR[month]} {year}
        </h2>
        <button
          onClick={() => goMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ›
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-6 py-3 border-b bg-gray-50 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-pink-200 inline-block" />
          {family.mamanLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-200 inline-block" />
          {family.papaLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-200 inline-block" />
          50/50
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-200 inline-block" />
          Jour férié
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-200 inline-block" />
          Vacances scolaires
        </span>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 border-b">
        {DAYS_FR.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-50" />;
          }

          const dateStr = toDateStr(date);
          const isHoliday = holidaySet.has(dateStr);
          const holidayName = holidayNameMap.get(dateStr);
          const inSchool = isInSchoolHoliday(date);
          const weekend = getWeekendForDate(dateStr);
          const isToday = dateStr === toDateStr(new Date());
          const isSatOrSun = date.getDay() === 0 || date.getDay() === 6;

          let bgClass = "bg-white";
          if (isHoliday) bgClass = "bg-amber-50";
          else if (inSchool && isSatOrSun) bgClass = "bg-green-50";
          else if (isSatOrSun) bgClass = "bg-gray-50";

          return (
            <div
              key={dateStr}
              className={`min-h-[72px] p-1.5 border-b border-r border-gray-100 ${bgClass}`}
              title={holidayName ?? undefined}
            >
              <div
                className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday
                    ? "bg-blue-600 text-white"
                    : isSatOrSun
                      ? "text-gray-700"
                      : "text-gray-400"
                }`}
              >
                {date.getDate()}
              </div>

              {holidayName && (
                <div className="text-[10px] text-amber-700 leading-tight truncate font-medium">
                  {holidayName}
                </div>
              )}

              {weekend && (
                <div
                  className={`text-[10px] px-1 py-0.5 rounded border mt-0.5 truncate ${ownerColor(weekend.owner)}`}
                >
                  {weekend.type === "school-holiday"
                    ? `✈️ ${ownerLabel(weekend.owner)}`
                    : ownerLabel(weekend.owner)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
