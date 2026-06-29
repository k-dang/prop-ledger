"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import {
  DEFAULT_PROVINCE,
  SAMPLE_PROPERTY_FORM,
} from "@/components/property-workspace/constants";
import {
  optionalFormString,
  requiredFormString,
} from "@/components/property-workspace/form-schemas";
import { createFormSubmit } from "@/components/property-workspace/form-submit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { NewPropertyInput } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";

const propertyFormSchema = z.object({
  propertyName: requiredFormString,
  addressLine1: requiredFormString,
  addressLine2: optionalFormString,
  municipality: requiredFormString,
  province: optionalFormString,
  postalCode: requiredFormString,
  acquisitionDate: requiredFormString,
});

export function PropertyForm({
  onSubmit,
  embedded = false,
}: {
  onSubmit: (input: NewPropertyInput) => boolean | Promise<boolean>;
  embedded?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ref-based re-entry guard so a rapid double submit cannot fire two saves
  // before the disabled state from `isSubmitting` has flushed.
  const submittingRef = useRef(false);
  const handleSubmit = createFormSubmit(propertyFormSchema, async (data) => {
    if (submittingRef.current) {
      return false;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      return await onSubmit({
        name: data.propertyName,
        line1: data.addressLine1,
        line2: data.addressLine2,
        municipality: data.municipality,
        province: data.province ?? DEFAULT_PROVINCE,
        postalCode: data.postalCode,
        acquisitionDate: data.acquisitionDate,
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  });

  return (
    <Card
      className={cn(
        "rounded-md",
        embedded && "gap-0 border-0 bg-transparent py-0 shadow-none",
      )}
      size="sm"
    >
      {embedded ? null : (
        <CardHeader>
          <CardTitle>Add property</CardTitle>
          <CardDescription>
            Municipal address and acquisition facts.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(embedded && "px-0")}>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="propertyName">Property name</FieldLabel>
            <Input
              id="propertyName"
              name="propertyName"
              required
              defaultValue={SAMPLE_PROPERTY_FORM.propertyName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
            <Input
              id="addressLine1"
              name="addressLine1"
              required
              defaultValue={SAMPLE_PROPERTY_FORM.addressLine1}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="addressLine2">Address line 2</FieldLabel>
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={SAMPLE_PROPERTY_FORM.addressLine2}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_72px]">
            <Field>
              <FieldLabel htmlFor="municipality">Municipality</FieldLabel>
              <Input
                id="municipality"
                name="municipality"
                required
                defaultValue={SAMPLE_PROPERTY_FORM.municipality}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="province">Province</FieldLabel>
              <Input
                id="province"
                name="province"
                required
                defaultValue={SAMPLE_PROPERTY_FORM.province}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
              <Input
                id="postalCode"
                name="postalCode"
                required
                defaultValue={SAMPLE_PROPERTY_FORM.postalCode}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="acquisitionDate">
                Acquisition date
              </FieldLabel>
              <DatePickerField
                id="acquisitionDate"
                name="acquisitionDate"
                required
                defaultValue={SAMPLE_PROPERTY_FORM.acquisitionDate}
              />
            </Field>
          </div>
          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            <Plus data-icon="inline-start" />
            {isSubmitting ? "Adding…" : "Add property"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
