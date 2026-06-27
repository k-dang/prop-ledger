export const appDataCacheTags = {
  portfolio: "portfolio",
  portfolioDashboard: "portfolio-dashboard",
  properties: "properties",
  propertyNavigation: "property-navigation",
  rentLedgers: "rent-ledgers",
  yearEnd: "year-end",
} as const;

export const allAppDataCacheTags = Object.values(appDataCacheTags);

export function propertyCacheTag(propertyId: string) {
  return `property:${propertyId}`;
}

export function rentLedgerCacheTag(propertyId: string) {
  return `rent-ledger:${propertyId}`;
}

export function yearEndCacheTag(propertyId: string, taxYear: number) {
  return `year-end:${propertyId}:${taxYear}`;
}

export function portfolioMutationCacheTags() {
  return [
    appDataCacheTags.portfolio,
    appDataCacheTags.portfolioDashboard,
    appDataCacheTags.properties,
    appDataCacheTags.propertyNavigation,
  ];
}

export function propertySetupMutationCacheTags(propertyId: string) {
  return [
    appDataCacheTags.portfolio,
    appDataCacheTags.portfolioDashboard,
    propertyCacheTag(propertyId),
  ];
}

export function propertyRentSetupMutationCacheTags(propertyId: string) {
  return [
    ...propertySetupMutationCacheTags(propertyId),
    rentLedgerCacheTag(propertyId),
  ];
}

export function rentLedgerMutationCacheTags(propertyId: string) {
  return [appDataCacheTags.portfolioDashboard, rentLedgerCacheTag(propertyId)];
}

export function transactionMutationCacheTags(propertyId: string) {
  return propertyRentSetupMutationCacheTags(propertyId);
}

export function mortgagePaymentMutationCacheTags(propertyId: string) {
  return propertySetupMutationCacheTags(propertyId);
}

export function yearEndMutationCacheTags(propertyId: string, taxYear: number) {
  return [yearEndCacheTag(propertyId, taxYear)];
}
