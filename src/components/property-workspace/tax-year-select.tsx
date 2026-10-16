"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Tax year picker that navigates to `?year=` as soon as a year is chosen. */
export function TaxYearSelect({
  taxYear,
  years,
  className,
}: {
  taxYear: number;
  years: number[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={String(taxYear)}
      onValueChange={(year) => {
        // Base UI can follow a selection with a `null` change; ignore it.
        if (year !== null) router.push(`${pathname}?year=${year}`);
      }}
    >
      <SelectTrigger
        aria-label="Tax year"
        className={cn("w-24 bg-background", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
