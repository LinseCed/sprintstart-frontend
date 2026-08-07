import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { AutoResizeTextarea } from '../../../../src/components/ui/AutoResizeTextarea';

/** A composer wired the way the buddy's is: a form whose onSubmit does the sending. */
function Composer({ submitOnEnter, onSubmit }: { submitOnEnter?: boolean; onSubmit: () => void }) {
    const [draft, setDraft] = useState('');
    return (
        <form
            onSubmit={event => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <AutoResizeTextarea
                value={draft}
                onChange={setDraft}
                placeholder="Ask your buddy..."
                submitOnEnter={submitOnEnter}
            />
            <button type="submit">Send</button>
        </form>
    );
}

describe('AutoResizeTextarea', () => {
    it('sends on Enter when the caller asked for it', async () => {
        const onSubmit = vi.fn();
        render(<Composer submitOnEnter onSubmit={onSubmit} />);

        await userEvent.type(screen.getByPlaceholderText('Ask your buddy...'), 'is my PR stuck?{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('keeps Shift+Enter for a new line', async () => {
        const onSubmit = vi.fn();
        render(<Composer submitOnEnter onSubmit={onSubmit} />);
        const box = screen.getByPlaceholderText('Ask your buddy...');

        await userEvent.type(box, 'first line{Shift>}{Enter}{/Shift}second line');

        expect(onSubmit).not.toHaveBeenCalled();
        expect(box).toHaveValue('first line\nsecond line');
    });

    /**
     * ⚠️ Three of this component's callers are long-form answer boxes — answering a flagged
     * question, editing a canonical answer — where Enter is how somebody writes a second
     * paragraph. Enabling this globally would submit half an answer every time.
     */
    it('leaves Enter alone by default', async () => {
        const onSubmit = vi.fn();
        render(<Composer onSubmit={onSubmit} />);
        const box = screen.getByPlaceholderText('Ask your buddy...');

        await userEvent.type(box, 'a paragraph{Enter}and another');

        expect(onSubmit).not.toHaveBeenCalled();
        expect(box).toHaveValue('a paragraph\nand another');
    });

    it('sends nothing when the box holds only whitespace', async () => {
        const onSubmit = vi.fn();
        render(<Composer submitOnEnter onSubmit={onSubmit} />);

        await userEvent.type(screen.getByPlaceholderText('Ask your buddy...'), '   {Enter}');

        // Same condition as the send button being disabled, so the two cannot disagree.
        expect(onSubmit).not.toHaveBeenCalled();
    });

    /**
     * ⚠️ Enter also *commits* an IME candidate — a compose key producing 'ü', or any
     * Chinese/Japanese/Korean input. Sending there submits a half-written word, and there is
     * no way to get it back.
     */
    it('does not send while an input method is composing', async () => {
        const onSubmit = vi.fn();
        render(<Composer submitOnEnter onSubmit={onSubmit} />);
        const box = screen.getByPlaceholderText('Ask your buddy...');

        await userEvent.type(box, 'gru');
        // userEvent has no composition support, so the Enter that commits a candidate is
        // dispatched directly, exactly as a browser would during composition.
        box.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }),
        );

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
