import { FileText } from "lucide-react";
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
import { buildSourceDocumentIndex } from "@/lib/evidence-binder";
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
  const rows = portfolio.properties.flatMap((property) =>
    buildSourceDocumentIndex(property.documents).map((document) => ({
      property,
      document,
    })),
  );

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
                  <TableHead>Attached to</TableHead>
                  <TableHead>Readable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ property, document }) => (
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
                      <div className="text-muted-foreground text-xs">
                        {[
                          document.documentDate,
                          formatOptionalMoney(document.amount),
                        ]
                          .filter(Boolean)
                          .join(" | ") || "No date or amount"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.linkedTargets.length === 0 ? (
                        <Badge
                          variant="outline"
                          className={`rounded-md ${toneSurface.review}`}
                        >
                          not attached
                        </Badge>
                      ) : (
                        `${document.linkedTargets.length} link${
                          document.linkedTargets.length === 1 ? "" : "s"
                        }`
                      )}
                    </TableCell>
                    <TableCell>
                      {document.readableUrl === null ? (
                        "No URL"
                      ) : (
                        <a
                          className="underline-offset-4 hover:underline"
                          href={document.readableUrl}
                        >
                          Open
                        </a>
                      )}
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
