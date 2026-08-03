import { useCallback, useEffect, useState } from 'react';
import { arrivalService } from '../../../services/arrivalService';
import type {
    ArrivalStep,
    CreateArrivalStepRequest,
    DerivableArrivalStep,
    UpdateArrivalStepRequest,
} from '../types';

/**
 * The company-wide arrival step list, for the people who author it.
 *
 * Company-scoped only, which is all A0 supports: per-project additions are A3. The scope is passed
 * explicitly as `null` rather than left implicit so that widening it later is a change of argument
 * rather than a change of meaning.
 *
 * The derivable catalog is loaded with the list rather than separately, because its `added` flags
 * describe that same list and the two going out of step would offer to add something twice.
 */
export function useArrivalAuthoring() {
    const [steps, setSteps] = useState<ArrivalStep[] | null>(null);
    const [derivable, setDerivable] = useState<DerivableArrivalStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [writeError, setWriteError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            // Settled separately: the authored list is the page, and the catalog is an offer on top
            // of it. A catalog that will not load must not take the list down with it.
            const [authored, catalog] = await Promise.allSettled([
                arrivalService.listSteps(null),
                arrivalService.listDerivableSteps(),
            ]);

            if (authored.status === 'rejected') throw authored.reason;
            setSteps(authored.value);
            setDerivable(catalog.status === 'fulfilled' ? catalog.value : []);
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

    /**
     * Adds a step the system can check for itself, using its suggested wording.
     *
     * Nothing about *how* it is settled is sent: the backend binds a known key to its derivation
     * and overrides `settledBy` and `selfConfirmable` whatever a caller asks for, so sending them
     * here would be a second opinion that never wins. The wording is only a starting point — it is
     * an ordinary step afterwards, editable and removable like any other.
     */
    const addDerivable = useCallback(
        async (derivation: DerivableArrivalStep) =>
            await write(
                async () =>
                    await arrivalService.createStep({
                        key: derivation.key,
                        title: derivation.suggestedTitle,
                        description: derivation.suggestedDescription,
                    }),
                'That step could not be added. It may already be on the list.',
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

    return {
        steps,
        derivable,
        loading,
        error,
        writeError,
        create,
        addDerivable,
        update,
        move,
        remove,
        reload: load,
    };
}
