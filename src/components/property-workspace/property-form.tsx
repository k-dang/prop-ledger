"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
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
import type {
  NewPropertyInput,
  PropertyFlagState,
} from "@/components/property-workspace/workspace-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const DEFAULT_FLAGS: PropertyFlagState = {
  hasPersonalUse: false,
  hasShortTermRental: false,
};

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
  onSubmit: (input: NewPropertyInput) => boolean;
}) {
  const [flags, setFlags] = useState<PropertyFlagState>(DEFAULT_FLAGS);

  const handleSubmit = createFormSubmit(propertyFormSchema, (data) => {
    const isSaved = onSubmit({
      name: data.propertyName,
      address: {
        line1: data.addressLine1,
        line2: data.addressLine2,
        municipality: data.municipality,
        province: data.province ?? DEFAULT_PROVINCE,
        postalCode: data.postalCode,
      },
      acquisitionDate: data.acquisitionDate,
      hasPersonalUse: flags.hasPersonalUse,
      hasShortTermRental: flags.hasShortTermRental,
    });

    if (isSaved) {
      setFlags(DEFAULT_FLAGS);
    }

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
          <div className="grid gap-2 rounded-md border bg-sky-50/70 p-3">
            <Field orientation="horizontal">
              <Checkbox
                id="personal-use"
                checked={flags.hasPersonalUse}
                onCheckedChange={(checked) =>
                  setFlags({ ...flags, hasPersonalUse: checked })
                }
              />
              <FieldLabel htmlFor="personal-use" className="font-normal">
                Personal-use portion
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="short-term-rental"
                checked={flags.hasShortTermRental}
                onCheckedChange={(checked) =>
                  setFlags({ ...flags, hasShortTermRental: checked })
                }
              />
              <FieldLabel htmlFor="short-term-rental" className="font-normal">
                Short-term rental activity
              </FieldLabel>
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
