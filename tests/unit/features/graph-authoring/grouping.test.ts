import { describe, it, expect } from 'vitest';
import { groupByArea } from '../../../../src/features/graph-authoring/grouping';
import type { LiveCompetency } from '../../../../src/features/graph-authoring/types';

const competency = (over: Partial<LiveCompetency> = {}): LiveCompetency => ({
    key: 'kotlin',
    label: 'Kotlin',
    description: null,
    kind: 'SKILL',
    area: null,
    targetLevel: 2,
    ...over,
});

describe('groupByArea', () => {
    it('groups by area and sorts the areas', () => {
        const groups = groupByArea([
            competency({ key: 'jwt', label: 'JWT', area: 'Authentication' }),
            competency({ key: 'crawl', label: 'Crawling', area: 'Ingestion' }),
            competency({ key: 'oidc', label: 'OIDC', area: 'Authentication' }),
        ]);

        expect(groups.map((group) => group.area)).toEqual(['Authentication', 'Ingestion']);
        expect(groups[0].competencies.map((one) => one.label)).toEqual(['JWT', 'OIDC']);
    });

    /**
     * `null` is a real state — hand-authored before anybody typed an area, or a vocabulary older
     * than generation. Filing it under an invented "General" would read as a judgement somebody
     * made, so it is named for what is actually true and kept out of the way.
     */
    it('keeps ungrouped competencies as their own bucket, last', () => {
        const groups = groupByArea([
            competency({ key: 'loose', label: 'Loose end' }),
            competency({ key: 'zed', label: 'Zed', area: 'Zebra' }),
            competency({ key: 'jwt', label: 'JWT', area: 'Authentication' }),
        ]);

        expect(groups.map((group) => group.area)).toEqual(['Authentication', 'Zebra', null]);
    });

    it('matches label, key, description and area', () => {
        const vocabulary = [
            competency({ key: 'jwt', label: 'JWT', area: 'Authentication' }),
            competency({ key: 'crawl', label: 'Crawling', description: 'Walks a repository' }),
        ];

        expect(groupByArea(vocabulary, 'authent')).toHaveLength(1);
        expect(groupByArea(vocabulary, 'jwt')[0].competencies[0].key).toBe('jwt');
        expect(groupByArea(vocabulary, 'repository')[0].competencies[0].key).toBe('crawl');
    });

    it('ignores case and surrounding space in the query', () => {
        const groups = groupByArea([competency({ label: 'Kotlin' })], '  kOtLiN  ');

        expect(groups[0].competencies).toHaveLength(1);
    });

    it('returns everything for a blank query', () => {
        const groups = groupByArea([competency({ key: 'a' }), competency({ key: 'b' })], '   ');

        expect(groups[0].competencies).toHaveLength(2);
    });

    /**
     * An area with nothing left in it after filtering is not a heading over empty space.
     */
    it('drops an area the query emptied', () => {
        const groups = groupByArea(
            [
                competency({ key: 'jwt', label: 'JWT', area: 'Authentication' }),
                competency({ key: 'crawl', label: 'Crawling', area: 'Ingestion' }),
            ],
            'jwt',
        );

        expect(groups.map((group) => group.area)).toEqual(['Authentication']);
    });

    /**
     * The caller has to tell "matched nothing" from "there is nothing" — they need opposite advice,
     * and recycling the empty-vocabulary state would tell somebody with 200 competencies to go
     * connect a repository.
     */
    it('returns no groups at all when the query matches nothing', () => {
        expect(groupByArea([competency({ label: 'Kotlin' })], 'rust')).toEqual([]);
    });

    /**
     * The backend folds case and spacing when an area is written, so two spellings of one area
     * cannot reach here. Folding again would be a second opinion about identity — the thing that
     * splits a grouping into synonyms of itself.
     */
    it('does not fold two spellings together itself', () => {
        const groups = groupByArea([
            competency({ key: 'a', area: 'Ingestion' }),
            competency({ key: 'b', area: 'ingestion' }),
        ]);

        expect(groups).toHaveLength(2);
    });
});
