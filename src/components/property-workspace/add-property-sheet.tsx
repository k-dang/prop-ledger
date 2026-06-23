"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import { PropertyForm } from "@/components/property-workspace/property-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createProperty } from "@/lib/actions";
import type { NewPropertyInput } from "@/lib/property-workspace";

const SAVE_ERROR_MESSAGE =
  "Unable to save the property. Please try again in a moment.";

export function AddPropertySheet() {
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  async function handleCreateProperty(input: NewPropertyInput) {
    const result = await createProperty(input);
    setSaveError(result.ok ? undefined : (result.error ?? SAVE_ERROR_MESSAGE));

    if (result.ok) {
      setOpen(false);
    }

    return result.ok;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <Plus data-icon="inline-start" aria-hidden="true" />
        Add property
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Add property</SheetTitle>
          <SheetDescription>
            Create a property workspace from its municipal address and
            acquisition facts.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 px-4 pb-4">
          <FormErrorAlert message={saveError} />
          <PropertyForm onSubmit={handleCreateProperty} embedded />
        </div>
      </SheetContent>
    </Sheet>
  );
}
