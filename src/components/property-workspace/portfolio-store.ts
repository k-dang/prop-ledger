"use client";

import { useSyncExternalStore } from "react";

import { createEmptyPortfolio, type Portfolio } from "@/lib/property-workspace";
import {
  PROPERTY_WORKSPACE_STORAGE_KEY,
  parseStoredPortfolio,
} from "@/lib/property-workspace-storage";

const EMPTY_PORTFOLIO = createEmptyPortfolio();

const portfolioListeners = new Set<() => void>();
let portfolioSnapshot = EMPTY_PORTFOLIO;
let portfolioSnapshotRawValue: string | null | undefined;
let persistenceErrorSnapshot: string | undefined;
const PERSISTENCE_ERROR_MESSAGE =
  "Unable to save changes in this browser. The workspace was not changed.";

export function usePortfolioStore() {
  const portfolio = usePortfolioSnapshot();
  const persistenceError = usePersistenceErrorSnapshot();

  return {
    portfolio,
    persistenceError,
    replacePortfolio: (nextPortfolio: Portfolio) =>
      commitPortfolioMutation(() => replacePortfolio(nextPortfolio)),
    updatePortfolio: (updater: (portfolio: Portfolio) => Portfolio) =>
      commitPortfolioMutation(() => updatePortfolio(updater)),
  };
}

function usePortfolioSnapshot() {
  return useSyncExternalStore(
    subscribeToPortfolio,
    getPortfolioSnapshot,
    getServerPortfolioSnapshot,
  );
}

function usePersistenceErrorSnapshot() {
  return useSyncExternalStore(
    subscribeToPortfolio,
    getPersistenceErrorSnapshot,
    getServerPersistenceErrorSnapshot,
  );
}

function commitPortfolioMutation(mutate: () => boolean) {
  const isPersisted = mutate();
  const nextError = isPersisted ? undefined : PERSISTENCE_ERROR_MESSAGE;

  if (nextError !== persistenceErrorSnapshot) {
    persistenceErrorSnapshot = nextError;
    emitPortfolioChange();
  }

  return isPersisted;
}

function replacePortfolio(nextPortfolio: Portfolio) {
  return writePortfolioSnapshot(nextPortfolio);
}

function updatePortfolio(updater: (portfolio: Portfolio) => Portfolio) {
  return writePortfolioSnapshot(updater(getPortfolioSnapshot()));
}

function subscribeToPortfolio(listener: () => void) {
  portfolioListeners.add(listener);

  if (portfolioListeners.size === 1) {
    window.addEventListener("storage", handlePortfolioStorageChange);
  }

  return () => {
    portfolioListeners.delete(listener);

    if (portfolioListeners.size === 0) {
      window.removeEventListener("storage", handlePortfolioStorageChange);
    }
  };
}

function getServerPortfolioSnapshot() {
  return EMPTY_PORTFOLIO;
}

function getPersistenceErrorSnapshot() {
  return persistenceErrorSnapshot;
}

function getServerPersistenceErrorSnapshot() {
  return undefined;
}

function getPortfolioSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_PORTFOLIO;
  }

  if (portfolioSnapshotRawValue !== undefined) {
    return portfolioSnapshot;
  }

  const rawValue = readPortfolioRawValue();
  portfolioSnapshotRawValue = rawValue;
  portfolioSnapshot =
    rawValue === null ? EMPTY_PORTFOLIO : parseStoredPortfolio(rawValue);

  return portfolioSnapshot;
}

function writePortfolioSnapshot(nextPortfolio: Portfolio) {
  const rawValue = JSON.stringify(nextPortfolio);

  if (!writePortfolioRawValue(rawValue)) {
    return false;
  }

  portfolioSnapshot = nextPortfolio;
  portfolioSnapshotRawValue = rawValue;
  emitPortfolioChange();
  return true;
}

function handlePortfolioStorageChange(event: StorageEvent) {
  if (
    event.storageArea !== window.localStorage ||
    event.key !== PROPERTY_WORKSPACE_STORAGE_KEY
  ) {
    return;
  }

  portfolioSnapshotRawValue = undefined;
  emitPortfolioChange();
}

function emitPortfolioChange() {
  for (const listener of portfolioListeners) {
    listener();
  }
}

function readPortfolioRawValue() {
  try {
    return window.localStorage.getItem(PROPERTY_WORKSPACE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePortfolioRawValue(rawValue: string) {
  try {
    window.localStorage.setItem(PROPERTY_WORKSPACE_STORAGE_KEY, rawValue);
    return true;
  } catch {
    return false;
  }
}
