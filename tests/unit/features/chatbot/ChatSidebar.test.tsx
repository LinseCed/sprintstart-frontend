/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatSidebar } from '../../../../src/features/chatbot/components/ChatSidebar';

describe('ChatSidebar', () => {
    const mockChats = [
        { id: 'chat1', userId: 'user1', createdAt: new Date().toISOString(), title: 'First chat' },
        { id: 'chat2', userId: 'user1', createdAt: new Date(Date.now() - 86400000).toISOString(), title: '' }
    ];

    it('renders chat list', () => {
        const setSidebarOpen = vi.fn();
        render(
            <MemoryRouter>
                <ChatSidebar chats={mockChats as any} setSidebarOpen={setSidebarOpen} />
            </MemoryRouter>
        );

        expect(screen.getByText('New Chat')).toBeInTheDocument();
        expect(screen.getByText('Recent Chats')).toBeInTheDocument();
        
        expect(screen.getByText('First chat')).toBeInTheDocument();
        expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('calls setSidebarOpen when a chat is clicked', () => {
        const setSidebarOpen = vi.fn();
        render(
            <MemoryRouter>
                <ChatSidebar chats={mockChats as any} setSidebarOpen={setSidebarOpen} />
            </MemoryRouter>
        );

        const chatLink = screen.getByText('First chat');
        fireEvent.click(chatLink);
        
        expect(setSidebarOpen).toHaveBeenCalledWith(false);
    });
});
