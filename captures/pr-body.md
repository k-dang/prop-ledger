The mortgage payments table deleted a payment the instant you clicked **Delete** — no confirmation, no undo. That's a one-click, irreversible data loss sitting in the middle of a routine workflow, and it got easier to hit by accident once the label was removed.

Now delete asks first. Each row's action is an icon-only button that opens a confirmation dialog naming the exact payment (amount and date), and a failed delete keeps the dialog open with the error instead of silently doing nothing.

## Visual evidence

<!-- before-and-after:start -->
| Before (Action column) | After (Action column) |
|:---:|:---:|
| ![Before](./captures/before-panel.png) | ![After](./captures/after-panel.png) |

<!-- before-and-after:end -->

The Action column also drops the "Allocate"/"Delete" text in favor of icons, which removes the icon-vs-text baseline mismatch that was hard to keep aligned.

<!-- before-and-after:start -->
| Preview |
|:---:|
| ![Preview](./captures/after-confirm.png) |

<!-- before-and-after:end -->

## Changes

- **Icon-only actions.** Both the Allocate popover trigger and the Delete button switch to `size="icon-sm"` and drop their text labels. `icon-sm` is still `size-7` (28px), so the row height is unchanged. Each keeps an `aria-label` naming its payment plus a `title` tooltip, and marks its icon `aria-hidden`.
- **Confirmation before delete.** New `MortgagePaymentDeleteButton` component owns the dialog state per row (it can't live inline in the table's `.map()`). It reuses the existing `ConfirmDialog` — the same pattern the Documents panel uses for its icon-only delete — with a destructive confirm button.
- **Pending + error handling.** `useTransition` drives a "Working…" state on the confirm button and blocks closing mid-delete. A rejected action keeps the dialog open and shows the server message under "Payment wasn't deleted".

## Why this shape

The confirmation reuses `ConfirmDialog` and mirrors `DocumentDeleteButton`, so it's consistent with the delete flow already in the Documents panel rather than a one-off. Extracting the row button into its own component is what makes per-row dialog state possible.

## Verification

- `pnpm typecheck` (`tsc --noEmit`) — clean
- `pnpm lint` (`biome check`) — clean
- `pnpm test` — 165/165 passing
- Manual, in-browser: confirmed the dialog opens with the correct amount/date, **Cancel** closes without deleting, and the base (pre-change) state was captured for the before screenshot.

## Merge risk

Low. Single component, no schema or API change. Delete is still irreversible — that's why the confirmation exists — but reverting this PR fully restores the previous one-click behavior. No rollout or data recovery steps needed.
