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
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsSkeleton() {
  return (
    <section
      className="grid gap-4"
      role="status"
      aria-busy="true"
      aria-label="Loading review records"
    >
      <div className="grid gap-4 rounded-md border p-6">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
      <span className="sr-only">Loading review records…</span>
    </section>
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
