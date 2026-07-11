import { FileText } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { DocumentDeleteButton } from "@/components/documents/document-delete-button";
import {
  DocumentLinksSheet,
  type LinkedRecord,
} from "@/components/documents/document-links-sheet";
import { DocumentOpenLink } from "@/components/documents/document-open-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPortfolio } from "@/db/queries";
import type { DocumentLink, DocumentLinkTarget } from "@/db/schema";
import {
  buildSourceDocumentIndex,
  formatLedgerCategory,
} from "@/lib/evidence-binder";
import type { RentalProperty } from "@/lib/property-workspace";
import { formatMoney } from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";

export const metadata = {
  title: "Documents | Rental Property Workspace",
  description: "Source document index across rental properties.",
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-120 border" />}>
      <DocumentsContent />
    </Suspense>
  );
}

async function DocumentsContent() {
  const portfolio = await getPortfolio();
  const rows = portfolio.properties.flatMap((property) => {
    const linksByDocument = new Map(
      property.documents.map((document) => [document.id, document.links]),
    );

    return buildSourceDocumentIndex(property.documents).map((document) => ({
      property,
      document,
      linkedRecords: (linksByDocument.get(document.documentId) ?? []).map(
        (link) => resolveLinkedRecord(property, link),
      ),
    }));
  });

  return (
    <section className="grid gap-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle as="h1">Documents</CardTitle>
          <CardDescription>
            Source document index with metadata and attachment counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
              <FileText className="size-4" aria-hidden="true" />
              No documents recorded.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Readable</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ property, document, linkedRecords }) => (
                  <TableRow key={document.documentId}>
                    <TableCell>
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={`/properties/${property.id}`}
                      >
                        {property.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{document.fileName}</div>
                      <div className="text-muted-foreground text-xs">
                        {document.documentType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{document.vendor ?? "No vendor"}</div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
                        <span>
                          {[
                            document.documentDate,
                            formatOptionalMoney(document.amount),
                          ]
                            .filter(Boolean)
                            .join(" | ") || "No date or amount"}
                        </span>
                        {linkedRecords.length === 0 ? (
                          <Badge
                            variant="outline"
                            className={`rounded-md ${toneSurface.review}`}
                          >
                            not attached
                          </Badge>
                        ) : (
                          <DocumentLinksSheet
                            fileName={document.fileName}
                            records={linkedRecords}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.readableUrl === null ? (
                        "No URL"
                      ) : (
                        <DocumentOpenLink
                          fileName={document.fileName}
                          url={document.readableUrl}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <DocumentDeleteButton
                        propertyId={property.id}
                        documentId={document.documentId}
                        fileName={document.fileName}
                      />
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

function formatOptionalMoney(value: number | null) {
  return value === null ? undefined : formatMoney(value);
}

const LINK_TARGET_LABELS: Record<DocumentLinkTarget, string> = {
  lease: "Lease",
  transaction: "Transaction",
  rent_event: "Rent event",
  mortgage_payment: "Mortgage payment",
  year_end_package: "Year-end package",
};

function resolveLinkedRecord(
  property: RentalProperty,
  link: DocumentLink,
): LinkedRecord {
  if (link.targetType === "transaction") {
    const entry = property.ledgerEntries.find(
      (candidate) => candidate.id === link.targetId,
    );

    if (entry !== undefined) {
      return {
        id: link.id,
        title: entry.vendor,
        detail: [
          entry.date,
          formatMoney(entry.amount),
          formatLedgerCategory(entry),
        ].join(" | "),
      };
    }
  }

  if (link.targetType === "mortgage_payment") {
    const payment = property.mortgagePayments.find(
      (candidate) => candidate.id === link.targetId,
    );

    if (payment !== undefined) {
      return {
        id: link.id,
        title: `${payment.lender} mortgage payment`,
        detail: [payment.date, formatMoney(payment.totalAmount)].join(" | "),
      };
    }
  }

  return {
    id: link.id,
    title: LINK_TARGET_LABELS[link.targetType],
    detail: null,
  };
}
