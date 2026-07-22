import { Check, Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type SaveButtonProps = {
  /** Whether there are unsaved changes. Drives the enabled/highlighted look. */
  dirty: boolean;
  /** Whether a save is in flight. Shows the spinner and the saving label. */
  saving: boolean;
  /** Label shown when there are unsaved changes. */
  label?: string;
  /** Label shown while saving. */
  savingLabel?: string;
  /** Label shown when there is nothing to save (muted state). */
  cleanLabel?: string;
  /**
   * Extra disable reason beyond clean/saving (e.g. an invalid form). The button
   * is disabled when clean, saving, or this is true.
   */
  disabled?: boolean;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled" | "children" | "className"
> & { className?: string };

/**
 * The app's single Save affordance. It always reflects whether there are unsaved
 * changes so the state is never a guess: muted + disabled when clean, brand +
 * enabled the moment something is edited, and a spinner + "Saving…" while the
 * save is in flight. State is conveyed by icon **and** label, never color alone
 * (AGENTS.md §7), and it keeps a visible focus ring in both themes.
 *
 * On a successful save the caller resets `dirty` to false, which returns the
 * button to the muted "no unsaved changes" look.
 */
export function SaveButton({
  dirty,
  saving,
  label = "Save changes",
  savingLabel = "Saving…",
  cleanLabel = "Saved",
  disabled = false,
  className = "",
  type = "button",
  ...rest
}: SaveButtonProps) {
  const isDisabled = !dirty || saving || disabled;

  const stateClassName =
    dirty && !saving
      ? "border-app-brand bg-app-brand text-white hover:border-app-brand-hover hover:bg-app-brand-hover"
      : "border-app-border bg-app-surface text-app-text-muted";

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed ${stateClassName} ${className}`}
      {...rest}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="h-4 w-4" aria-hidden="true" />
      )}
      {saving ? savingLabel : dirty ? label : cleanLabel}
    </button>
  );
}
