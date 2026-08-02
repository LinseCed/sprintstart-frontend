import { useCallback, useEffect, useState } from 'react';
import { arrivalService } from '../../../services/arrivalService';
import type { ArrivalStep, CreateArrivalStepRequest, UpdateArrivalStepRequest } from '../types';

/**
 * The company-wide arrival step list, for the people who author it.
 *
 * Company-scoped only, which is all A0 supports: per-project additions are A3. The scope is passed
 * explicitly as `null` rather than left implicit so that widening it later is a change of argument
 * rather than a change of meaning.
 */
export function useArrivalAuthoring() {
    const [steps, setSteps] = useState<ArrivalStep[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [writeError, setWriteError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            setSteps(await arrivalService.listSteps(null));
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Deferred to a microtask: React 19 rejects a synchronous first setState in an effect body,
        // and this is the pattern the rest of the app uses for it.
        void (async () => {
            await load();
        })();
    }, [load]);

    /** Runs a write, then re-reads — the server owns ordering and normalisation, not this hook. */
    const write = useCallback(
        async (action: () => Promise<unknown>, failureMessage: string): Promise<boolean> => {
            setWriteError(null);
            try {
                await action();
                await load();
                return true;
            } catch {
                setWriteError(failureMessage);
                return false;
            }
        },
        [load],
    );

    const create = useCallback(
        async (request: CreateArrivalStepRequest) =>
            await write(
                async () => await arrivalService.createStep(request),
                'That step could not be added. A step with that key may already exist.',
            ),
        [write],
    );

    const update = useCallback(
        async (key: string, request: UpdateArrivalStepRequest) =>
            await write(
                async () => await arrivalService.updateStep(key, request, null),
                'That change could not be saved.',
            ),
        [write],
    );

    /**
     * Moves one step, and sends the **whole** resulting order.
     *
     * Never a from/to pair: two people reordering at once cannot then interleave into an order
     * neither of them chose.
     */
    const move = useCallback(
        async (key: string, direction: 'up' | 'down') => {
            if (!steps) return false;
            const index = steps.findIndex((step) => step.key === key);
            const target = direction === 'up' ? index - 1 : index + 1;
            if (index === -1 || target < 0 || target >= steps.length) return false;

            const reordered = [...steps];
            [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

            return await write(
                async () => await arrivalService.reorderSteps(
                    reordered.map((step) => step.key),
                    null,
                ),
                'That order could not be saved.',
            );
        },
        [steps, write],
    );

    const remove = useCallback(
        async (key: string) =>
            await write(
                async () => await arrivalService.deleteStep(key, null),
                'That step could not be removed.',
            ),
        [write],
    );

    return { steps, loading, error, writeError, create, update, move, remove, reload: load };
}
