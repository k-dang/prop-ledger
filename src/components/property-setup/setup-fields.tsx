"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { type ComponentProps, type ReactNode, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { validateEvidenceFileDeclaration } from "@/lib/evidence-upload-policy";
import { MAX_TEXT_LENGTH } from "@/lib/property-setup";
import { cn } from "@/lib/utils";

/** DOM id for a form path like `owners.0.name`; errors use `${id}-error`. */
function fieldId(path: string) {
  return `setup-${path.replaceAll(".", "-")}`;
}

function describedBy(path: string, error?: string, hint?: ReactNode) {
  const id = fieldId(path);
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

function FieldMessage({
  path,
  error,
  hint,
}: {
  path: string;
  error?: string;
  hint?: ReactNode;
}) {
  const id = fieldId(path);

  if (error) return <FieldError id={`${id}-error`}>{error}</FieldError>;
  if (hint)
    return <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>;
  return null;
}

function Label({
  path,
  label,
  optional,
}: {
  path: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <FieldLabel htmlFor={fieldId(path)}>
      {label}
      {optional ? (
        <span className="font-normal text-muted-foreground">(optional)</span>
      ) : null}
    </FieldLabel>
  );
}

type TextFieldProps = Omit<
  ComponentProps<typeof Input>,
  "id" | "value" | "onChange" | "prefix"
> & {
  path: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  /** Fixed text shown inside the input, e.g. `$` or `%`. */
  prefix?: string;
  suffix?: string;
};

export function TextField({
  path,
  label,
  value,
  onValueChange,
  error,
  hint,
  optional,
  prefix,
  suffix,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <Label path={path} label={label} optional={optional} />
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground text-sm">
            {prefix}
          </span>
        ) : null}
        <Input
          id={fieldId(path)}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(path, error, hint)}
          maxLength={MAX_TEXT_LENGTH}
          className={cn(
            prefix && "pl-6",
            suffix && "pr-6 text-right tabular-nums",
          )}
          {...inputProps}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground text-sm">
            {suffix}
          </span>
        ) : null}
      </div>
      <FieldMessage path={path} error={error} hint={hint} />
    </Field>
  );
}

export function DateField({
  path,
  label,
  value,
  onValueChange,
  error,
  className,
}: {
  path: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  className?: string;
}) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <Label path={path} label={label} />
      <DatePickerField
        id={fieldId(path)}
        name={path}
        value={value}
        onChange={onValueChange}
        invalid={Boolean(error)}
        aria-describedby={describedBy(path, error)}
        required
      />
      <FieldMessage path={path} error={error} />
    </Field>
  );
}

export function SelectField<Value extends string>({
  path,
  label,
  value,
  options,
  onValueChange,
  error,
  className,
}: {
  path: string;
  label: string;
  value: Value;
  options: readonly { value: Value; label: string }[];
  onValueChange: (value: Value) => void;
  error?: string;
  className?: string;
}) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <Label path={path} label={label} />
      <Select
        value={value}
        onValueChange={(next) => {
          // Base UI can follow a selection with a `null` change; ignore it.
          if (next !== null) onValueChange(next as Value);
        }}
      >
        <SelectTrigger
          id={fieldId(path)}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(path, error)}
        >
          <span className="flex flex-1 text-left">
            {options.find((option) => option.value === value)?.label ?? value}
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldMessage path={path} error={error} />
    </Field>
  );
}

/** An error for a whole group of fields, e.g. owners whose shares don't add up. */
export function GroupError({ path, error }: { path: string; error?: string }) {
  return error ? (
    <p
      id={`${fieldId(path)}-error`}
      role="alert"
      className="text-destructive text-sm"
    >
      {error}
    </p>
  ) : null;
}

/** A radio group drawn as selectable cards. */
export function ChoiceCards<Value extends string>({
  path,
  label,
  value,
  options,
  onValueChange,
  error,
  columns = 1,
}: {
  path: string;
  label: string;
  value: Value | null;
  options: readonly { value: Value; title: string; description?: string }[];
  onValueChange: (value: Value) => void;
  error?: string;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className="grid gap-2">
      <RadioGroup
        id={fieldId(path)}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(path, error)}
        value={value ?? ""}
        onValueChange={(next) => onValueChange(next as Value)}
        className={cn(
          "grid gap-2",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {options.map((option) => (
          // biome-ignore lint/a11y/noLabelWithoutControl: Radio.Root renders the control inside the label.
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-background p-3 transition-colors hover:bg-muted has-data-checked:border-brand has-data-checked:bg-brand-surface has-data-checked:ring-1 has-data-checked:ring-brand has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <Radio.Root
              value={option.value}
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background outline-none data-checked:border-brand"
            >
              <Radio.Indicator className="size-2 rounded-full bg-brand data-unchecked:hidden" />
            </Radio.Root>
            <span className="grid gap-0.5">
              <span className="font-medium text-sm leading-tight">
                {option.title}
              </span>
              {option.description ? (
                <span className="text-muted-foreground text-xs">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </RadioGroup>
      <FieldMessage path={path} error={error} />
    </div>
  );
}

/**
 * Optional signed-lease file. The file is held in the browser and uploaded
 * once setup completes and the lease exists.
 */
export function LeaseFileField({
  path,
  file,
  onFileChange,
}: {
  path: string;
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);

  function choose(next: File | undefined) {
    if (next === undefined) return;

    const problem = validateEvidenceFileDeclaration({
      fileName: next.name,
      contentType: next.type,
      size: next.size,
    });
    setError(problem);
    if (problem === undefined) onFileChange(next);
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <Label path={path} label="Signed lease" optional />
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-ready-surface text-ready">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{file.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatFileSize(file.size)} · Uploads when you finish setup
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${file.name}`}
            onClick={() => onFileChange(undefined)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <section
          aria-label="Signed lease drop zone"
          className={cn(
            "flex items-center gap-3 rounded-lg border border-dashed p-3 transition-colors",
            dragging && "border-brand bg-brand-surface",
            error && "border-blocked-border bg-blocked-surface",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files[0]);
          }}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            {error ? (
              <FileText className="size-4" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
          </span>
          <p className="min-w-0 flex-1 text-muted-foreground text-xs">
            PDF or photo, up to 20 MB. Drop it here or browse.
          </p>
          <input
            ref={inputRef}
            id={fieldId(path)}
            type="file"
            accept="application/pdf,image/*"
            className="sr-only"
            tabIndex={-1}
            aria-describedby={describedBy(path, error)}
            onChange={(event) => {
              choose(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Browse
          </Button>
        </section>
      )}
      <FieldMessage path={path} error={error} />
    </Field>
  );
}

function formatFileSize(bytes: number) {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}
