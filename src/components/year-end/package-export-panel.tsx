import { Download } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AccountantNote } from "@/db/schema";
import type { RentalProperty } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";
import { addAccountantNote } from "@/lib/year-end-actions";

export function PackageExportPanel({
  property,
  year,
  notes,
}: {
  property: RentalProperty;
  year: number;
  notes: AccountantNote[];
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <div>
          <CardTitle as="h2">Year-end packages</CardTitle>
          <CardDescription>
            Download a JSON snapshot for the full property or an individual
            owner. Each download reflects the current records.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3 lg:grid-cols-2">
          <AccountantNotesForm
            propertyId={property.id}
            year={year}
            notes={notes}
          />
          <PackageGenerationForms property={property} year={year} />
        </div>
      </CardContent>
    </Card>
  );
}

function AccountantNotesForm({
  propertyId,
  year,
  notes,
}: {
  propertyId: string;
  year: number;
  notes: AccountantNote[];
}) {
  return (
    <form
      action={addAccountantNote.bind(null, propertyId, year)}
      className="grid gap-2 rounded-md border p-4"
    >
      <Field>
        <FieldLabel htmlFor="accountant-note">Accountant note</FieldLabel>
        <Input
          id="accountant-note"
          name="note"
          placeholder="Open question or treatment context"
          required
        />
      </Field>
      <Button
        type="submit"
        variant="outline"
        className="justify-self-start rounded-md"
      >
        Add note
      </Button>
      {notes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No accountant notes for {year}.
        </p>
      ) : (
        <ul className="grid gap-1 text-muted-foreground text-sm">
          {notes.map((note) => (
            <li key={note.id}>• {note.note}</li>
          ))}
        </ul>
      )}
    </form>
  );
}

function PackageGenerationForms({
  property,
  year,
}: {
  property: RentalProperty;
  year: number;
}) {
  const targets = [
    { id: null, label: "Full-property package" },
    ...property.owners.map((owner) => ({
      id: owner.id,
      label: `${owner.name} package`,
    })),
  ];

  return (
    <div className="grid content-start gap-2 rounded-md border p-4">
      <p className="font-medium text-sm">Download package</p>
      {targets.map((target) => (
        <a
          key={target.id ?? "property"}
          href={packageDownloadHref(property.id, year, target.id)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-start rounded-md",
          )}
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          {target.label}
        </a>
      ))}
    </div>
  );
}

function packageDownloadHref(
  propertyId: string,
  year: number,
  ownerId: string | null,
) {
  const params = new URLSearchParams({ propertyId, year: String(year) });
  if (ownerId !== null) params.set("ownerId", ownerId);
  return `/year-end/packages?${params.toString()}`;
}
