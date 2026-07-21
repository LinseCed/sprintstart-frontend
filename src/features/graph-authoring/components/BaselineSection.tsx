import type { BaselineEntry, LiveCompetency, SetBaselineEntryInput } from '../types';

/**
 * Marks whether this competency is expected of a hire on the selected project — the baseline,
 * authored directly on the node instead of through a separate AI proposal pass.
 *
 * "Expected here" is the whole decision; the target level and mandate are refinements shown only
 * once it is on. Every change sends the full intended state, because the server treats a set as a
 * replace (an omitted target level means "use the competency's own bar").
 */
export function BaselineSection({
    competency,
    entry,
    isBusy,
    error,
    onSetExpected,
    onRemove,
}: {
    competency: LiveCompetency;
    entry: BaselineEntry | null;
    isBusy: boolean;
    error: string | null;
    onSetExpected: (input: SetBaselineEntryInput) => void;
    onRemove: () => void;
}) {
    const expected = entry !== null;
    const overrideLevel = entry?.targetLevelOverridden ? entry.targetLevel : null;

    const toggleExpected = () => {
        if (expected) {
            onRemove();
        } else {
            onSetExpected({});
        }
    };

    const changeLevel = (value: string) => {
        onSetExpected({
            targetLevel: value === '' ? null : Number(value),
            invariant: entry?.invariant ?? false,
        });
    };

    const toggleMandate = () => {
        onSetExpected({ targetLevel: overrideLevel, invariant: !(entry?.invariant ?? false) });
    };

    return (
        <section className="rounded-xl border border-app-border p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                Baseline · this project
            </h3>

            <label className="flex items-center gap-2 text-sm text-app-text">
                <input
                    type="checkbox"
                    checked={expected}
                    disabled={isBusy || (expected && entry.invariant)}
                    onChange={toggleExpected}
                    className="h-4 w-4 rounded border-app-border text-app-brand focus-visible:ring-2 focus-visible:ring-app-focus"
                />
                Expected on this project
            </label>

            {expected ? (
                <div className="mt-3 space-y-3">
                    <label className="block text-sm">
                        <span className="mb-1 block text-xs text-app-text-subtle">Target level</span>
                        <select
                            value={overrideLevel === null ? '' : String(overrideLevel)}
                            disabled={isBusy}
                            onChange={(event) => changeLevel(event.target.value)}
                            className="w-full rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <option value="">Default (L{competency.targetLevel})</option>
                            {[1, 2, 3, 4].map((level) => (
                                <option key={level} value={String(level)}>
                                    L{level}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex items-center gap-2 text-sm text-app-text">
                        <input
                            type="checkbox"
                            checked={entry.invariant}
                            disabled={isBusy}
                            onChange={toggleMandate}
                            className="h-4 w-4 rounded border-app-border text-app-brand focus-visible:ring-2 focus-visible:ring-app-focus"
                        />
                        Mandate — can&apos;t be dropped or lowered
                    </label>

                    {entry.invariant && (
                        <p className="text-xs text-app-text-subtle">
                            Marked a mandate, so it stays expected here. Clear the mandate first to
                            remove it.
                        </p>
                    )}
                </div>
            ) : (
                <p className="mt-2 text-xs text-app-text-subtle">
                    A hire on this project won&apos;t be expected to reach it until you turn this on.
                </p>
            )}

            {error && <p className="mt-2 text-xs text-app-danger-text">{error}</p>}
        </section>
    );
}
