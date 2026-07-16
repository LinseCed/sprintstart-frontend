import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGithubTokens } from '../../../../src/features/settings/hooks/useGithubTokens';

vi.mock('../../../../src/services/sources/githubService', () => ({
    getGithubPatNames: vi.fn(),
}));

import { getGithubPatNames } from '../../../../src/services/sources/githubService';

describe('useGithubTokens', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads token names on mount', async () => {
        vi.mocked(getGithubPatNames).mockResolvedValue(['default', 'ci']);

        const { result } = renderHook(() => useGithubTokens());

        await waitFor(() => expect(result.current.tokensLoaded).toBe(true));
        expect(result.current.tokenNames).toEqual(['default', 'ci']);
        expect(result.current.tokensError).toBeNull();
    });

    it('surfaces an error message when loading fails', async () => {
        vi.mocked(getGithubPatNames).mockRejectedValue(new Error('Network down'));

        const { result } = renderHook(() => useGithubTokens());

        await waitFor(() => expect(result.current.tokensLoaded).toBe(true));
        expect(result.current.tokensError).toBe('Network down');
        expect(result.current.tokenNames).toEqual([]);
    });

    it('reloads token names via loadTokenNames', async () => {
        vi.mocked(getGithubPatNames)
            .mockResolvedValueOnce(['a'])
            .mockResolvedValueOnce(['a', 'b']);

        const { result } = renderHook(() => useGithubTokens());

        await waitFor(() => expect(result.current.tokenNames).toEqual(['a']));

        await result.current.loadTokenNames();

        await waitFor(() => expect(result.current.tokenNames).toEqual(['a', 'b']));
    });
});
