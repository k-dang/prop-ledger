"use client";

import { useSyncExternalStore } from "react";

import {
  getDefaultTaxYear,
  parseStoredTaxYear,
  TAX_YEAR_STORAGE_KEY,
} from "@/lib/tax-year-storage";

const taxYearListeners = new Set<() => void>();
let taxYearSnapshot = getDefaultTaxYear();
let taxYearSnapshotRawValue: string | null | undefined;

export function useTaxYear() {
  const taxYear = useSyncExternalStore(
    subscribeToTaxYear,
    getTaxYearSnapshot,
    getServerTaxYearSnapshot,
  );

  return {
    taxYear,
    setTaxYear,
  };
}

function setTaxYear(nextTaxYear: number) {
  const rawValue = JSON.stringify(nextTaxYear);

  taxYearSnapshot = nextTaxYear;
  taxYearSnapshotRawValue = rawValue;
  writeTaxYearRawValue(rawValue);
  emitTaxYearChange();
}

function subscribeToTaxYear(listener: () => void) {
  taxYearListeners.add(listener);

  if (taxYearListeners.size === 1) {
    window.addEventListener("storage", handleTaxYearStorageChange);
  }

  return () => {
    taxYearListeners.delete(listener);

    if (taxYearListeners.size === 0) {
      window.removeEventListener("storage", handleTaxYearStorageChange);
    }
  };
}

function getServerTaxYearSnapshot() {
  return getDefaultTaxYear();
}

function getTaxYearSnapshot() {
  if (typeof window === "undefined") {
    return getDefaultTaxYear();
  }

  if (taxYearSnapshotRawValue !== undefined) {
    return taxYearSnapshot;
  }

  const rawValue = readTaxYearRawValue();
  taxYearSnapshotRawValue = rawValue;
  taxYearSnapshot =
    rawValue === null ? getDefaultTaxYear() : parseStoredTaxYear(rawValue);

  return taxYearSnapshot;
}

function handleTaxYearStorageChange(event: StorageEvent) {
  if (
    event.storageArea !== window.localStorage ||
    event.key !== TAX_YEAR_STORAGE_KEY
  ) {
    return;
  }

  taxYearSnapshotRawValue = undefined;
  emitTaxYearChange();
}

function emitTaxYearChange() {
  for (const listener of taxYearListeners) {
    listener();
  }
}

function readTaxYearRawValue() {
  try {
    return window.localStorage.getItem(TAX_YEAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeTaxYearRawValue(rawValue: string) {
  try {
    window.localStorage.setItem(TAX_YEAR_STORAGE_KEY, rawValue);
  } catch {
    // Best effort: the selected year still applies for this session.
  }
}
