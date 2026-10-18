"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Banknote,
  CopyPlus,
  Split,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { z } from "zod";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  finiteFormNumber,
  optionalFormNumber,
  requiredFormString,
} from "@/components/property-workspace/form-schemas";
import { createFormSubmit } from "@/components/property-workspace/form-submit";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteMortgagePayment,
  recordMortgagePayment,
  setMortgagePaymentAllocation,
} from "@/lib/mortgage-payment-actions";
import {
  isMortgagePaymentAllocated,
  type MortgagePayment,
  mortgagePaymentComponentsBalance,
  mortgageSplitSummary,
  validateMortgageAllocation,
} from "@/lib/mortgage-payments";
import { nextMonthlyPaymentDate } from "@/lib/payment-date";
import { formatMoney } from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

const mortgagePaymentFormSchema = z.object({
  date: requiredFormString,
  lender: requiredFormString,
  totalAmount: finiteFormNumber,
  principal: optionalFormNumber,
  interest: optionalFormNumber,
});

const mortgageAllocationFormSchema = z.object({
  principal: optionalFormNumber,
  interest: optionalFormNumber,
});

/** Reads a controlled money input: empty stays `null`, garbage stays `NaN`. */
function parseFormAmount(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function MortgagePaymentsPanel({
  propertyId,
  payments,
}: {
  propertyId: string;
  payments: MortgagePayment[];
}) {
  const [error, setError] = useState<string>();
  const [sortKey, setSortKey] = useState<"date" | "lender" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toggleSort = (key: "date" | "lender" | "total") => {
    if (key === sortKey) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "lender" ? "asc" : "desc");
    }
  };
  const sortedPayments = payments.toSorted((a, b) => {
    const multiplier = sortDir === "asc" ? 1 : -1;
    if (sortKey === "lender") {
      return a.lender.localeCompare(b.lender) * multiplier !== 0
        ? a.lender.localeCompare(b.lender) * multiplier
        : b.date.localeCompare(a.date);
    }
    if (sortKey === "total") {
      return a.totalAmount !== b.totalAmount
        ? (a.totalAmount - b.totalAmount) * multiplier
        : b.date.localeCompare(a.date);
    }
    return a.date.localeCompare(b.date) * multiplier !== 0
      ? a.date.localeCompare(b.date) * multiplier
      : a.id.localeCompare(b.id);
  });
  const latestPayment = payments
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .at(-1);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Mortgage payments</CardTitle>
        <CardDescription>
          Record each payment directly. Interest is deductible; principal is
          kept for support but excluded from expense totals. Newest first.
          Select Date, Lender, or Total to change sort order.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <MortgagePaymentForm
          latestPayment={latestPayment}
          propertyId={propertyId}
          onErrorChange={setError}
        />
        <FormErrorAlert message={error} />
        {sortedPayments.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
            <Banknote className="size-4 shrink-0" aria-hidden="true" />
            <span>No mortgage payments recorded.</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  aria-sort={
                    sortKey === "date"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 px-2"
                    aria-label={`Sort by date, currently ${sortKey === "date" ? (sortDir === "asc" ? "oldest first" : "newest first") : "newest first"}`}
                    onClick={() => toggleSort("date")}
                  >
                    Date
                    {sortKey !== "date" ? (
                      <ArrowUpDown aria-hidden="true" />
                    ) : sortDir === "asc" ? (
                      <ArrowUp aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )}
                  </Button>
                </TableHead>
                <TableHead
                  aria-sort={
                    sortKey === "lender"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 px-2"
                    aria-label={`Sort by lender, currently ${sortKey === "lender" ? (sortDir === "asc" ? "A to Z" : "Z to A") : "unsorted"}`}
                    onClick={() => toggleSort("lender")}
                  >
                    Lender
                    {sortKey !== "lender" ? (
                      <ArrowUpDown aria-hidden="true" />
                    ) : sortDir === "asc" ? (
                      <ArrowUp aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )}
                  </Button>
                </TableHead>
                <TableHead
                  aria-sort={
                    sortKey === "total"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 px-2"
                    aria-label={`Sort by total, currently ${sortKey === "total" ? (sortDir === "asc" ? "lowest first" : "highest first") : "unsorted"}`}
                    onClick={() => toggleSort("total")}
                  >
                    Total
                    {sortKey !== "total" ? (
                      <ArrowUpDown aria-hidden="true" />
                    ) : sortDir === "asc" ? (
                      <ArrowUp aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => {
                const balanced = mortgagePaymentComponentsBalance(payment);
                const allocated = isMortgagePaymentAllocated(payment);

                return (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{payment.lender}</div>
                    </TableCell>
                    <TableCell>{formatMoney(payment.totalAmount)}</TableCell>
                    <TableCell>
                      {payment.principal === null
                        ? "-"
                        : formatMoney(payment.principal)}
                    </TableCell>
                    <TableCell>
                      {payment.interest === null
                        ? "-"
                        : formatMoney(payment.interest)}
                    </TableCell>
                    <TableCell>
                      {!allocated ? (
                        <Badge
                          variant="outline"
                          className={cn("rounded-md", toneSurface.review)}
                        >
                          Unallocated
                        </Badge>
                      ) : balanced ? (
                        <Badge
                          variant="outline"
                          className={cn("rounded-md", toneSurface.ready)}
                        >
                          Balanced
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn("rounded-md", toneSurface.blocked)}
                        >
                          Mismatch
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MortgageAllocationPopover
                          propertyId={propertyId}
                          payment={payment}
                        />
                        <MortgagePaymentDeleteButton
                          propertyId={propertyId}
                          payment={payment}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type MortgagePaymentDraft = {
  date: string;
  lender: string;
  totalAmount: string;
  principal: string;
  interest: string;
};

const emptyMortgagePaymentDraft: MortgagePaymentDraft = {
  date: "",
  lender: "",
  totalAmount: "",
  principal: "",
  interest: "",
};

function mortgagePaymentDraftFromPayment(
  payment: MortgagePayment,
): MortgagePaymentDraft {
  return {
    date: nextMonthlyPaymentDate(payment.date),
    lender: payment.lender,
    totalAmount: formatFormAmount(payment.totalAmount),
    principal: formatOptionalFormAmount(payment.principal),
    interest: formatOptionalFormAmount(payment.interest),
  };
}

function MortgagePaymentForm({
  latestPayment,
  propertyId,
  onErrorChange,
}: {
  latestPayment?: MortgagePayment;
  propertyId: string;
  onErrorChange: (error: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(emptyMortgagePaymentDraft);
  const { date, lender, totalAmount, principal, interest } = draft;
  const split = {
    principal: parseFormAmount(principal),
    interest: parseFormAmount(interest),
  };
  const summary = mortgageSplitSummary(
    Number(totalAmount) || 0,
    split.principal,
    split.interest,
  );
  const hasBreakdown = split.principal !== null || split.interest !== null;
  const canSubmit =
    date.trim() !== "" &&
    lender.trim() !== "" &&
    totalAmount.trim() !== "" &&
    Number(totalAmount) > 0;
  const balanceTone =
    totalAmount === "" || !hasBreakdown
      ? "text-muted-foreground"
      : summary.balanced
        ? "text-ready"
        : "text-blocked";

  const handleSubmit = createFormSubmit(
    mortgagePaymentFormSchema,
    async (input) => {
      const result = await recordMortgagePayment(propertyId, input);
      onErrorChange(result.ok ? undefined : result.error);

      if (result.ok) {
        setDraft(emptyMortgagePaymentDraft);
      }

      return result.ok;
    },
  );
  function prefillLatestPayment() {
    if (latestPayment === undefined) {
      return;
    }

    setDraft(mortgagePaymentDraftFromPayment(latestPayment));
    onErrorChange(undefined);
  }

  return (
    <form
      className="grid gap-4 rounded-md border bg-muted/30 p-3"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-sm">Record payment</h3>
          <p className="text-muted-foreground text-xs">
            Enter the payment total, then split out the principal and deductible
            interest.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {latestPayment !== undefined ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={prefillLatestPayment}
            >
              <CopyPlus data-icon="inline-start" />
              Use last payment
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_1fr]">
        <Field>
          <FieldLabel htmlFor="mortgage-date">Payment date</FieldLabel>
          <DatePickerField
            id="mortgage-date"
            name="date"
            required
            value={date}
            onChange={(value) => {
              setDraft((current) => ({ ...current, date: value }));
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="mortgage-lender">Lender or payee</FieldLabel>
          <Input
            id="mortgage-lender"
            name="lender"
            placeholder="RBC, TD, broker name"
            required
            value={lender}
            onChange={(event) => {
              const lender = event.target.value;
              setDraft((current) => ({ ...current, lender }));
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="mortgage-total">Total paid</FieldLabel>
          <Input
            id="mortgage-total"
            name="totalAmount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="3156.00"
            required
            value={totalAmount}
            onChange={(event) => {
              const totalAmount = event.target.value;
              setDraft((current) => ({ ...current, totalAmount }));
            }}
          />
        </Field>
      </div>

      <div className="grid gap-3 rounded-md border bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm">Payment breakdown</h4>
            <p className="text-muted-foreground text-xs">
              Principal is kept for support; interest is deductible.
            </p>
          </div>
          <span className={cn("font-medium tabular-nums text-xs", balanceTone)}>
            {hasBreakdown
              ? `${formatMoney(summary.allocated)} allocated · ${formatMoney(
                  summary.remaining,
                )} remaining`
              : "Breakdown optional"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="mortgage-principal">Principal</FieldLabel>
            <Input
              id="mortgage-principal"
              name="principal"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="1500.00"
              value={principal}
              onChange={(event) => {
                const principal = event.target.value;
                setDraft((current) => ({ ...current, principal }));
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="mortgage-interest">Interest</FieldLabel>
            <Input
              id="mortgage-interest"
              name="interest"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="125.00"
              value={interest}
              onChange={(event) => {
                const interest = event.target.value;
                setDraft((current) => ({ ...current, interest }));
              }}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end border-t pt-3">
        <Button type="submit" className="rounded-md" disabled={!canSubmit}>
          Add payment
        </Button>
      </div>
    </form>
  );
}

function formatFormAmount(value: number) {
  return value.toFixed(2);
}

function formatOptionalFormAmount(value: number | null) {
  return value === null ? "" : formatFormAmount(value);
}

type MortgageSplitDraft = {
  principal: string;
  interest: string;
};

function splitDraftFromPayment(
  payment: Pick<MortgagePayment, "principal" | "interest">,
): MortgageSplitDraft {
  return {
    principal: formatOptionalFormAmount(payment.principal),
    interest: formatOptionalFormAmount(payment.interest),
  };
}

/**
 * A per-row icon-only delete for one mortgage payment. Confirmation is
 * required because the action is irreversible and the button itself carries no
 * visible label, and a failed delete keeps the dialog open with the error.
 */
function MortgagePaymentDeleteButton({
  propertyId,
  payment,
}: {
  propertyId: string;
  payment: MortgagePayment;
}) {
  const [error, setError] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteMortgagePayment(propertyId, payment.id);

      if (result.ok) {
        setIsOpen(false);
        return;
      }

      setError(result.error);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="text-blocked"
        aria-label={`Delete the ${payment.date} payment`}
        title="Delete payment"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setError(undefined);
          }
        }}
        title="Delete mortgage payment?"
        description={
          <>
            Delete the {formatMoney(payment.totalAmount)} payment from{" "}
            {payment.date}? This action cannot be undone.
          </>
        }
        confirmLabel="Delete payment"
        isPending={isDeleting}
        error={
          error === undefined
            ? undefined
            : { title: "Payment wasn't deleted", message: error }
        }
        onConfirm={handleDelete}
      />
    </>
  );
}

/**
 * A per-row popover that edits only the principal/interest split of an
 * existing payment, leaving its date, lender, and total untouched. The draft
 * re-syncs from the stored payment on every open, so closing without saving
 * always discards unsaved input rather than carrying stale state forward.
 */
function MortgageAllocationPopover({
  propertyId,
  payment,
}: {
  propertyId: string;
  payment: MortgagePayment;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => splitDraftFromPayment(payment));
  const [error, setError] = useState<string>();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setDraft(splitDraftFromPayment(payment));
      setError(undefined);
    }
  }

  const split = {
    principal: parseFormAmount(draft.principal),
    interest: parseFormAmount(draft.interest),
  };
  const hasBreakdown = split.principal !== null || split.interest !== null;
  const summary = mortgageSplitSummary(
    payment.totalAmount,
    split.principal,
    split.interest,
  );
  const canSave =
    hasBreakdown && validateMortgageAllocation(split) === undefined;
  const balanceTone = !hasBreakdown
    ? "text-muted-foreground"
    : summary.balanced
      ? "text-ready"
      : "text-blocked";

  const handleSubmit = createFormSubmit(
    mortgageAllocationFormSchema,
    async (input) => {
      const result = await setMortgagePaymentAllocation(
        propertyId,
        payment.id,
        input,
      );
      setError(result.ok ? undefined : result.error);

      if (result.ok) {
        setOpen(false);
      }

      return result.ok;
    },
  );

  async function handleClear() {
    const result = await setMortgagePaymentAllocation(propertyId, payment.id, {
      principal: null,
      interest: null,
    });
    setError(result.ok ? undefined : result.error);

    if (result.ok) {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
        aria-label={`Allocate the ${payment.date} payment`}
        title="Allocate payment"
      >
        <Split aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="grid w-80 gap-3" align="end">
        <div className="grid gap-1">
          <p className="font-medium text-sm">Allocate payment</p>
          <p className="text-muted-foreground text-xs">
            {payment.date} · {payment.lender} ·{" "}
            {formatMoney(payment.totalAmount)} paid
          </p>
        </div>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`allocate-principal-${payment.id}`}>
                Principal
              </FieldLabel>
              <Input
                id={`allocate-principal-${payment.id}`}
                name="principal"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="1500.00"
                value={draft.principal}
                onChange={(event) => {
                  const principal = event.target.value;
                  setDraft((current) => ({ ...current, principal }));
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`allocate-interest-${payment.id}`}>
                Interest
              </FieldLabel>
              <Input
                id={`allocate-interest-${payment.id}`}
                name="interest"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="125.00"
                value={draft.interest}
                onChange={(event) => {
                  const interest = event.target.value;
                  setDraft((current) => ({ ...current, interest }));
                }}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
            <span className="text-muted-foreground text-xs">
              Total {formatMoney(payment.totalAmount)}
            </span>
            <span
              className={cn("font-medium tabular-nums text-xs", balanceTone)}
            >
              {hasBreakdown
                ? `${formatMoney(summary.allocated)} allocated · ${formatMoney(
                    summary.remaining,
                  )} remaining`
                : "Enter principal and interest"}
            </span>
          </div>
          <FormErrorAlert message={error} />
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-md text-muted-foreground"
              onClick={() => {
                void handleClear();
              }}
            >
              <X data-icon="inline-start" />
              Clear split
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-md"
              disabled={!canSave}
            >
              Save split
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
