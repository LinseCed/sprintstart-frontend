import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { BuddyPanel } from '../../../../src/features/buddy/components/BuddyPanel';
import type { BuddyMessageView } from '../../../../src/features/buddy/types';

function renderPanel(messages: BuddyMessageView[] = []) {
    return render(
        <BuddyPanel
            messages={messages}
            isThinking={false}
            draft=""
            setDraft={vi.fn()}
            handleSubmit={vi.fn()}
            confirmAction={vi.fn()}
            dismissAction={vi.fn()}
            bottomRef={createRef<HTMLDivElement>()}
            onClose={vi.fn()}
        />,
    );
}

const assistant = (content: string): BuddyMessageView => ({
    id: 'a1',
    role: 'ASSISTANT',
    content,
    createdAt: '2026-08-03T00:00:00Z',
});

const user = (content: string): BuddyMessageView => ({
    id: 'u1',
    role: 'USER',
    content,
    createdAt: '2026-08-03T00:00:00Z',
});

/**
 * ⚠️ **These assert classes, not layout, and that is deliberate.** jsdom computes no layout, so a
 * genuine "does it overflow at 384 px" test is not available here — but the regression these guard
 * against is not a subtle layout shift, it is somebody deleting `min-w-0` and `overflow-x-hidden`
 * because they read as noise. The class *is* the contract in a Tailwind codebase.
 */
describe('BuddyPanel horizontal overflow', () => {
    it('never lets the conversation itself scroll sideways', () => {
        renderPanel([assistant('hello')]);

        const transcript = screen.getByTestId('buddy-panel-transcript');
        // `overflow-y: auto` alone computes overflow-x to `auto` as well, which is what put a
        // horizontal scrollbar across the whole conversation. Vertical scrolling stays.
        expect(transcript).toHaveClass('overflow-x-hidden');
        expect(transcript).toHaveClass('overflow-y-auto');
    });

    /**
     * A flex item's default `min-width: auto` refuses to shrink below its content, so the bubble
     * grew to fit a wide code block and the `overflow-x-auto` on `pre` never engaged. Without
     * `min-w-0` the per-block scrollers are decorative.
     */
    it('lets a bubble shrink below its content so wide blocks scroll inside themselves', () => {
        renderPanel([assistant('a reply')]);

        // The chain the fix has to be unbroken along: the markdown wrapper, then the bubble it
        // sits in. One `min-width: auto` anywhere between the panel and a `pre` is enough to
        // widen everything above it.
        const markdown = screen.getByText('a reply').closest('div');
        expect(markdown).toHaveClass('min-w-0');
        expect(markdown?.parentElement).toHaveClass('min-w-0');
    });

    /** A URL is one unbreakable word to the line breaker; no container width fixes that. */
    it('breaks a long unbreakable token in the hire’s own message', () => {
        const url = 'https://github.com/SprintStartProject/sprintstart-backend/pull/152/files#diff-abcdef0123456789';
        renderPanel([user(url)]);

        expect(screen.getByText(url)).toHaveClass('break-words');
    });
});
