import { useCallback, useState } from 'react';
import { starterWorkService } from '../../../services/starterWorkService';
import type { RankedStarterWorkTask } from '../../starter-work/types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * The hire's side of goal-setting: fetching their ranked candidate tasks and claiming one.
 *
 * Matches are fetched lazily: the ranked list is a local, deterministic computation nobody needs
 * until they are actually choosing a goal.
 */
export function useGoalSelection(projectId: string | undefined, onGoalChanged: () => void | Promise<void>) {
    const [matches, setMatches] = useState<RankedStarterWorkTask[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMatches = useCallback(async () => {
        if (!projectId) {
            setMatches([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            setMatches(await starterWorkService.fetchMyMatches(projectId));
        } catch (err) {
            setError(toMessage(err, 'Could not load your matches.'));
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const claim = useCallback(
        async (taskId: string): Promise<boolean> => {
            if (!projectId) return false;
            setIsClaiming(true);
            setError(null);
            try {
                await starterWorkService.claimGoal(projectId, taskId);
                // Claiming widens the path's target set, so the graph itself changes.
                await onGoalChanged();
                return true;
            } catch (err) {
                setError(toMessage(err, 'Could not set that as your goal.'));
                return false;
            } finally {
                setIsClaiming(false);
            }
        },
        [projectId, onGoalChanged]
    );

    const clear = useCallback(async (): Promise<boolean> => {
        if (!projectId) return false;
        setIsClaiming(true);
        setError(null);
        try {
            await starterWorkService.clearGoal(projectId);
            await onGoalChanged();
            return true;
        } catch (err) {
            setError(toMessage(err, 'Could not clear your goal.'));
            return false;
        } finally {
            setIsClaiming(false);
        }
    }, [projectId, onGoalChanged]);

    return { matches, isLoading, isClaiming, error, loadMatches, claim, clear };
}
