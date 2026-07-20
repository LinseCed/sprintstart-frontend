import { useCallback, useEffect, useState } from 'react';
import { competencyModuleService } from '../../../services/competencyModuleService';
import type { CompetencyModule, ModulePageKind } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Drives the module editor: load, edit pages, reorder, publish.
 *
 * Every mutation reloads the module from the backend rather than patching local
 * state. Positions are renumbered server-side on every write, and publishing
 * archives the previous version, so a locally patched copy would drift from what
 * the next reader actually gets.
 */
export function useModuleEditor(moduleId: string | null) {
    const [module, setModule] = useState<CompetencyModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        if (!moduleId) return;
        setIsLoading(true);
        setError(null);
        try {
            setModule(await competencyModuleService.get(moduleId));
        } catch (err) {
            setError(toMessage(err, 'Could not load this module.'));
        } finally {
            setIsLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    const act = useCallback(
        async (action: () => Promise<unknown>, fallback: string) => {
            setIsSaving(true);
            setError(null);
            try {
                await action();
                await load();
            } catch (err) {
                setError(toMessage(err, fallback));
            } finally {
                setIsSaving(false);
            }
        },
        [load]
    );

    return {
        module,
        isLoading,
        isSaving,
        error,
        reload: load,

        addPage: (kind: ModulePageKind, title: string) =>
            act(
                () => competencyModuleService.addPage(moduleId as string, { kind, title, body: '' }),
                'Could not add the page.'
            ),

        updatePage: (pageId: string, input: { kind?: ModulePageKind; title?: string; body?: string }) =>
            act(() => competencyModuleService.updatePage(pageId, input), 'Could not save the page.'),

        deletePage: (pageId: string) =>
            act(() => competencyModuleService.deletePage(pageId), 'Could not delete the page.'),

        /**
         * Moves one page by [offset] and sends the **whole** resulting order in a
         * single call -- the backend rejects a partial list rather than guessing
         * where the omitted pages go.
         */
        movePage: (pageId: string, offset: number) => {
            const pages = module?.pages ?? [];
            const from = pages.findIndex(page => page.id === pageId);
            const to = from + offset;
            if (from < 0 || to < 0 || to >= pages.length) return Promise.resolve();

            const ordered = pages.map(page => page.id);
            const [moved] = ordered.splice(from, 1);
            ordered.splice(to, 0, moved);

            return act(
                () => competencyModuleService.reorderPages(moduleId as string, ordered),
                'Could not reorder the pages.'
            );
        },

        approve: () =>
            act(() => competencyModuleService.approve(moduleId as string), 'Could not publish this module.'),

        reject: () =>
            act(() => competencyModuleService.reject(moduleId as string), 'Could not archive this module.')
    };
}
