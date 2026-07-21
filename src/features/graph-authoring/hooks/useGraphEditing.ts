import { useCallback, useState } from 'react';
import { ApiError } from '../../../services/apiClient';
import { competencyGraphService } from '../../../services/competencyGraphService';
import type { CreateCompetencyInput, EdgeKind, LiveCompetency, UpdateCompetencyInput } from '../types';

/**
 * Turns a failed graph write into something a PM can act on, at the point of the gesture.
 *
 * The backend's messages are already specific (they name the two keys in a cycle, the bad level,
 * the missing key), so the useful thing is to *keep* them rather than replace them with a generic
 * "something went wrong" -- and to add the one bit of context a status code carries that the
 * message doesn't.
 */
function toEditingError(error: unknown, fallback: string): string {
    if (!(error instanceof ApiError)) {
        return error instanceof Error ? error.message : fallback;
    }
    const detail = error.message.trim();
    switch (error.status) {
        case 400:
            // Cycles and out-of-range levels land here; the backend names both keys.
            return detail || 'That change isn’t valid.';
        case 403:
            return 'You don’t have permission to change the graph.';
        case 404:
            return detail || 'That competency is no longer in the graph.';
        case 409:
            return detail || 'That already exists.';
        default:
            return detail || fallback;
    }
}

/**
 * The write half of PM graph authoring, used from the studio's node inspector.
 *
 * Deliberately holds no graph state of its own. The studio already owns the live graph and
 * reloads it, so duplicating nodes/edges here would give two sources of truth that drift. This owns only the
 * in-flight flag and the last error, and each mutation resolves to whether it succeeded so the
 * caller can decide what to refresh.
 *
 * Errors are exposed rather than thrown so a caller can render them next to the control that
 * caused them -- a rejected cycle has to be visible at the gesture, not as a toast that outlives
 * the action.
 */
export function useGraphEditing(onGraphChanged: () => void | Promise<void>) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const run = useCallback(
        async (operation: () => Promise<unknown>, fallback: string): Promise<boolean> => {
            setIsSaving(true);
            setError(null);
            try {
                await operation();
                await onGraphChanged();
                return true;
            } catch (err) {
                setError(toEditingError(err, fallback));
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [onGraphChanged]
    );

    // Unlike the others, this needs the created node back (so the studio can select it), which the
    // boolean-returning `run` can't carry -- so it runs the same flow inline and returns the node.
    const createCompetency = useCallback(
        async (input: CreateCompetencyInput): Promise<LiveCompetency | null> => {
            setIsSaving(true);
            setError(null);
            try {
                const created = await competencyGraphService.createCompetency(input);
                await onGraphChanged();
                return created;
            } catch (err) {
                setError(toEditingError(err, 'Could not create this competency.'));
                return null;
            } finally {
                setIsSaving(false);
            }
        },
        [onGraphChanged]
    );

    const updateCompetency = useCallback(
        (key: string, input: UpdateCompetencyInput) =>
            run(
                () => competencyGraphService.updateCompetency(key, input),
                'Could not save this competency.'
            ),
        [run]
    );

    const deleteCompetency = useCallback(
        (key: string) =>
            run(
                () => competencyGraphService.deleteCompetency(key),
                'Could not remove this competency.'
            ),
        [run]
    );

    const addPrerequisite = useCallback(
        (fromKey: string, toKey: string, kind: EdgeKind = 'PREREQUISITE') =>
            run(
                () => competencyGraphService.createEdge(fromKey, toKey, kind),
                'Could not add this prerequisite.'
            ),
        [run]
    );

    const removePrerequisite = useCallback(
        (fromKey: string, toKey: string, kind: EdgeKind = 'PREREQUISITE') =>
            run(
                () => competencyGraphService.deleteEdge(fromKey, toKey, kind),
                'Could not remove this prerequisite.'
            ),
        [run]
    );

    return {
        isSaving,
        error,
        clearError,
        createCompetency,
        updateCompetency,
        deleteCompetency,
        addPrerequisite,
        removePrerequisite,
    };
}
