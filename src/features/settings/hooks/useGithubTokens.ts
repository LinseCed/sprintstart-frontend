import { useCallback, useEffect, useState } from 'react';
import { getGithubPatNames } from '../../../services/sources/githubService';

type UseGithubTokensResult = {
    tokenNames: string[];
    tokensLoaded: boolean;
    tokensError: string | null;
    loadTokenNames: () => Promise<void>;
    isRefreshing: boolean;
};

/**
 * Loads the list of stored GitHub PAT names. Mirrors the slice in
 * `useAdminData` so the user-settings PAT UI behaves identically to the
 * Access Management panel (same global tokens, no backend change).
 */
export function useGithubTokens(): UseGithubTokensResult {
    const [tokenNames, setTokenNames] = useState<string[]>([]);
    const [tokensLoaded, setTokensLoaded] = useState(false);
    const [tokensError, setTokensError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadTokenNames = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const names = await getGithubPatNames();
            setTokenNames(names);
            setTokensLoaded(true);
            setTokensError(null);
        } catch (error) {
            setTokensLoaded(true);
            setTokensError(
                error instanceof Error ? error.message : 'Failed to load tokens.',
            );
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(loadTokenNames);
    }, [loadTokenNames]);

    return { tokenNames, tokensLoaded, tokensError, loadTokenNames, isRefreshing };
}
