import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function RentLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <RentLedgerRedirect params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RentLedgerRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ propertyId }, { year }] = await Promise.all([params, searchParams]);
  const yearQuery =
    year === undefined ? "" : `?year=${encodeURIComponent(year)}`;

  redirect(`/properties/${propertyId}${yearQuery}#rent`);
  return null;
}
