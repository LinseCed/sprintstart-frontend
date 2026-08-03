import type { LiveCompetency } from './types';

/**
 * One area's competencies, as the studio renders them.
 *
 * `area` is `null` for the ungrouped bucket, which is a real group and not an error state — see
 * [groupByArea].
 */
export type CompetencyGroup = {
    area: string | null;
    competencies: LiveCompetency[];
};

/**
 * Groups the vocabulary by `area`, filtered by a free-text query.
 *
 * ### Why grouping is the studio's whole structure now
 *
 * `RELATED` edges were already describing "same area of the system", stored as a DAG that every
 * consumer filtered out — so retiring the graph replaced a structure nobody read with the one thing
 * it was actually saying. `area` has existed since S1 and until now had no reader but an
 * autocomplete: a field the generator populates and nothing groups by is the dead wiring this
 * workspace keeps shipping.
 *
 * ### The ungrouped bucket is a group, not a failure
 *
 * `area` is `null` for anything hand-authored before somebody typed one, and for everything on a
 * vocabulary that predates generation. Those rows go in a bucket **last**, named for what is true
 * about them — not grouped yet — rather than filed under an invented area. Absent evidence stays
 * absent; a made-up "General" would read as a judgement somebody made.
 *
 * Areas are sorted, and the ungrouped bucket always sorts last however it is spelled. Grouping is
 * by the exact stored string: the backend folds case and spacing on write, so two spellings of one
 * area cannot reach here, and this deliberately does not fold anything itself — a second opinion
 * about identity is how a grouping fragments into synonyms of itself.
 *
 * @param competencies The live vocabulary.
 * @param query Free text matched against label, key, description and area. Blank matches everything.
 * @returns Non-empty groups only. An empty array means the query matched nothing, which the caller
 * must distinguish from an empty vocabulary — they need opposite advice.
 */
export function groupByArea(
    competencies: LiveCompetency[],
    query = '',
): CompetencyGroup[] {
    const needle = query.trim().toLowerCase();
    const matching = needle ? competencies.filter((one) => matches(one, needle)) : competencies;

    const byArea = new Map<string | null, LiveCompetency[]>();
    for (const competency of matching) {
        const area = competency.area ?? null;
        const bucket = byArea.get(area);
        if (bucket) {
            bucket.push(competency);
        } else {
            byArea.set(area, [competency]);
        }
    }

    return [...byArea.entries()]
        .map(([area, group]) => ({
            area,
            competencies: [...group].sort((a, b) => a.label.localeCompare(b.label)),
        }))
        .sort((a, b) => {
            if (a.area === null) return 1;
            if (b.area === null) return -1;
            return a.area.localeCompare(b.area);
        });
}

/**
 * Whether one competency answers the query.
 *
 * The key is searchable alongside the label because it is the identity the ledger and every module
 * point at — somebody arriving from a log line or a module has the key, not the wording.
 */
function matches(competency: LiveCompetency, needle: string): boolean {
    return [competency.label, competency.key, competency.description, competency.area].some(
        (field) => field?.toLowerCase().includes(needle),
    );
}
