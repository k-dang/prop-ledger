"use client";

import { Plus } from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { NewPropertyInput } from "@/lib/property-workspace";

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
}: {
  onSubmit: (input: NewPropertyInput) => boolean | Promise<boolean>;
}) {
  const handleSubmit = createFormSubmit(propertyFormSchema, async (data) => {
    const isSaved = await onSubmit({
      name: data.propertyName,
      line1: data.addressLine1,
      line2: data.addressLine2,
      municipality: data.municipality,
      province: data.province ?? DEFAULT_PROVINCE,
      postalCode: data.postalCode,
      acquisitionDate: data.acquisitionDate,
    });

    return isSaved;
  });

  return (
    <Card className="rounded-md" size="sm">
      <CardHeader>
        <CardTitle>Add property</CardTitle>
        <CardDescription>
          Municipal address and acquisition facts.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <Input
                id="acquisitionDate"
                name="acquisitionDate"
                type="date"
                required
                defaultValue={SAMPLE_PROPERTY_FORM.acquisitionDate}
              />
            </Field>
          </div>
          <Button type="submit" className="mt-1 w-full">
            <Plus data-icon="inline-start" />
            Add property
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
