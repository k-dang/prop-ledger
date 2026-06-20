import { Download, FileArchive } from "lucide-react";
import Link from "next/link";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AccountantNote } from "@/db/schema";
import type { RentalProperty } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";
import {
  addAccountantNote,
  generateYearEndPackage,
} from "@/lib/year-end-actions";

export type PackageHistoryItem = {
  id: string;
  scope: "property" | "owner";
  createdAt: Date;
  owner: { name: string } | null;
};

export function PackageExportPanel({
  property,
  year,
  notes,
  packages,
}: {
  property: RentalProperty;
  year: number;
  notes: AccountantNote[];
  packages: PackageHistoryItem[];
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <div>
          <CardTitle>Year-end packages</CardTitle>
          <CardDescription>
            Generate immutable JSON snapshots for the full property or an
            individual owner. Live record changes never rewrite an existing
            package.
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
        <PackageHistory year={year} packages={packages} />
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
    { id: null, label: "Full-property package", variant: "default" as const },
    ...property.owners.map((owner) => ({
      id: owner.id,
      label: `${owner.name} package`,
      variant: "outline" as const,
    })),
  ];

  return (
    <div className="grid content-start gap-2 rounded-md border p-4">
      <p className="font-medium text-sm">Create snapshot</p>
      {targets.map((target) => (
        <form
          key={target.id ?? "property"}
          action={generateYearEndPackage.bind(
            null,
            property.id,
            year,
            target.id,
          )}
        >
          <Button
            type="submit"
            variant={target.variant}
            className="w-full justify-start rounded-md"
          >
            <FileArchive data-icon="inline-start" />
            {target.label}
          </Button>
        </form>
      ))}
    </div>
  );
}

function PackageHistory({
  year,
  packages,
}: {
  year: number;
  packages: PackageHistoryItem[];
}) {
  return (
    <div>
      <p className="mb-2 font-medium text-sm">Export history</p>
      {packages.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No snapshots generated for {year}.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.scope === "property"
                    ? "Full property"
                    : (item.owner?.name ?? "Owner")}
                </TableCell>
                <TableCell>{item.createdAt.toLocaleString("en-CA")}</TableCell>
                <TableCell>
                  <Link
                    href={`/year-end/packages/${item.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-md",
                    )}
                  >
                    <Download data-icon="inline-start" />
                    Download JSON
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
