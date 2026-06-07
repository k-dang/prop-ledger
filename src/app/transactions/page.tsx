import { AlertTriangle, Receipt } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

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
import { getPortfolio } from "@/db/queries";
import type { LedgerEntry } from "@/db/schema";
import {
  formatLedgerCategory,
  getDocumentsForTarget,
} from "@/lib/evidence-binder";
import { formatMoney } from "@/lib/rent-ledger";

export const metadata = {
  title: "Transactions | Rental Property Workspace",
  description: "Manual transaction review across rental properties.",
};

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-120 animate-pulse rounded-md border bg-muted/40" />
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}

async function TransactionsContent() {
  const portfolio = await getPortfolio();
  const rows = portfolio.properties.flatMap((property) =>
    property.ledgerEntries.map((entry) => ({
      property,
      entry,
      linkedDocuments: getDocumentsForTarget(
        property.documents,
        "transaction",
        entry.id,
      ),
    })),
  );

  return (
    <section className="grid gap-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Rental records that need category or evidence review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
              <Receipt className="size-4" aria-hidden="true" />
              No manual transactions recorded.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Exceptions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ property, entry, linkedDocuments }) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={`/properties/${property.id}`}
                      >
                        {property.name}
                      </Link>
                    </TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.vendor}</TableCell>
                    <TableCell>{formatLedgerCategory(entry)}</TableCell>
                    <TableCell>{formatMoney(entry.amount)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {isMissingCategory(entry) ? (
                          <WarningBadge>category</WarningBadge>
                        ) : null}
                        {entry.type === "expense" &&
                        linkedDocuments.length === 0 ? (
                          <WarningBadge>receipt</WarningBadge>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function isMissingCategory(entry: LedgerEntry) {
  return (
    (entry.type === "expense" && entry.expenseCategory === null) ||
    (entry.type === "income" && entry.incomeCategory === null)
  );
}

function WarningBadge({ children }: { children: string }) {
  return (
    <Badge
      variant="outline"
      className="rounded-md border-red-300 bg-red-50 text-red-800"
    >
      <AlertTriangle className="size-3" aria-hidden="true" />
      {children}
    </Badge>
  );
}
