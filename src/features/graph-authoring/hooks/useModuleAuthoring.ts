import { useCallback, useEffect, useState } from 'react';
import { competencyModuleService } from '../../../services/competencyModuleService';
import { useAiStream } from '../../ai-activity/useAiStream';
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
 * What has been authored for one competency in one project.
 *
 * `activeModuleId` is what a hire would open; `pending` is what a PM would continue. A node with
 * neither has nothing to teach and no check to unlock it -- which is exactly what a PM needs to
 * see at a glance, and what the live graph itself cannot say (the graph is global, modules are
 * per project).
 */
export type ModuleReadiness = {
    activeModuleId: string | null;
    pending: PendingModule | null;
};

/**
 * Which competency has which module, for one project: the published one, or an unpublished
 * draft in flight -- plus creating one for a competency that has neither.
 *
 * This is what makes the studio canvas mean anything. The live graph is global and carries no
 * module information at all, so without this a PM cannot tell "nothing has ever been written
 * for this node" from "a draft is half-finished". `create` always mints a new version, so
 * offering it unconditionally would spawn duplicate drafts.
 *
 * Only meaningful for authors; `enabled` keeps hires from paying for a fetch they can't act on.
 */
export function useModuleAuthoring(projectId: string | undefined, enabled: boolean) {
    const [readinessByKey, setReadinessByKey] = useState<Map<string, ModuleReadiness>>(new Map());
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Which competency is being AI-drafted right now, so the UI shows the live log against that node.
    const [streamingKey, setStreamingKey] = useState<string | null>(null);
    const { entries: activity, start, reset } = useAiStream();

    const fetchReadiness = useCallback(async (): Promise<Map<string, ModuleReadiness>> => {
        if (!projectId || !enabled) return new Map();
        // A competency has at most one non-active module in flight (approve archives the rest),
        // so DRAFT and PROPOSED never collide on the same key.
        const [active, drafts, proposed] = await Promise.all([
            competencyModuleService.list(projectId, 'ACTIVE'),
            competencyModuleService.list(projectId, 'DRAFT'),
            competencyModuleService.list(projectId, 'PROPOSED')
        ]);
        const next = new Map<string, ModuleReadiness>();
        const entryFor = (key: string): ModuleReadiness =>
            next.get(key) ?? { activeModuleId: null, pending: null };
        for (const module of active.modules) {
            next.set(module.competencyKey, {
                ...entryFor(module.competencyKey),
                activeModuleId: module.id
            });
        }
        for (const module of drafts.modules) {
            next.set(module.competencyKey, {
                ...entryFor(module.competencyKey),
                pending: { moduleId: module.id, status: 'DRAFT' }
            });
        }
        for (const module of proposed.modules) {
            next.set(module.competencyKey, {
                ...entryFor(module.competencyKey),
                pending: { moduleId: module.id, status: 'PROPOSED' }
            });
        }
        return next;
    }, [projectId, enabled]);

    const load = useCallback(async () => {
        try {
            setReadinessByKey(await fetchReadiness());
        } catch {
            // A failed lookup shouldn't blank the canvas; every node then reads as "nothing
            // authored", and the backend's own version counter prevents real corruption.
            setReadinessByKey(new Map());
        }
    }, [fetchReadiness]);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    /** Streams the AI draft for a competency, returning the module it produced (or null). */
    const proposeStreaming = useCallback(
        async (competencyKey: string, targetProjectId: string): Promise<CompetencyModule | null> => {
            setStreamingKey(competencyKey);
            try {
                const endpoint = `/api/v1/onboarding/competency-modules/propose/stream?competencyKey=${encodeURIComponent(
                    competencyKey
                )}&projectId=${encodeURIComponent(targetProjectId)}`;
                // The stream is a view; the module itself is read back afterwards, so a dropped stream
                // still lands the proposal the backend persisted on `done`.
                await start(endpoint);
                const fresh = await fetchReadiness();
                setReadinessByKey(fresh);
                const landed = fresh.get(competencyKey);
                const moduleId = landed?.pending?.moduleId ?? landed?.activeModuleId ?? null;
                return moduleId ? await competencyModuleService.get(moduleId) : null;
            } finally {
                setStreamingKey(null);
                reset();
            }
        },
        [start, reset, fetchReadiness]
    );

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
                if (mode === 'ai') {
                    return await proposeStreaming(competencyKey, projectId);
                }
                const module = await competencyModuleService.createVersion({
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
        [projectId, load, proposeStreaming]
    );

    return { readinessByKey, isBusy, error, create, reload: load, streamingKey, activity };
}
