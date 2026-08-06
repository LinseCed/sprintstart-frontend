import { useId, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { ProjectRoleRef } from "../../../services/projectService";
import type { ProjectRole } from "../../team-management/types";

type ProjectRoleEditorProps = {
  userId: string;
  displayName: string;
  /** What this person holds *on this project*. Empty is a real state, not a missing one. */
  heldRoles: ProjectRoleRef[];
  availableRoles: ProjectRole[];
  /** `${userId}:${roleId}` of the change in flight, so only its own control shows a spinner. */
  savingKey: string | null;
  onAddRole: (userId: string, roleId: string) => void;
  onRemoveRole: (userId: string, roleId: string) => void;
};

/**
 * Sets what somebody does *on this project*.
 *
 * Lives on the project surface because that is where the project is already in hand — a role is
 * held on a project, so an editor without one would have to ask which. Somebody who ships code on
 * one project and runs delivery on another holds a different role on each, and the onboarding
 * vocabulary derived from it follows the project.
 *
 * "No role yet" is shown rather than hidden: an unroled member is onboarded in the default wording,
 * and the setup ladder reports it, so it should be visible where it can be fixed.
 */
export function ProjectRoleEditor({
  userId,
  displayName,
  heldRoles,
  availableRoles,
  savingKey,
  onAddRole,
  onRemoveRole,
}: ProjectRoleEditorProps) {
  const selectId = useId();
  const [picked, setPicked] = useState("");

  const heldIds = new Set(heldRoles.map((role) => role.id));
  const addable = availableRoles.filter((role) => !heldIds.has(role.id));
  const isSaving = savingKey !== null && savingKey.startsWith(`${userId}:`);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-app-border pt-2">
      <span className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
        On this project
      </span>

      {heldRoles.length === 0 && (
        <span className="text-xs text-app-text-disabled">
          No role yet — onboards in the default wording.
        </span>
      )}

      {heldRoles.map((role) => {
        const removing = savingKey === `${userId}:${role.id}`;
        return (
          <span
            key={role.id}
            className="inline-flex items-center gap-1 rounded-full bg-app-brand/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-app-brand-text"
          >
            {role.name}
            <button
              type="button"
              onClick={() => onRemoveRole(userId, role.id)}
              disabled={isSaving}
              className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-app-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${role.name} from ${displayName} on this project`}
            >
              {removing ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          </span>
        );
      })}

      {addable.length > 0 && (
        <span className="flex items-center gap-1">
          <label htmlFor={`${selectId}-${userId}`} className="sr-only">
            Add a role for {displayName} on this project
          </label>
          <select
            id={`${selectId}-${userId}`}
            value={picked}
            onChange={(event) => setPicked(event.target.value)}
            disabled={isSaving}
            className="rounded-lg border border-app-border bg-app-surface px-2 py-1 text-xs text-app-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Add a role…</option>
            {addable.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!picked) return;
              onAddRole(userId, picked);
              setPicked("");
            }}
            disabled={!picked || isSaving}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Add the selected role to ${displayName} on this project`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </span>
      )}
    </div>
  );
}
