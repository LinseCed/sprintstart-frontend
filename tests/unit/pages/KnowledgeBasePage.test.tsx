import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { KnowledgeBasePage } from '../../../src/pages/KnowledgeBasePage';
import { knowledgeService } from '../../../src/services/knowledgeService';
import { mockKnowledgeItems } from '../../../src/mocks/knowledgeBaseMocks';
import type { ReactNode } from 'react';

// Mock framer-motion to avoid animation issues in tests for headers
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick, 'data-testid': testId }: { children: ReactNode, className?: string, onClick?: () => void, 'data-testid'?: string }) => (
            <div className={className} onClick={onClick} data-testid={testId} role="presentation">
                {children}
            </div>
        )
    },
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>
}));

// Mock knowledgeService
vi.mock('../../../src/services/knowledgeService', () => ({
    knowledgeService: {
        getUnifiedArtifacts: vi.fn(),
        getArtifactContent: vi.fn(),
        summarizeArtifact: vi.fn()
    }
}));

// Mock ResizeObserver for SidePanel/Radix dependencies if they exist
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

describe('KnowledgeBasePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (knowledgeService.getUnifiedArtifacts as Mock).mockResolvedValue(mockKnowledgeItems);
        (knowledgeService.getArtifactContent as Mock).mockResolvedValue({
            content: '# Test Content',
            mimeType: 'text/markdown'
        });
    });

    it('renders the knowledge base page without the upload zone', async () => {
        render(<KnowledgeBasePage />);
        
        await waitFor(() => {
            expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
        });

        // Ensure upload zone is not present
        expect(screen.queryByText(/upload/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/drag and drop/i)).not.toBeInTheDocument();
    });

    it('renders the list of mocked artifacts', async () => {
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

    it('opens the drawer and fetches content when an artifact is clicked', async () => {
        render(<KnowledgeBasePage />);
        
        await waitFor(() => {
            expect(screen.getByText('API Authentication Guide')).toBeInTheDocument();
        });

        const artifactCard = screen.getByText('API Authentication Guide');
        fireEvent.click(artifactCard);

        await waitFor(() => {
            expect(knowledgeService.getArtifactContent).toHaveBeenCalledWith('default', '1');
            // Check that the raw content container from the Drawer is rendered
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
