import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatSidebar } from '../../../../src/features/chatbot/components/ChatSidebar';
import type { Chat } from '../../../../src/features/chatbot/types';

describe('ChatSidebar', () => {
    const mockChats: Chat[] = [
        { id: 'chat1', userId: 'user1', createdAt: new Date().toISOString(), title: 'First chat' },
        { id: 'chat2', userId: 'user1', createdAt: new Date(Date.now() - 86400000).toISOString(), title: '' },
    ];

    it('renders chat list', () => {
        render(
            <MemoryRouter>
                <ChatSidebar chats={mockChats} setSidebarOpen={vi.fn()} />
            </MemoryRouter>,
        );

        expect(screen.getByText('New Chat')).toBeInTheDocument();
        expect(screen.getByText('Recent Chats')).toBeInTheDocument();
        expect(screen.getByText('First chat')).toBeInTheDocument();
        expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('calls setSidebarOpen when a chat is clicked', async () => {
        const user = userEvent.setup();
        const setSidebarOpen = vi.fn();
        render(
            <MemoryRouter>
                <ChatSidebar chats={mockChats} setSidebarOpen={setSidebarOpen} />
            </MemoryRouter>,
        );

        await user.click(screen.getByText('First chat'));
        expect(setSidebarOpen).toHaveBeenCalledWith(false);
    });
});
