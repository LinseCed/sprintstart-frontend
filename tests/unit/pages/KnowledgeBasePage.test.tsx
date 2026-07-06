import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { KnowledgeBasePage } from '../../../src/pages/KnowledgeBasePage';
import { knowledgeService } from '../../../src/services/knowledgeService';
import type { Artifact } from '../../../src/features/knowledge-base/types';
import type { ReactNode } from 'react';
import * as useAuthHook from '../../../src/context/useAuth';
import { PermissionGroup } from '../../../src/services/types';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick, 'data-testid': testId }: { children: ReactNode, className?: string, onClick?: () => void, 'data-testid'?: string }) => (
            <div className={className} onClick={onClick} data-testid={testId} role="presentation">
                {children}
            </div>
        ),
        button: ({ children, className, onClick, 'aria-label': ariaLabel }: { children: ReactNode, className?: string, onClick?: () => void, 'aria-label'?: string }) => (
            <button className={className} onClick={onClick} aria-label={ariaLabel}>{children}</button>
        ),
    },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>
}));

vi.stubEnv('VITE_KB_PROJECT_ID', 'proj-1');

vi.mock('../../../src/services/knowledgeService', () => ({
    knowledgeService: {
        getUnifiedArtifacts: vi.fn(),
        getArtifactContent: vi.fn(),
        summarizeArtifact: vi.fn(),
        uploadDocuments: vi.fn(),
    }
}));

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: vi.fn(),
}));

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const mockArtifacts: Artifact[] = [
    {
        id: '1',
        title: 'API Authentication Guide',
        artifactType: 'FILE',
        sourceSystem: 'GITHUB',
        sourceId: 'abc123',
        sourceUrl: 'https://github.com/repo/blob/main/auth-guide.md',
        mime: 'text/markdown',
        language: 'markdown',
        ingestedAt: '2026-04-15T10:00:00Z',
        createdAtSource: null,
        updatedAtSource: '2026-04-15T10:00:00Z',
        contentHash: null,
        ingestionRunId: 'run-1',
    },
    {
        id: '2',
        title: 'Database Migration Runbook',
        artifactType: 'FILE',
        sourceSystem: 'GITHUB',
        sourceId: 'def456',
        sourceUrl: 'https://github.com/repo/blob/main/runbook.md',
        mime: 'text/markdown',
        language: 'markdown',
        ingestedAt: '2026-04-01T12:00:00Z',
        createdAtSource: null,
        updatedAtSource: '2026-04-01T12:00:00Z',
        contentHash: null,
        ingestionRunId: 'run-1',
    },
];

describe('KnowledgeBasePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (knowledgeService.getUnifiedArtifacts as Mock).mockResolvedValue(mockArtifacts);
        (knowledgeService.getArtifactContent as Mock).mockResolvedValue({
            content: '# Test Content',
            mimeType: 'text/markdown'
        });
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: {
                id: '1',
                authId: 'auth',
                username: 'TestUser',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                projectRoles: [],
                projectIds: ['proj-1'],
                permissionGroup: PermissionGroup.USER,
                enabled: true,
                profileIcon: null,
                hasCompletedOnboarding: true,
            },
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });
    });

    it('renders the knowledge base page without the upload zone', async () => {
        render(<KnowledgeBasePage />);

        await waitFor(() => {
            expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
        });

        expect(screen.queryByText(/drag and drop/i)).not.toBeInTheDocument();
    });

    it('renders the list of artifacts', async () => {
        render(<KnowledgeBasePage />);

        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
            expect(screen.getByText('Database Migration Runbook')).toBeInTheDocument();
        });
    });

    it('filters artifacts based on search query', async () => {
        render(<KnowledgeBasePage />);

        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Search knowledge base/i);
        fireEvent.change(searchInput, { target: { value: 'Authentication' } });

        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
            expect(screen.queryByText('Database Migration Runbook')).not.toBeInTheDocument();
        });
    });

    it('filters artifacts by type', async () => {
        render(<KnowledgeBasePage />);

        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
        });

        const typeSelect = screen.getByDisplayValue('All Types');
        fireEvent.change(typeSelect, { target: { value: 'ISSUE' } });

        await waitFor(() => {
            expect(screen.queryByText('API Authentication Guide')).not.toBeInTheDocument();
            expect(screen.queryByText('Database Migration Runbook')).not.toBeInTheDocument();
        });
    });

    it('opens the drawer and fetches content when an artifact is clicked', async () => {
        render(<KnowledgeBasePage />);

        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
        });

        const artifactCard = screen.getByText('API Authentication Guide');
        fireEvent.click(artifactCard);

        await waitFor(() => {
            expect(knowledgeService.getArtifactContent).toHaveBeenCalledWith('proj-1', '1', 'GITHUB');
            expect(screen.getByTestId('raw-content')).toBeInTheDocument();
        });
    });

    it('calls summarizeArtifact when summarize button is clicked', async () => {
        render(<KnowledgeBasePage />);

        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
        });

        const artifactCard = screen.getByText('API Authentication Guide');
        fireEvent.click(artifactCard);

        await waitFor(() => {
            expect(screen.getByTestId('summarise-btn')).toBeInTheDocument();
        });

        const summarizeBtn = screen.getByTestId('summarise-btn');
        fireEvent.click(summarizeBtn);

        await waitFor(() => {
            expect(knowledgeService.summarizeArtifact).toHaveBeenCalled();
        });
    });
});
