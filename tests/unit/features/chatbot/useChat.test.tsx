/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChat } from '../../../../src/features/chatbot/hooks/useChat';
import * as chatService from '../../../../src/services/chatService';
import { userService } from '../../../../src/services/userService';
import * as reactRouterDom from 'react-router-dom';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useParams: vi.fn(),
}));

vi.mock('../../../../src/services/chatService', () => ({
    getChats: vi.fn(),
    createChat: vi.fn(),
    getMessages: vi.fn(),
    streamMessage: vi.fn()
}));

vi.mock('../../../../src/services/userService', () => ({
    userService: {
        getProfile: vi.fn()
    }
}));

describe('useChat', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
        vi.mocked(reactRouterDom.useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(reactRouterDom.useParams).mockReturnValue({ id: 'chat1' });
    });

    it('fetches chats and user profile on mount', async () => {
        const mockChats = [{ id: 'chat1', userId: 'user1' }, { id: 'chat2', userId: 'user2' }];
        vi.mocked(chatService.getChats).mockResolvedValue({ chats: mockChats } as any);
        vi.mocked(userService.getProfile).mockResolvedValue({ id: 'user1' } as any);
        vi.mocked(chatService.getMessages).mockResolvedValue({ messages: [] });

        const { result } = renderHook(() => useChat());

        await waitFor(() => {
            // Should filter chats to only include the user's chats
            expect(result.current.chats).toEqual([{ id: 'chat1', userId: 'user1' }]);
        });

        expect(chatService.getChats).toHaveBeenCalled();
        expect(userService.getProfile).toHaveBeenCalled();
    });

    it('loads messages when chat is selected', async () => {
        vi.mocked(chatService.getChats).mockResolvedValue({ chats: [] });
        vi.mocked(userService.getProfile).mockResolvedValue({ id: 'user1' } as any);
        
        const mockMessages = [{ id: 'msg1', content: 'test', role: 'USER', chat: null }];
        vi.mocked(chatService.getMessages).mockResolvedValue({ messages: mockMessages as any });

        const { result } = renderHook(() => useChat());

        await waitFor(() => {
            expect(result.current.messages).toEqual(mockMessages);
        });

        expect(chatService.getMessages).toHaveBeenCalledWith('chat1');
    });

    it('handles optimistic UI and streaming flow when adding a message', async () => {
        // Start without a chatId to trigger createChat
        vi.mocked(reactRouterDom.useParams).mockReturnValue({ id: undefined });
        vi.mocked(chatService.getChats).mockResolvedValue({ chats: [] });
        vi.mocked(userService.getProfile).mockResolvedValue({ id: 'user1' } as any);
        vi.mocked(chatService.getMessages).mockResolvedValue({ messages: [] });
        vi.mocked(chatService.createChat).mockResolvedValue({ id: 'newChatId' } as any);

        vi.mocked(chatService.streamMessage).mockImplementation(async (_chatId, _text, handlers) => {
            await Promise.resolve();
            // Simulate stream tokens asynchronously
            setTimeout(() => {
                handlers.onToken('Hello ');
                handlers.onToken('world');
                handlers.onCitation({ chunk_id: '1', filename: 'file.txt', section_path: '' });
                handlers.onDone();
            }, 10);
        });

        // Mock navigate to update the params mock so the component sees the new chatId
        mockNavigate.mockImplementation((path: string) => {
            if (path.startsWith('/chat/')) {
                const newId = path.split('/chat/')[1];
                vi.mocked(reactRouterDom.useParams).mockReturnValue({ id: newId });
            }
        });

        const { result } = renderHook(() => useChat());

        await waitFor(() => {
            expect(result.current.chats).toBeDefined();
        });

        await act(async () => {
            await result.current.addMessage('My new prompt');
        });

        await waitFor(() => {
            expect(result.current.messages.length).toBe(2);
            expect(result.current.messages[1].content).toBe('Hello world');
        });
        
        const userMsg = result.current.messages[0];
        expect(userMsg.role).toBe('USER');
        expect(userMsg.content).toBe('My new prompt');

        const aiMsg = result.current.messages[1];
        expect(aiMsg.role).toBe('ASSISTANT');
        expect(aiMsg.citations?.length).toBe(1);
        expect(aiMsg.citations?.[0].filename).toBe('file.txt');
    });

    it('shows subway surfers brainrot timeout mechanic', async () => {
        vi.useFakeTimers();
        
        vi.mocked(chatService.getChats).mockResolvedValue({ chats: [{ id: 'chat1', userId: 'user1' }] as any });
        vi.mocked(userService.getProfile).mockResolvedValue({ id: 'user1' } as any);
        vi.mocked(chatService.getMessages).mockResolvedValue({ messages: [] });

        let resolveStream: () => void = () => {};
        vi.mocked(chatService.streamMessage).mockImplementation(() => {
            // Stay in thinking state until resolved manually
            return new Promise((resolve) => {
                resolveStream = resolve as () => void;
            });
        });

        const { result } = renderHook(() => useChat());

        // Use act to flush initial fetch
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        act(() => {
            // Fire and forget so we don't block
            result.current.addMessage('Taking a long time').catch(() => {});
        });

        expect(result.current.isThinking).toBe(true);
        expect(result.current.showBrainrot).toBe(false);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(4500);
        });

        expect(result.current.showBrainrot).toBe(true);
        expect(result.current.timestamp).toBeDefined();

        resolveStream();
        vi.useRealTimers();
    });
});
