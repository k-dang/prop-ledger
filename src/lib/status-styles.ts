/**
 * Semantic status color vocabulary, routed through the tokens defined in
 * `globals.css` (light + dark aware). Components map their own domain status
 * unions onto a `StatusTone` and pull classes from here, so status color stays
 * consistent across the app and adapts to dark mode in one place.
 *
 * See DESIGN.md — "The One Accent Rule" (indigo is action/brand only; these
 * tones carry readiness and severity) and the Contrast Floor Rule.
 */

export type StatusTone = "ready" | "review" | "blocked" | "info" | "inactive";

/** Soft badge / callout surface: tinted background, hairline border, readable ink. */
export const toneSurface: Record<StatusTone, string> = {
  ready: "border-ready-border bg-ready-surface text-ready-text",
  review: "border-review-border bg-review-surface text-review-text",
  blocked: "border-blocked-border bg-blocked-surface text-blocked-text",
  info: "border-info-border bg-info-surface text-info-text",
  inactive: "border-inactive-border bg-inactive-surface text-inactive-text",
};

/** Standalone icon / strong text in a status tone (no surface). */
export const toneIcon: Record<StatusTone, string> = {
  ready: "text-ready",
  review: "text-review",
  blocked: "text-blocked",
  info: "text-info",
  inactive: "text-inactive",
};

/** Icon chip: tinted surface with the strong tone color for the glyph. */
export const toneChip: Record<StatusTone, string> = {
  ready: "bg-ready-surface text-ready",
  review: "bg-review-surface text-review",
  blocked: "bg-blocked-surface text-blocked",
  info: "bg-info-surface text-info",
  inactive: "bg-inactive-surface text-inactive",
};
