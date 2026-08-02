import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useArrivalAuthoring } from '../hooks/useArrivalAuthoring';
import type { ArrivalStep } from '../types';

/**
 * Authoring the company-wide arrival list — the things a new joiner has to get done before they can
 * work.
 *
 * ### This list orders attention; it does not gate anything
 *
 * Nothing here stops a hire doing anything. A step that is outstanding is shown to them and raised
 * by their buddy, and that is the whole of its effect. Worth stating on the page itself, because
 * "mandatory steps" reads like a gate and the last version of this model was one.
 *
 * ### Every step is the hire's own word, for now
 *
 * A0 has no derivation behind any step, so everything here is settled by the hire saying so. That
 * is recorded as such and never blended with anything the system observed — see the note the page
 * renders. Steps the system can check for itself arrive in A1.
 */
export function ArrivalStepAuthoring({ readOnly = false }: { readOnly?: boolean }) {
    const { steps, loading, error, writeError, create, move, remove } = useArrivalAuthoring();
    const [adding, setAdding] = useState(false);

    if (loading) {
        return <p className="text-sm text-app-text-muted">Loading the arrival list…</p>;
    }

    if (error) {
        return (
            <p className="text-sm text-app-danger-text">
                The arrival list could not be loaded. Refresh to try again.
            </p>
        );
    }

    return (
        <section className="space-y-4">
            <header className="space-y-1">
                <h2 className="text-lg font-medium text-app-text">Arrival steps</h2>
                <p className="text-sm text-app-text-muted">
                    What somebody needs before they can start — accounts, access, a machine that
                    builds. These appear on every new joiner&apos;s board.{' '}
                    <strong className="font-medium text-app-text">
                        Nothing here blocks anyone
                    </strong>
                    : an outstanding step is shown and raised by their buddy, never enforced.
                </p>
            </header>

            {writeError && <p className="text-sm text-app-danger-text">{writeError}</p>}

            {steps && steps.length === 0 ? (
                <p className="rounded-xl border border-dashed border-app-border p-4 text-sm text-app-text-muted">
                    No arrival steps yet, so nobody sees this card at all. Add the first thing a new
                    joiner has to do before they can work.
                </p>
            ) : (
                <ul className="space-y-2">
                    {steps?.map((step, index) => (
                        <StepRow
                            key={step.key}
                            step={step}
                            readOnly={readOnly}
                            canMoveUp={index > 0}
                            canMoveDown={index < steps.length - 1}
                            onMove={move}
                            onRemove={remove}
                        />
                    ))}
                </ul>
            )}

            {readOnly ? (
                <p className="rounded-xl border border-dashed border-app-border p-4 text-sm text-app-text-muted">
                    You can see this list but not change it — a PM or an admin can. If something here
                    is wrong or missing, that is who to tell.
                </p>
            ) : adding ? (
                <AddStepForm
                    onCancel={() => setAdding(false)}
                    onCreate={async (request) => {
                        if (await create(request)) setAdding(false);
                    }}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text transition hover:bg-app-surface-muted"
                >
                    Add a step
                </button>
            )}
        </section>
    );
}

function StepRow({
    step,
    readOnly,
    canMoveUp,
    canMoveDown,
    onMove,
    onRemove,
}: {
    step: ArrivalStep;
    readOnly: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMove: (key: string, direction: 'up' | 'down') => Promise<boolean>;
    onRemove: (key: string) => Promise<boolean>;
}) {
    const [confirmingRemove, setConfirmingRemove] = useState(false);

    return (
        <li className="rounded-xl border border-app-border p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-app-text">{step.title}</p>
                    {step.description && (
                        <p className="mt-1 text-xs text-app-text-muted">{step.description}</p>
                    )}
                    <p className="mt-1 font-mono text-xs text-app-text-muted">{step.key}</p>
                </div>

                {/*
                  Not rendered at all rather than hidden with a class: a control that only CSS keeps
                  out of reach is still focusable, still in the accessibility tree, and still there
                  if a stylesheet fails to load.
                */}
                {!readOnly && (
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => void onMove(step.key, 'up')}
                        disabled={!canMoveUp}
                        aria-label={`Move "${step.title}" earlier`}
                        className="rounded-lg p-1 text-app-text-muted transition hover:bg-app-surface-muted disabled:opacity-40"
                    >
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => void onMove(step.key, 'down')}
                        disabled={!canMoveDown}
                        aria-label={`Move "${step.title}" later`}
                        className="rounded-lg p-1 text-app-text-muted transition hover:bg-app-surface-muted disabled:opacity-40"
                    >
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmingRemove(true)}
                        aria-label={`Remove "${step.title}"`}
                        className="rounded-lg p-1 text-app-text-muted transition hover:bg-app-surface-muted"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
                )}
            </div>

            {confirmingRemove && (
                <div className="mt-3 rounded-lg border border-app-border bg-app-surface-muted/40 p-3">
                    {/*
                      What a PM cannot guess is what survives. State is keyed by the step key, not by
                      a row id, so removing this takes it off everyone's board without destroying who
                      already did it -- and re-adding the same key brings those records back.
                    */}
                    <p className="text-sm text-app-text">
                        Remove &ldquo;{step.title}&rdquo; from everyone&apos;s board?
                    </p>
                    <p className="mt-1 text-xs text-app-text-muted">
                        Records of people who already did it are kept. Adding a step with the key{' '}
                        <span className="font-mono">{step.key}</span> again restores them.
                    </p>
                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => void onRemove(step.key)}
                            className="rounded-lg border border-app-danger-border px-2 py-1 text-xs text-app-danger-text transition hover:bg-app-danger-bg/30"
                        >
                            Remove
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmingRemove(false)}
                            className="rounded-lg border border-app-border px-2 py-1 text-xs text-app-text transition hover:bg-app-surface-muted"
                        >
                            Keep it
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
}

function AddStepForm({
    onCreate,
    onCancel,
}: {
    onCreate: (request: { key: string; title: string; description?: string; href?: string }) => Promise<void>;
    onCancel: () => void;
}) {
    const [key, setKey] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [href, setHref] = useState('');

    const canSubmit = key.trim().length > 0 && title.trim().length > 0;

    return (
        <form
            className="space-y-3 rounded-xl border border-app-border p-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!canSubmit) return;
                void onCreate({
                    key: key.trim(),
                    title: title.trim(),
                    description: description.trim() || undefined,
                    href: href.trim() || undefined,
                });
            }}
        >
            <Field
                label="Title"
                hint="What the person has to do, in their words."
                value={title}
                onChange={setTitle}
                placeholder="Request VPN access"
            />
            <Field
                label="Key"
                // The key is immutable because state points at it; saying so at the point of
                // choosing is cheaper than explaining it after somebody wants to change one.
                hint="A short id, fixed once saved — it is what people's records point at."
                value={key}
                onChange={setKey}
                placeholder="vpn-access"
            />
            <Field
                label="Description"
                hint="Optional. Anything they need to know before starting."
                value={description}
                onChange={setDescription}
                placeholder="Ask in #it-helpdesk; usually same-day."
            />
            <Field
                label="Link"
                hint="Optional. Where to go to actually do it."
                value={href}
                onChange={setHref}
                placeholder="https://…"
            />

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-lg border border-app-border bg-app-brand px-3 py-2 text-sm text-white transition hover:bg-app-brand-hover disabled:opacity-60"
                >
                    Add step
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text transition hover:bg-app-surface-muted"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

function Field({
    label,
    hint,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    hint: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <label className="block space-y-1">
            <span className="text-sm text-app-text">{label}</span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text placeholder:text-app-text-muted"
            />
            <span className="block text-xs text-app-text-muted">{hint}</span>
        </label>
    );
}
