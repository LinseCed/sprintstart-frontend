import type { VerificationType } from '../types';

type VerifyInputProps = {
    type: VerificationType;
    answer: string;
    onAnswerChange: (value: string) => void;
    disabled?: boolean;
};

const inputClassName =
    'w-full rounded-xl border border-app-border bg-app-bg px-4 py-2.5 text-sm text-app-text ' +
    'placeholder:text-app-text-subtle focus:border-app-brand focus:outline-none disabled:opacity-70';

/**
 * Type-specific answer input for a Verify zone: free text for `KNOWLEDGE`, a
 * single-line exact answer for `EXACT`, a self-confirmation checkbox for
 * `ATTEST`. All three funnel into the same `answer` string the hook submits.
 */
export function VerifyInput({ type, answer, onAnswerChange, disabled = false }: VerifyInputProps) {
    if (type === 'KNOWLEDGE') {
        return (
            <textarea
                value={answer}
                disabled={disabled}
                onChange={event => onAnswerChange(event.target.value)}
                placeholder="Explain your answer..."
                rows={5}
                className={inputClassName}
                aria-label="Your answer"
            />
        );
    }

    if (type === 'EXACT') {
        return (
            <input
                type="text"
                value={answer}
                disabled={disabled}
                onChange={event => onAnswerChange(event.target.value)}
                placeholder="Your answer..."
                className={inputClassName}
                aria-label="Your answer"
            />
        );
    }

    const confirmed = answer.trim().length > 0;
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-app-border px-4 py-3 text-sm text-app-text has-[:disabled]:cursor-default">
            <input
                type="checkbox"
                checked={confirmed}
                disabled={disabled}
                onChange={event => onAnswerChange(event.target.checked ? 'confirmed' : '')}
                className="h-4 w-4 shrink-0"
            />
            <span>I&apos;ve completed this and confirm I understand it.</span>
        </label>
    );
}
