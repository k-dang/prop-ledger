import { Suspense } from "react";

import {
  type InboxRow,
  TransactionsInbox,
} from "@/components/evidence-binder/transactions-inbox";
import { getPortfolio } from "@/db/queries";
import { getEntryIssues } from "@/lib/evidence-binder";

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
  const rows: InboxRow[] = portfolio.properties.flatMap((property) =>
    property.ledgerEntries.map((entry) => ({
      propertyId: property.id,
      propertyName: property.name,
      entry,
      issues: getEntryIssues(entry, property.documents),
    })),
  );
  const properties = portfolio.properties.map((property) => ({
    id: property.id,
    name: property.name,
  }));

  return (
    <section className="grid gap-4">
      <TransactionsInbox rows={rows} properties={properties} />
    </section>
  );
}
