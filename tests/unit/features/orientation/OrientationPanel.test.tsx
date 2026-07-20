import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrientationPanel } from '../../../../src/features/orientation/components/OrientationPanel';
import { orientationService } from '../../../../src/services/orientationService';
import type { MyOrientation } from '../../../../src/features/orientation/types';

const withPacket: MyOrientation = {
    taskId: 'task-1',
    taskTitle: 'Fix the stale cache header',
    taskUrl: 'https://github.com/acme/repo/issues/42',
    reason: null,
    packet: {
        taskId: 'task-1',
        taskTitle: 'Fix the stale cache header',
        summary: 'What you need to change the header.',
        sections: [
            {
                step: 'SET_UP',
                title: 'Run it locally',
                body: 'Run `make dev`.',
                citations: [
                    {
                        filename: 'README.md',
                        chunkId: 'c1',
                        sourceUrl: 'https://example.test/README.md'
                    }
                ]
            },
            {
                step: 'OPEN_THE_PR',
                title: 'How review works here',
                body: 'One approving review is required.',
                citations: [
                    { filename: 'CONTRIBUTING.md', chunkId: 'c2', sourceUrl: null }
                ]
            }
        ],
        sources: [
            {
                filename: 'README.md',
                sourceUrl: 'https://example.test/README.md',
                artifactType: 'FILE'
            }
        ],
        assembledAt: '2026-07-21T12:00:00Z'
    }
};

describe('OrientationPanel', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        window.localStorage.clear();
    });

    it('shows every step of the packet, with the first one open', () => {
        render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        expect(screen.getByText('Run it locally')).toBeInTheDocument();
        expect(screen.getByText('How review works here')).toBeInTheDocument();
        // Only the first step's body is expanded on a first visit.
        expect(screen.getByText('make dev')).toBeInTheDocument();
        expect(screen.queryByText('One approving review is required.')).not.toBeInTheDocument();
    });

    it('shows where each claim came from as an openable link, not a tooltip', () => {
        render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        const link = screen.getAllByRole('link', { name: /README\.md/ })[0];
        expect(link).toHaveAttribute('href', 'https://example.test/README.md');
    });

    it('names a source that has no URL rather than dropping it', async () => {
        render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /How review works here/ }));

        expect(screen.getByText('CONTRIBUTING.md')).toBeInTheDocument();
    });

    it('remembers which steps are open across visits', async () => {
        const { unmount } = render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        // A hire who has done setup collapses it and expands the PR step.
        await userEvent.click(screen.getByRole('button', { name: /Run it locally/ }));
        await userEvent.click(screen.getByRole('button', { name: /How review works here/ }));
        unmount();

        render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        expect(screen.queryByText('make dev')).not.toBeInTheDocument();
        expect(screen.getByText('One approving review is required.')).toBeInTheDocument();
    });

    it('reports a stale section naming the task, the section and its sources', async () => {
        const report = vi
            .spyOn(orientationService, 'reportStaleOrientation')
            .mockResolvedValue(undefined);

        render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /wrong or out of date/ }));

        expect(report).toHaveBeenCalledTimes(1);
        const message = report.mock.calls[0][0];
        expect(message).toContain('Fix the stale cache header');
        expect(message).toContain('Run it locally');
        expect(message).toContain('README.md');
        expect(await screen.findByText(/passed on/)).toBeInTheDocument();
    });

    it('never invents a packet when one could not be assembled', () => {
        render(
            <OrientationPanel
                orientation={{
                    taskId: 'task-1',
                    taskTitle: 'Fix the stale cache header',
                    taskUrl: 'https://github.com/acme/repo/issues/42',
                    packet: null,
                    reason: 'corpus is empty'
                }}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        expect(screen.getByText(/no guide here/)).toBeInTheDocument();
        expect(screen.getByText(/corpus is empty/)).toBeInTheDocument();
        // The task itself is still reachable, so the hire is not left with nothing.
        expect(screen.getByRole('link', { name: /Fix the stale cache header/ })).toHaveAttribute(
            'href',
            'https://github.com/acme/repo/issues/42'
        );
    });

    it('offers a retry when the load itself failed', async () => {
        const onRetry = vi.fn();
        render(
            <OrientationPanel
                orientation={null}
                isLoading={false}
                error="Could not load your orientation."
                onRetry={onRetry}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Try again/ }));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when the hire has no current task', () => {
        const { container } = render(
            <OrientationPanel
                orientation={{
                    taskId: null,
                    taskTitle: null,
                    taskUrl: null,
                    packet: null,
                    reason: null
                }}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('lists the material the packet was assembled from', () => {
        render(
            <OrientationPanel
                orientation={withPacket}
                isLoading={false}
                error={null}
                onRetry={vi.fn()}
            />
        );

        const assembledFrom = screen.getByText('Assembled from').parentElement;
        expect(within(assembledFrom as HTMLElement).getByText('README.md')).toBeInTheDocument();
    });
});
