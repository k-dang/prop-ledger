"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CalendarProps = {
  captionLayout?: "label" | "dropdown";
  className?: string;
  id?: string;
  month: Date;
  selected?: string;
  onMonthChange: (month: Date) => void;
  onSelect: (value: string) => void;
};

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const monthLabels = Array.from({ length: 12 }, (_item, index) =>
  new Intl.DateTimeFormat("en-CA", { month: "long" }).format(
    new Date(2024, index, 1),
  ),
);

export function Calendar({
  captionLayout = "label",
  className,
  id,
  month,
  selected,
  onMonthChange,
  onSelect,
}: CalendarProps) {
  const visibleMonth = startOfMonth(month);
  const weeks = useMemo(() => getCalendarWeeks(visibleMonth), [visibleMonth]);
  const years = useMemo(
    () => getYearOptions(visibleMonth.getFullYear()),
    [visibleMonth],
  );

  return (
    <div className={cn("w-72", className)} id={id}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        {captionLayout === "dropdown" ? (
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_5.5rem] gap-2">
            <Select
              value={String(visibleMonth.getMonth())}
              onValueChange={(value) => {
                onMonthChange(
                  new Date(visibleMonth.getFullYear(), Number(value), 1),
                );
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-full rounded-md bg-background"
                aria-label="Select month"
              >
                <span className="flex flex-1 text-left">
                  {monthLabels[visibleMonth.getMonth()]}
                </span>
              </SelectTrigger>
              <SelectContent align="start">
                {monthLabels.map((label, index) => (
                  <SelectItem key={label} value={String(index)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(visibleMonth.getFullYear())}
              onValueChange={(value) => {
                onMonthChange(
                  new Date(Number(value), visibleMonth.getMonth(), 1),
                );
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-full rounded-md bg-background tabular-nums"
                aria-label="Select year"
              >
                <span className="flex flex-1 text-left">
                  {visibleMonth.getFullYear()}
                </span>
              </SelectTrigger>
              <SelectContent align="start">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="font-medium text-sm tabular-nums">
            {monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label) => (
          <div
            className="py-1 text-muted-foreground text-xs"
            key={label}
            aria-hidden="true"
          >
            {label}
          </div>
        ))}
        {weeks.flat().map((date) => {
          const value = toDateValue(date);
          const isSelected = value === selected;
          const isOutside = date.getMonth() !== visibleMonth.getMonth();

          return (
            <Button
              type="button"
              variant={isSelected ? "default" : "ghost"}
              size="icon-sm"
              className={cn(
                "size-8 rounded-md font-normal text-sm tabular-nums",
                isOutside && "text-muted-foreground opacity-50",
              )}
              aria-pressed={isSelected}
              key={value}
              onClick={() => onSelect(value)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateValue(value: string | undefined) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getYearOptions(centerYear: number) {
  const start = Math.min(centerYear - 25, 2000);
  const end = Math.max(centerYear + 25, 2100);

  return Array.from(
    { length: end - start + 1 },
    (_item, index) => start + index,
  );
}

function getCalendarWeeks(month: Date) {
  const firstVisible = new Date(month);
  firstVisible.setDate(1 - firstVisible.getDay());

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_day, dayIndex) => {
      const date = new Date(firstVisible);
      date.setDate(firstVisible.getDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
}
