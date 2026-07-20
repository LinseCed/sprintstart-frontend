import { useCallback, useEffect, useState } from 'react';
import { starterWorkService } from '../../../services/starterWorkService';
import type { GenerateStarterWorkResult, StarterWorkTask } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Owns the PM's starter-work review queue: mining new proposals and deciding on each one.
 *
 * Mirrors `useGraphAuthoring` deliberately -- it is the same proposal-only lifecycle, and a PM
 * reviewing AI output should not have to learn two different shapes. A decided task is no longer
 * PROPOSED, so it leaves local state immediately rather than waiting on a refetch.
 */
export function useStarterWorkReview() {
    const [tasks, setTasks] = useState<StarterWorkTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generateResult, setGenerateResult] = useState<GenerateStarterWorkResult | null>(null);

    const loadProposed = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const proposed = await starterWorkService.fetchProposed();
            setTasks(proposed.tasks);
        } catch (err) {
            setError(toMessage(err, 'Could not load starter tasks.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await loadProposed();
        })();
    }, [loadProposed]);

    const generate = useCallback(async () => {
        setIsGenerating(true);
        setError(null);
        setGenerateResult(null);
        try {
            const result = await starterWorkService.generate();
            setGenerateResult(result);
            await loadProposed();
        } catch (err) {
            setError(toMessage(err, 'Could not mine starter tasks.'));
        } finally {
            setIsGenerating(false);
        }
    }, [loadProposed]);

    const approve = useCallback(async (id: string) => {
        await starterWorkService.approve(id);
        setTasks(prev => prev.filter(task => task.id !== id));
    }, []);

    const reject = useCallback(async (id: string, reason?: string) => {
        await starterWorkService.reject(id, reason);
        setTasks(prev => prev.filter(task => task.id !== id));
    }, []);

    return { tasks, isLoading, isGenerating, error, generateResult, generate, approve, reject };
}
