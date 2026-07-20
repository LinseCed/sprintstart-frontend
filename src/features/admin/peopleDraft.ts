import { projectService } from "../../services/projectService";
import type { ProjectManager } from "../../services/projectService";
import type { ProjectUser } from "./types";

/**
 * Pending people changes, expressed as a diff against a server snapshot.
 *
 * `snapshotKey` fingerprints the server state the diff was computed against, so
 * data arriving from elsewhere automatically invalidates a stale draft instead
 * of being silently applied on top of it. Same idiom as `ConnectorSourcesSection`.
 *
 * `managerId` is `undefined` while untouched, which is distinct from `null` —
 * the latter means "clear the manager assignment".
 */
export type PeopleDraft = {
  snapshotKey: string;
  addedUserIds: Set<string>;
  removedUserIds: Set<string>;
  managerId: string | null | undefined;
};

export function buildPeopleSnapshotKey(
  members: ProjectUser[],
  manager: ProjectManager | null,
): string {
  const memberIds = members
    .map((member) => member.id)
    .sort()
    .join(",");

  return `${memberIds}|${manager?.id ?? ""}`;
}

export function createEmptyPeopleDraft(snapshotKey: string): PeopleDraft {
  return {
    snapshotKey,
    addedUserIds: new Set(),
    removedUserIds: new Set(),
    managerId: undefined,
  };
}

/** Returns the draft if it still matches the snapshot, otherwise an empty one. */
export function resolvePeopleDraft(
  draft: PeopleDraft,
  snapshotKey: string,
): PeopleDraft {
  return draft.snapshotKey === snapshotKey
    ? draft
    : createEmptyPeopleDraft(snapshotKey);
}

export function countPeopleChanges(draft: PeopleDraft): number {
  return (
    draft.addedUserIds.size +
    draft.removedUserIds.size +
    (draft.managerId === undefined ? 0 : 1)
  );
}

/** Stages a user for assignment, or cancels a staged removal. */
export function stageAddUser(draft: PeopleDraft, userId: string): PeopleDraft {
  const addedUserIds = new Set(draft.addedUserIds);
  const removedUserIds = new Set(draft.removedUserIds);

  if (removedUserIds.has(userId)) {
    removedUserIds.delete(userId);
  } else {
    addedUserIds.add(userId);
  }

  return { ...draft, addedUserIds, removedUserIds };
}

/** Toggles a user between staged-for-removal and unchanged. */
export function stageToggleRemoveUser(
  draft: PeopleDraft,
  userId: string,
): PeopleDraft {
  const addedUserIds = new Set(draft.addedUserIds);
  const removedUserIds = new Set(draft.removedUserIds);

  if (addedUserIds.has(userId)) {
    addedUserIds.delete(userId);
  } else if (removedUserIds.has(userId)) {
    removedUserIds.delete(userId);
  } else {
    removedUserIds.add(userId);
  }

  return { ...draft, addedUserIds, removedUserIds };
}

export function stageManager(
  draft: PeopleDraft,
  managerId: string | null,
): PeopleDraft {
  return { ...draft, managerId };
}

/**
 * Applies a people draft to the backend.
 *
 * The order is load-bearing: additions run first so a newly added person can be
 * promoted in the same save, and removals run last because the backend rejects
 * removing whoever currently manages the project.
 */
export async function applyPeopleChanges(
  projectId: string,
  draft: PeopleDraft,
): Promise<void> {
  if (draft.addedUserIds.size > 0) {
    await projectService.assignUsersToProject(projectId, {
      userIds: [...draft.addedUserIds],
    });
  }

  if (draft.managerId !== undefined) {
    if (draft.managerId === null) {
      await projectService.clearProjectManager(projectId);
    } else {
      await projectService.setProjectManager(projectId, draft.managerId);
    }
  }

  for (const userId of draft.removedUserIds) {
    await projectService.removeUserFromProject(projectId, userId);
  }
}
