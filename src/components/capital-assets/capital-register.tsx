"use client";

import { Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCapitalAssetTransactions,
  getDocumentsForTarget,
} from "@/lib/evidence-binder";
import type { RentalProperty } from "@/lib/property-workspace";
import { formatMoney } from "@/lib/rent-ledger";

export function CapitalRegister({
  property,
  year,
}: {
  property: RentalProperty;
  year: number;
}) {
  const capitalTransactions = getCapitalAssetTransactions(
    property.ledgerEntries,
    year,
  );

  return (
    <section className="grid gap-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Capital assets</CardTitle>
          <CardDescription>
            Expense transactions marked as capital assets for {year}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Capital transactions"
            value={capitalTransactions.length}
          />
          <Metric
            label="Linked documents"
            value={capitalTransactions.reduce(
              (total, entry) =>
                total +
                getDocumentsForTarget(
                  property.documents,
                  "transaction",
                  entry.id,
                ).length,
              0,
            )}
          />
          <Metric
            label="Capital total"
            valueLabel={formatMoney(
              capitalTransactions.reduce(
                (total, entry) => total + entry.amount,
                0,
              ),
            )}
          />
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Marked capital transactions</CardTitle>
          <CardDescription>
            These records stay traceable to their source transaction and support
            documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {capitalTransactions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
              <Landmark className="size-4 shrink-0" aria-hidden="true" />
              <span>No capital asset transactions marked for this year.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Support</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capitalTransactions.map((entry) => {
                  const documents = getDocumentsForTarget(
                    property.documents,
                    "transaction",
                    entry.id,
                  );

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.vendor}</div>
                        <div className="text-muted-foreground text-xs">
                          {entry.reviewNotes || entry.memo || "No notes"}
                        </div>
                      </TableCell>
                      <TableCell>{formatMoney(entry.amount)}</TableCell>
                      <TableCell>{documents.length} documents</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-md border-sky-300 bg-sky-50 text-sky-800"
                        >
                          <Landmark className="size-3" aria-hidden="true" />
                          Capital asset
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value?: number;
  valueLabel?: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-2xl">{valueLabel ?? value}</p>
    </div>
  );
}
