import { eq } from "drizzle-orm";
import { db } from "@/db/index";
import { yearEndPackages } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packageId: string }> },
) {
  const { packageId } = await params;
  const record = await db.query.yearEndPackages.findFirst({
    where: eq(yearEndPackages.id, packageId),
  });
  if (record === undefined)
    return new Response("Package not found", { status: 404 });
  const snapshot = record.snapshot;
  const filename = `${slug(snapshot.property.name)}-${snapshot.taxYear}-${slug(snapshot.scope.label)}.json`;
  return new Response(JSON.stringify(record.snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
