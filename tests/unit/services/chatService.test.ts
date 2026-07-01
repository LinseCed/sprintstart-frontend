/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChats, createChat, getMessages, streamMessage } from '../../../src/services/chatService';
import { apiClient } from '../../../src/services/apiClient';
import keycloak from '../../../src/config/keycloak';

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: vi.fn()
    }
}));

vi.mock('../../../src/config/keycloak', () => ({
    default: {
        authenticated: true,
        token: 'test-token',
        updateToken: vi.fn().mockResolvedValue(true),
        login: vi.fn().mockResolvedValue(undefined),
    }
}));

describe('chatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    describe('REST endpoints', () => {
        it('getChats fetches chats successfully', async () => {
            const mockResponse = { chats: [{ id: 'chat1', userId: 'user1' }] };
            vi.mocked(apiClient.fetch).mockResolvedValue(mockResponse as any);

            const result = await getChats();
            expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/chats');
            expect(result).toEqual(mockResponse);
        });

        it('createChat creates a new chat successfully', async () => {
            const mockResponse = { id: 'chat2', userId: 'user1' };
            vi.mocked(apiClient.fetch).mockResolvedValue(mockResponse as any);

            const result = await createChat('user1');
            expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/chats', {
                method: 'POST',
                body: JSON.stringify({ userId: 'user1' }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('getMessages fetches messages successfully', async () => {
            const mockResponse = { messages: [{ id: 'msg1', content: 'hello' }] };
            vi.mocked(apiClient.fetch).mockResolvedValue(mockResponse as any);

            const result = await getMessages('chat1');
            expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/chats/chat1');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('streamMessage', () => {
        it('updates keycloak token before streaming if authenticated', async () => {
            keycloak.authenticated = true;
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: { getReader: () => ({ read: vi.fn().mockResolvedValue({ done: true }) }) }
            });

            await streamMessage('chat1', 'hello', { onToken: vi.fn(), onCitation: vi.fn(), onDone: vi.fn() });
            expect(keycloak.updateToken).toHaveBeenCalledWith(30);
        });

        it('calls login if token refresh fails', async () => {
            keycloak.authenticated = true;
            vi.mocked(keycloak.updateToken).mockRejectedValueOnce(new Error('Refresh failed'));

            await streamMessage('chat1', 'hello', { onToken: vi.fn(), onCitation: vi.fn(), onDone: vi.fn() });
            expect(keycloak.login).toHaveBeenCalled();
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('calls onError if response is not ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
            });

            const onError = vi.fn();
            await streamMessage('chat1', 'hello', { onToken: vi.fn(), onCitation: vi.fn(), onDone: vi.fn(), onError });
            
            expect(onError).toHaveBeenCalledWith('HTTP error! status: 500');
        });

        it('processes stream events correctly', async () => {
            // Encode mock SSE data
            const encoder = new TextEncoder();
            const chunk1 = encoder.encode(`data: {"type":"token","content":"hel"}\n\ndata: {"type":"token","content":"lo"}\n\n`);
            const chunk2 = encoder.encode(`data: {"type":"citation","chunk_id":"c1","filename":"doc.txt","section_path":"p1"}\n\n`);
            const chunk3 = encoder.encode(`data: {"type":"done"}\n\n`);

            const mockReader = {
                read: vi.fn()
                    .mockResolvedValueOnce({ done: false, value: chunk1 })
                    .mockResolvedValueOnce({ done: false, value: chunk2 })
                    .mockResolvedValueOnce({ done: false, value: chunk3 })
                    .mockResolvedValueOnce({ done: true })
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: { getReader: () => mockReader }
            });

            const onToken = vi.fn();
            const onCitation = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await streamMessage('chat1', 'hello', { onToken, onCitation, onDone, onError });

            expect(global.fetch).toHaveBeenCalledWith('/api/v1/chats/prompt', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ chatId: 'chat1', msg: 'hello' })
            }));

            expect(onToken).toHaveBeenCalledTimes(2);
            expect(onToken).toHaveBeenNthCalledWith(1, 'hel');
            expect(onToken).toHaveBeenNthCalledWith(2, 'lo');

            expect(onCitation).toHaveBeenCalledTimes(1);
            expect(onCitation).toHaveBeenCalledWith({
                chunk_id: 'c1',
                filename: 'doc.txt',
                section_path: 'p1'
            });

            expect(onDone).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();
        });

        it('handles stream error event', async () => {
            const encoder = new TextEncoder();
            const errorChunk = encoder.encode(`data: {"type":"error","message":"Model overload"}\n\n`);

            const mockReader = {
                read: vi.fn()
                    .mockResolvedValueOnce({ done: false, value: errorChunk })
                    .mockResolvedValueOnce({ done: true })
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: { getReader: () => mockReader }
            });

            const onError = vi.fn();
            await streamMessage('chat1', 'hello', { onToken: vi.fn(), onCitation: vi.fn(), onDone: vi.fn(), onError });

            expect(onError).toHaveBeenCalledWith('Model overload');
        });
    });
});
