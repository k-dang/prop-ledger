import { Suspense } from "react";

import {
  type InboxRow,
  TransactionsInbox,
} from "@/components/evidence-binder/transactions-inbox";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolio } from "@/db/queries";
import { getEntryExceptions } from "@/lib/evidence-binder";

export const metadata = {
  title: "Review | Rental Property Workspace",
  description: "Tax record review across rental properties.",
};

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-120 border" />}>
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
      exceptions: getEntryExceptions(entry, property.documents),
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
