import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAiStream } from '../../../../src/features/ai-activity/useAiStream';
import * as aiStreamService from '../../../../src/services/aiStreamService';
import type { AiStreamHandlers } from '../../../../src/services/aiStreamService';

describe('useAiStream', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('collects stage/item/warning lines and resolves true on done', async () => {
        vi.spyOn(aiStreamService, 'streamAiProgress').mockImplementation(
            (_endpoint: string, handlers: AiStreamHandlers) => {
                handlers.onEvent({ type: 'stage', label: 'Searching' });
                handlers.onEvent({ type: 'item', label: 'A page' });
                // done/error carry no log line.
                handlers.onDone();
                return Promise.resolve();
            }
        );

        const { result } = renderHook(() => useAiStream());

        let resolved: boolean | undefined;
        await act(async () => {
            resolved = await result.current.start('/x');
        });

        expect(resolved).toBe(true);
        expect(result.current.phase).toBe('done');
        expect(result.current.entries.map((e) => e.label)).toEqual(['Searching', 'A page']);
        // The terminal events themselves never become log lines (kinds are stage/item/warning only).
        expect(result.current.entries.map((e) => e.kind)).toEqual(['stage', 'item']);
    });

    it('resolves false and surfaces the message on error', async () => {
        vi.spyOn(aiStreamService, 'streamAiProgress').mockImplementation(
            (_endpoint: string, handlers: AiStreamHandlers) => {
                handlers.onError('AI is down');
                return Promise.resolve();
            }
        );

        const { result } = renderHook(() => useAiStream());

        let resolved: boolean | undefined;
        await act(async () => {
            resolved = await result.current.start('/x');
        });

        expect(resolved).toBe(false);
        await waitFor(() => expect(result.current.phase).toBe('error'));
        expect(result.current.errorMessage).toBe('AI is down');
    });

    it('reset clears the log back to idle', async () => {
        vi.spyOn(aiStreamService, 'streamAiProgress').mockImplementation(
            (_endpoint: string, handlers: AiStreamHandlers) => {
                handlers.onEvent({ type: 'stage', label: 'Searching' });
                handlers.onDone();
                return Promise.resolve();
            }
        );

        const { result } = renderHook(() => useAiStream());
        await act(async () => {
            await result.current.start('/x');
        });
        act(() => result.current.reset());

        expect(result.current.phase).toBe('idle');
        expect(result.current.entries).toEqual([]);
    });
});
