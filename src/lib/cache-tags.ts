export const appDataCacheTags = {
  portfolio: "portfolio",
  portfolioDashboard: "portfolio-dashboard",
  properties: "properties",
  propertyNavigation: "property-navigation",
  rentLedgers: "rent-ledgers",
} as const;

export const allAppDataCacheTags = Object.values(appDataCacheTags);

export function propertyCacheTag(propertyId: string) {
  return `property:${propertyId}`;
}

export function rentLedgerCacheTag(propertyId: string) {
  return `rent-ledger:${propertyId}`;
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
