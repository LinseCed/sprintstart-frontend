import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberChatHistory } from '../../../../../../src/features/team-management/components/detail/MemberChatHistory';

const mockGetChatsAdmin = vi.hoisted(() => vi.fn());
const mockGetChatMessagesAdmin = vi.hoisted(() => vi.fn());

vi.mock('../../../../../../src/services/chatService', () => ({
    getChatsAdmin: mockGetChatsAdmin,
    getChatMessagesAdmin: mockGetChatMessagesAdmin,
}));

// Mock MessageRow so we don't need the full markdown/citation stack.
vi.mock('../../../../../../src/features/chatbot/components/MessageRow', () => ({
    MessageRow: ({ message }: { message: { role: string; content: string } }) => (
        <div data-testid="message-row" data-role={message.role}>
            {message.content}
        </div>
    ),
}));

const chat1 = { id: 'c1', userId: 'user1', title: 'Docker setup', createdAt: '2026-07-28T10:00:00Z' };
const chat2 = { id: 'c2', userId: 'user1', title: 'Onboarding help', createdAt: '2026-07-20T10:00:00Z' };
const otherUserChat = { id: 'c3', userId: 'user2', title: 'Other user', createdAt: '2026-07-25T10:00:00Z' };

describe('MemberChatHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows empty state when the user has no chats', async () => {
        mockGetChatsAdmin.mockResolvedValue({ chats: [otherUserChat] });

        render(<MemberChatHistory userId="user1" memberName="Alice Smith" />);

        await waitFor(() => {
            expect(screen.getByText('No AI conversations yet.')).toBeInTheDocument();
        });
    });

    it('lists only chats belonging to the specified user, sorted newest first', async () => {
        mockGetChatsAdmin.mockResolvedValue({
            chats: [otherUserChat, chat2, chat1],
        });

        render(<MemberChatHistory userId="user1" memberName="Alice Smith" />);

        await waitFor(() => {
            expect(screen.getByText('Docker setup')).toBeInTheDocument();
        });

        expect(screen.getByText('Onboarding help')).toBeInTheDocument();
        expect(screen.queryByText('Other user')).not.toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        // Newest first: Docker (Jul 28) before Onboarding (Jul 20)
        const buttons = screen.getAllByRole('button');
        const dockerIndex = buttons.findIndex((b) =>
            b.textContent?.includes('Docker setup'),
        );
        const onboardingIndex = buttons.findIndex((b) =>
            b.textContent?.includes('Onboarding help'),
        );
        expect(dockerIndex).toBeLessThan(onboardingIndex);
    });

    it('loads and displays messages when a chat is selected', async () => {
        mockGetChatsAdmin.mockResolvedValue({ chats: [chat1] });
        mockGetChatMessagesAdmin.mockResolvedValue({
            messages: [
                { id: 'm1', role: 'USER', content: 'How do I set up Docker?', createdAt: '2026-07-28T10:01:00Z', chat: undefined },
                { id: 'm2', role: 'ASSISTANT', content: 'You need to...', createdAt: '2026-07-28T10:01:05Z', chat: undefined },
            ],
        });

        render(<MemberChatHistory userId="user1" memberName="Alice Smith" />);

        await waitFor(() => {
            expect(screen.getByText('Docker setup')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Docker setup'));

        await waitFor(() => {
            expect(mockGetChatMessagesAdmin).toHaveBeenCalledWith('c1');
        });

        await waitFor(() => {
            expect(screen.getByText('How do I set up Docker?')).toBeInTheDocument();
            expect(screen.getByText('You need to...')).toBeInTheDocument();
        });

        // Verify message rows render (mocked MessageRow)
        const rows = screen.getAllByTestId('message-row');
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveAttribute('data-role', 'USER');
        expect(rows[1]).toHaveAttribute('data-role', 'ASSISTANT');
    });

    it('shows a placeholder before a chat is selected', async () => {
        mockGetChatsAdmin.mockResolvedValue({ chats: [chat1, chat2] });

        render(<MemberChatHistory userId="user1" memberName="Alice Smith" />);

        await waitFor(() => {
            expect(screen.getByText('Docker setup')).toBeInTheDocument();
        });

        expect(screen.getByText('Select a conversation to read it.')).toBeInTheDocument();
    });

    it('surfaces an error when chat loading fails', async () => {
        mockGetChatsAdmin.mockRejectedValue(new Error('Network error'));

        render(<MemberChatHistory userId="user1" memberName="Alice Smith" />);

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });
});
