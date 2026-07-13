import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArtifactViewerDrawer } from '../../../../../src/features/knowledge-base/components/ArtifactViewerDrawer';
import type { Artifact } from '../../../../../src/features/knowledge-base/types';

vi.mock('../../../../../src/services/knowledgeService', () => ({
    knowledgeService: {
        getArtifactContent: vi.fn().mockResolvedValue({
            content: '# Test content',
            mimeType: 'text/markdown',
        }),
        summarizeArtifact: vi.fn(),
    },
}));

vi.mock('../../../../../src/components/ui/SidePanel', () => ({
    SidePanel: ({ isOpen, title, actions, children }: {
        isOpen: boolean;
        title: React.ReactNode;
        actions: React.ReactNode;
        children: React.ReactNode;
    }) =>
        isOpen ? (
            <div data-testid="side-panel">
                <div data-testid="panel-header">{title}</div>
                <div data-testid="panel-actions">{actions}</div>
                {children}
            </div>
        ) : null,
}));

function createArtifact(overrides: Partial<Artifact> = {}): Artifact {
    return {
        id: 'artifact-1',
        title: 'README.md',
        artifactType: 'FILE',
        sourceSystem: 'GITHUB',
        sourceId: 'src-1',
        sourceUrl: null,
        mime: 'text/markdown',
        language: 'Markdown',
        ingestedAt: '2026-01-01T00:00:00Z',
        createdAtSource: null,
        updatedAtSource: null,
        contentHash: 'hash123',
        ingestionRunId: null,
        ...overrides,
    };
}

function renderDrawer(artifact: Artifact | null = createArtifact()) {
    return render(
        <ArtifactViewerDrawer
            artifact={artifact}
            onClose={() => {}}
            projectId="proj-1"
        />,
    );
}

describe('ArtifactViewerDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a spinner while fetching the summary', async () => {
        const { knowledgeService } = await import('../../../../../src/services/knowledgeService');
        vi.mocked(knowledgeService.summarizeArtifact).mockReturnValue(new Promise(() => {}));

        renderDrawer();
        const summariseBtn = await screen.findByTestId('summarise-btn');
        await userEvent.click(summariseBtn);

        expect(screen.getByText('Generating summary...')).toBeInTheDocument();
    });

    it('renders the summary markdown and citations on success', async () => {
        const { knowledgeService } = await import('../../../../../src/services/knowledgeService');
        vi.mocked(knowledgeService.summarizeArtifact).mockResolvedValue({
            artifactId: 'artifact-1',
            summary: '## Key points\nThis is the summary.',
            citations: [
                { artifactId: 'artifact-1', filename: 'README.md', sourceUrl: 'https://github.com/owner/repo/blob/main/README.md' },
            ],
        });

        renderDrawer();
        const summariseBtn = await screen.findByTestId('summarise-btn');
        await userEvent.click(summariseBtn);

        expect(await screen.findByTestId('summary-content')).toBeInTheDocument();
        expect(screen.getByText('Key points')).toBeInTheDocument();
        expect(screen.getByTestId('summary-citations')).toBeInTheDocument();
        expect(screen.getByText('README.md')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'README.md' })).toHaveAttribute('href', 'https://github.com/owner/repo/blob/main/README.md');
    });

    it('shows an error when summarization fails', async () => {
        const { knowledgeService } = await import('../../../../../src/services/knowledgeService');
        vi.mocked(knowledgeService.summarizeArtifact).mockRejectedValue(new Error('AI service unavailable'));

        renderDrawer();
        const summariseBtn = await screen.findByTestId('summarise-btn');
        await userEvent.click(summariseBtn);

        expect(await screen.findByText('Error loading content')).toBeInTheDocument();
        expect(screen.getByText('AI service unavailable')).toBeInTheDocument();
    });

    it('returns to raw view on Back to File', async () => {
        const { knowledgeService } = await import('../../../../../src/services/knowledgeService');
        vi.mocked(knowledgeService.summarizeArtifact).mockResolvedValue({
            artifactId: 'artifact-1',
            summary: 'Summary text',
            citations: [],
        });

        renderDrawer();
        const summariseBtn = await screen.findByTestId('summarise-btn');
        await userEvent.click(summariseBtn);

        const backBtn = await screen.findByTestId('back-to-file-btn');
        await userEvent.click(backBtn);

        expect(screen.getByTestId('raw-content')).toBeInTheDocument();
    });

    it('hides the Summarise button in summary view', async () => {
        const { knowledgeService } = await import('../../../../../src/services/knowledgeService');
        vi.mocked(knowledgeService.summarizeArtifact).mockReturnValue(new Promise(() => {}));

        renderDrawer();
        const summariseBtn = await screen.findByTestId('summarise-btn');
        await userEvent.click(summariseBtn);

        expect(screen.queryByTestId('summarise-btn')).not.toBeInTheDocument();
    });
});
