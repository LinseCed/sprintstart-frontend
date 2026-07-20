import { useCallback, useEffect, useState } from 'react';
import { blueprintService } from '../../../services/blueprintService';
import type { BlueprintOutcome, BlueprintProposal } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Drives the blueprint proposal queue: generate, review, approve/reject.
 *
 * Every mutation reloads the queue from the backend rather than patching local
 * state, because approving a version has server-side consequences beyond the row
 * that changed (it becomes the ACTIVE baseline and supersedes the previous one).
 */
export function useBlueprintAuthoring() {
    const [blueprints, setBlueprints] = useState<BlueprintProposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outcomes, setOutcomes] = useState<BlueprintOutcome[] | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setBlueprints((await blueprintService.fetchProposed()).blueprints);
        } catch (err) {
            setError(toMessage(err, 'Could not load proposed blueprints.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    const generate = useCallback(async () => {
        setIsGenerating(true);
        setError(null);
        setOutcomes(null);
        try {
            setOutcomes((await blueprintService.generate()).outcomes);
            await load();
        } catch (err) {
            setError(toMessage(err, 'Could not generate blueprints.'));
        } finally {
            setIsGenerating(false);
        }
    }, [load]);

    const act = useCallback(
        async (action: () => Promise<unknown>, fallback: string) => {
            setError(null);
            try {
                await action();
                await load();
            } catch (err) {
                setError(toMessage(err, fallback));
            }
        },
        [load],
    );

    return {
        blueprints,
        isLoading,
        isGenerating,
        error,
        outcomes,
        generate,
        reload: load,
        approve: (scope: string, version: string) =>
            act(() => blueprintService.approve(scope, version), 'Could not approve this blueprint.'),
        reject: (scope: string, version: string) =>
            act(() => blueprintService.reject(scope, version), 'Could not reject this blueprint.'),
        approveStep: (proposalId: string) =>
            act(() => blueprintService.approveStep(proposalId), 'Could not approve this step.'),
        rejectStep: (proposalId: string) =>
            act(() => blueprintService.rejectStep(proposalId), 'Could not reject this step.'),
    };
}
