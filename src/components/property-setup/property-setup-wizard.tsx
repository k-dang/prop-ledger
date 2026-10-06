"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import { uploadLeaseDocument } from "@/components/rent-ledger/lease-document-upload";
import { Button, buttonVariants } from "@/components/ui/button";
import { type ActionFailure, SAVE_FAILED_MESSAGE } from "@/lib/action-utils";
import {
  type FieldErrors,
  firstIncompleteStep,
  isEmpty,
  SECTION_TITLES,
  SETUP_SECTIONS,
  type SetupForm,
  type SetupSection,
  type SetupStep,
  sectionIndex,
  setupSteps,
  validatePropertyStep,
  validateStep,
} from "@/lib/property-setup";
import {
  completePropertySetup,
  savePropertySetupDraft,
} from "@/lib/property-setup-actions";
import { cn } from "@/lib/utils";
import {
  ReviewStep,
  SetupFinishedNotice,
  SetupRail,
  type UploadFailure,
  UploadFailureNotice,
} from "./setup-review";
import {
  OwnershipStep,
  PropertyStep,
  StepHeading,
  UnitStep,
  UnitsStep,
} from "./setup-steps";

const REVIEW_SECTION = SETUP_SECTIONS.length - 1;

type Status = "idle" | "saving" | "creating" | "uploading";

type WizardProps = {
  propertyId: string | null;
  /** The property's setup is already done (e.g. finished in another tab). */
  setupFinished?: boolean;
  initialForm: SetupForm;
  cancelHref: string;
  /** `YYYY-MM-DD`, from the server; the actions re-check with their own date. */
  today: string;
};

/**
 * Guided property setup. Creates a property (`propertyId` null) or finishes
 * one saved part-way through. Each screen asks one question; the rail on the
 * left doubles as a summary of finished sections. Nothing but the property row
 * and draft is written until "Create property" / "Finish setup".
 *
 * Next keeps visited routes mounted but hidden, so answers survive a quick
 * detour. Once a run ends (saved, finished, or cancelled) the wizard is reset
 * as the route hides, and the next visit starts fresh.
 */
export function PropertySetupWizard(props: WizardProps) {
  const [run, setRun] = useState(0);
  const ended = useRef(false);

  useLayoutEffect(
    () => () => {
      if (ended.current) {
        ended.current = false;
        setRun((count) => count + 1);
      }
    },
    [],
  );

  return (
    <SetupRun
      key={run}
      {...props}
      onEnd={() => {
        ended.current = true;
      }}
    />
  );
}

function SetupRun({
  propertyId,
  setupFinished = false,
  initialForm,
  cancelHref,
  today,
  onEnd,
}: WizardProps & { onEnd: () => void }) {
  const router = useRouter();
  const resuming = propertyId !== null;
  const [form, setForm] = useState(initialForm);
  const [index, setIndex] = useState(() =>
    firstIncompleteStep(initialForm, today),
  );
  // Furthest section reached; sections up to it are clickable in the rail.
  const [maxSection, setMaxSection] = useState(() =>
    sectionIndex(setupSteps(initialForm)[index]),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);
  const [leaseFiles, setLeaseFiles] = useState<Record<string, File>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [saveError, setSaveError] = useState<string>();
  const [uploadFailures, setUploadFailures] = useState<{
    propertyId: string;
    failures: UploadFailure[];
  }>();
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = setupSteps(form);
  const step = steps[index];
  const shownIndex = useRef(index);
  const section = sectionIndex(step);
  const reachedReview = maxSection === REVIEW_SECTION;

  // Move focus to the new question whenever the screen changes.
  useEffect(() => {
    if (shownIndex.current === index) return;
    shownIndex.current = index;
    headingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (errorFocusRequest === 0) return;
    const invalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    const target =
      invalid?.getAttribute("role") === "radiogroup"
        ? invalid.querySelector<HTMLElement>('[role="radio"]')
        : invalid;
    target?.focus();
  }, [errorFocusRequest]);

  function update(next: SetupForm, clear: string[] | "all" = []) {
    setForm(next);
    if (clear === "all") {
      setErrors({});
    } else if (clear.some((key) => key in errors)) {
      setErrors((current) => {
        const remaining = { ...current };
        for (const key of clear) delete remaining[key];
        return remaining;
      });
    }
  }

  function showErrors(next: FieldErrors) {
    setErrors(next);
    setErrorFocusRequest((count) => count + 1);
  }

  function goTo(nextIndex: number) {
    setErrors({});
    setSaveError(undefined);
    setIndex(nextIndex);
    setMaxSection((current) =>
      Math.max(current, sectionIndex(setupSteps(form)[nextIndex])),
    );
  }

  /** Opens the first screen of `target`, e.g. the first unit. */
  function goToSection(target: SetupSection) {
    goTo(steps.findIndex((candidate) => candidate.kind === target));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stepErrors = validateStep(form, step, today);

    if (!isEmpty(stepErrors)) {
      showErrors(stepErrors);
      return;
    }

    if (step.kind === "review") {
      void complete();
      return;
    }

    // After the first full pass, Continue returns to review via any screen an
    // edit left incomplete (e.g. a unit added by switching layouts).
    goTo(reachedReview ? firstIncompleteStep(form, today) : index + 1);
  }

  /**
   * Runs one save at a time. Returns the result on success; on failure shows
   * the error and returns undefined.
   */
  async function save<Result extends { ok: true }>(
    next: Status,
    action: () => Promise<Result | ActionFailure>,
  ) {
    if (busy.current) return;

    busy.current = true;
    setStatus(next);
    setSaveError(undefined);
    // A dropped connection rejects instead of returning a failure.
    const result = await action().catch((): ActionFailure => ({ ok: false }));

    if (!result.ok) {
      busy.current = false;
      setStatus("idle");
      setSaveError(result.error ?? SAVE_FAILED_MESSAGE);
      return;
    }
    return result;
  }

  async function saveForLater() {
    const propertyErrors = validatePropertyStep(form, today);

    if (!isEmpty(propertyErrors)) {
      goTo(0);
      showErrors(propertyErrors);
      return;
    }

    const result = await save("saving", () =>
      savePropertySetupDraft(propertyId, form),
    );
    if (result === undefined) return;

    onEnd();
    router.push(`/properties/${result.propertyId}`);
  }

  async function complete() {
    const result = await save("creating", () =>
      completePropertySetup(propertyId, form),
    );
    if (result === undefined) return;

    // Files for units since removed or marked vacant have no lease and are skipped.
    const uploads = Object.entries(leaseFiles).flatMap(([unitId, file]) => {
      const leaseId = result.leaseIdByUnit[unitId];
      return leaseId ? [{ file, leaseId }] : [];
    });
    if (uploads.length > 0) setStatus("uploading");
    const failures = (
      await Promise.all(
        uploads.map(async ({ file, leaseId }) => {
          const formData = new FormData();
          formData.set("file", file);
          const uploaded = await uploadLeaseDocument(
            result.propertyId,
            leaseId,
            formData,
          ).catch((): ActionFailure => ({ ok: false }));
          return uploaded.ok
            ? []
            : [
                {
                  leaseId,
                  fileName: file.name,
                  error: uploaded.error ?? SAVE_FAILED_MESSAGE,
                },
              ];
        }),
      )
    ).flat();

    onEnd();
    if (failures.length > 0) {
      setUploadFailures({ propertyId: result.propertyId, failures });
    } else {
      router.push(`/properties/${result.propertyId}`);
    }
  }

  function confirmLeave(event: { preventDefault: () => void }) {
    if (
      form !== initialForm &&
      !window.confirm("Leave setup? Your answers on this page won’t be saved.")
    ) {
      event.preventDefault();
      return;
    }
    onEnd();
  }

  if (uploadFailures) {
    return <UploadFailureNotice {...uploadFailures} />;
  }
  // Finishing also lands here (the page refreshes), so only an idle run shows it.
  if (setupFinished && propertyId !== null && status === "idle") {
    return <SetupFinishedNotice propertyId={propertyId} />;
  }

  const working = status !== "idle";
  const stepProps = { form, errors, onChange: update };

  return (
    <div className="grid gap-6">
      <header>
        <Link
          href={cancelHref}
          onClick={confirmLeave}
          className={cn(
            buttonVariants({ variant: "link" }),
            "-ml-1 h-auto px-1 text-brand-text",
          )}
        >
          <ChevronLeft data-icon="inline-start" aria-hidden="true" />
          {resuming ? "Back to property" : "Cancel"}
        </Link>
        <h1 className="mt-1 font-semibold text-2xl tracking-tight">
          {resuming ? "Finish setting up" : "Add a property"}
        </h1>
        {resuming ? (
          <p className="text-muted-foreground text-sm">{form.property.name}</p>
        ) : null}
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,40rem)] lg:gap-8">
        <nav aria-label="Setup progress" className="hidden lg:block">
          <SetupRail
            form={form}
            step={step}
            maxSection={maxSection}
            today={today}
            onSelect={goToSection}
          />
        </nav>

        <div className="grid min-w-0 gap-2">
          <div className="grid gap-2 lg:hidden">
            <p className="font-medium text-sm">
              Step {section + 1} of {SETUP_SECTIONS.length} ·{" "}
              {SECTION_TITLES[step.kind]}
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width]"
                style={{
                  width: `${((section + 1) / SETUP_SECTIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <form
            ref={formRef}
            noValidate
            onSubmit={handleSubmit}
            className="grid gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
          >
            <StepHeading
              key={index}
              ref={headingRef}
              form={form}
              step={step}
              resuming={resuming}
            />
            {step.kind === "property" ? (
              <PropertyStep {...stepProps} />
            ) : step.kind === "ownership" ? (
              <OwnershipStep {...stepProps} />
            ) : step.kind === "units" ? (
              <UnitsStep {...stepProps} />
            ) : step.kind === "unit" ? (
              <UnitStep
                {...stepProps}
                position={step.index}
                file={leaseFiles[form.units[step.index].id]}
                onFileChange={(file) => {
                  const unitId = form.units[step.index].id;
                  setLeaseFiles(({ [unitId]: _previous, ...rest }) =>
                    file ? { ...rest, [unitId]: file } : rest,
                  );
                }}
              />
            ) : (
              <ReviewStep
                {...stepProps}
                leaseFiles={leaseFiles}
                onEdit={goToSection}
              />
            )}

            <FormErrorAlert message={saveError} />

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              {index > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={working}
                  onClick={() => goTo(index - 1)}
                >
                  <ChevronLeft data-icon="inline-start" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                {index > 0 && step.kind !== "review" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={working}
                    onClick={() => void saveForLater()}
                  >
                    {status === "saving" ? "Saving…" : "Save and finish later"}
                  </Button>
                ) : null}
                <Button type="submit" disabled={working}>
                  {submitLabel(step, status, resuming, reachedReview)}
                  {working ? null : (
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function submitLabel(
  step: SetupStep,
  status: Status,
  resuming: boolean,
  reachedReview: boolean,
) {
  if (step.kind !== "review") {
    return reachedReview ? "Back to review" : "Continue";
  }
  if (status === "creating") {
    return resuming ? "Finishing setup…" : "Creating property…";
  }
  if (status === "uploading") return "Uploading leases…";
  return resuming ? "Finish setup" : "Create property";
}
