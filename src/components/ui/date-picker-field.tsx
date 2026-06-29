"use client";

import { CalendarDays, X } from "lucide-react";
import { useId, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar, parseDateValue } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerFieldProps = {
  className?: string;
  defaultValue?: string | null;
  id: string;
  name: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function DatePickerField({
  className,
  defaultValue,
  id,
  name,
  onChange,
  placeholder = "Select date",
  required,
  value,
}: DatePickerFieldProps) {
  const isControlled = value !== undefined;
  const initialValue = defaultValue ?? "";
  const [internalValue, setInternalValue] = useState(initialValue);
  const selectedValue = isControlled ? value : internalValue;
  const selectedDate = parseDateValue(selectedValue);
  const [month, setMonth] = useState(selectedDate ?? new Date());
  const [open, setOpen] = useState(false);
  const descriptionId = useId();

  function updateValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <input
        id={id}
        name={name}
        required={required}
        type="hidden"
        value={selectedValue}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-start rounded-md px-2.5 font-normal",
            !selectedDate && "text-muted-foreground",
          )}
          aria-describedby={descriptionId}
        >
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
          {selectedDate ? dateFormatter.format(selectedDate) : placeholder}
        </PopoverTrigger>
        <PopoverContent className="p-3" align="start">
          <Calendar
            captionLayout="dropdown"
            month={month}
            selected={selectedValue}
            onMonthChange={setMonth}
            onSelect={(nextValue) => {
              updateValue(nextValue);
              setMonth(parseDateValue(nextValue) ?? month);
              setOpen(false);
            }}
          />
          {!required && selectedValue !== "" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-center rounded-md text-muted-foreground"
              onClick={() => {
                updateValue("");
                setOpen(false);
              }}
            >
              <X data-icon="inline-start" aria-hidden="true" />
              Clear date
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
      <span className="sr-only" id={descriptionId}>
        Opens a calendar picker. Selected value is submitted as YYYY-MM-DD.
      </span>
    </div>
  );
}
