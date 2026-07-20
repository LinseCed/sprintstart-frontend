import { useCallback, useEffect, useState } from 'react';
import { competencyModuleService } from '../../../services/competencyModuleService';
import type { CompetencyModule } from '../../competency-module/types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/** The not-yet-live module for a competency: a DRAFT being written or a PROPOSED awaiting review. */
export type PendingModule = {
    moduleId: string;
    status: 'DRAFT' | 'PROPOSED';
};

/**
 * The PM's side of module authoring on `/my-path`: knowing which competencies already have an
 * unpublished module in flight, and creating one for those that don't.
 *
 * A path node only carries `moduleId` for an ACTIVE module, so without this a PM has no way to
 * tell "no module exists" from "a draft is half-written" -- and `create` always mints a new
 * version, so offering "create" unconditionally would spawn duplicate drafts. This fetches the
 * project's DRAFT and PROPOSED modules once and keys them by competency, so the panel can offer
 * "continue the draft" instead.
 *
 * Only meaningful for authors; `enabled` keeps hires from paying for a fetch they can't act on.
 */
export function useModuleAuthoring(projectId: string | undefined, enabled: boolean) {
    const [pendingByKey, setPendingByKey] = useState<Map<string, PendingModule>>(new Map());
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!projectId || !enabled) {
            setPendingByKey(new Map());
            return;
        }
        try {
            // A competency has at most one non-active module in flight (approve archives the rest),
            // so DRAFT and PROPOSED never collide on the same key.
            const [drafts, proposed] = await Promise.all([
                competencyModuleService.list(projectId, 'DRAFT'),
                competencyModuleService.list(projectId, 'PROPOSED')
            ]);
            const next = new Map<string, PendingModule>();
            for (const module of drafts.modules) {
                next.set(module.competencyKey, { moduleId: module.id, status: 'DRAFT' });
            }
            for (const module of proposed.modules) {
                next.set(module.competencyKey, { moduleId: module.id, status: 'PROPOSED' });
            }
            setPendingByKey(next);
        } catch {
            // A failed lookup shouldn't blank the graph; the panel just falls back to offering
            // creation, and the backend's own version counter prevents real corruption.
            setPendingByKey(new Map());
        }
    }, [projectId, enabled]);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    const create = useCallback(
        async (
            competencyKey: string,
            competencyLabel: string,
            mode: 'blank' | 'ai'
        ): Promise<CompetencyModule | null> => {
            if (!projectId) return null;
            setIsBusy(true);
            setError(null);
            try {
                const module =
                    mode === 'ai'
                        ? await competencyModuleService.proposeFromCorpus(competencyKey, projectId)
                        : await competencyModuleService.createVersion({
                              competencyKey,
                              projectId,
                              title: competencyLabel
                          });
                await load();
                return module;
            } catch (err) {
                setError(toMessage(err, 'Could not create a module.'));
                return null;
            } finally {
                setIsBusy(false);
            }
        },
        [projectId, load]
    );

    return { pendingByKey, isBusy, error, create, reload: load };
}
