import { describe, it, expect } from 'vitest';
import { buildLadder, deriveCorpusRung } from '../../../../src/features/onboarding-setup/ladder';
import type { SetupReadiness, SetupRung } from '../../../../src/features/onboarding-setup/types';
import type { DataSource } from '../../../../src/features/data-ingestion/types';

function source(status: DataSource['status'], latestIngestedCount: number): DataSource {
    return { status, latestIngestedCount } as DataSource;
}

function readiness(rungs: SetupRung[]): SetupReadiness {
    return { projectId: 'p1', rungs, ready: rungs.every((r) => r.state === 'OK') };
}

describe('deriveCorpusRung', () => {
    it('is OK and totals ingested artifacts when any source is connected', () => {
        const rung = deriveCorpusRung([source('connected', 400), source('warning', 263)]);
        expect(rung.state).toBe('OK');
        expect(rung.count).toBe(663);
        expect(rung.detail).toContain('663 artifacts');
    });

    it('warns that the first sync is running when nothing is connected yet', () => {
        const rung = deriveCorpusRung([source('running', 0)]);
        expect(rung.state).toBe('WARN');
        expect(rung.detail).toContain('running');
    });

    it('warns to connect a source when there are none', () => {
        const rung = deriveCorpusRung([]);
        expect(rung.state).toBe('WARN');
        expect(rung.detail).toContain('Connect a repository');
    });
});

describe('buildLadder', () => {
    const corpusOk: SetupRung = { key: 'corpus', state: 'OK', count: 663, detail: '663 artifacts ingested.' };

    it('renders the three stages corpus-first, in pipeline order', () => {
        const ladder = buildLadder(
            readiness([
                { key: 'skill-map', state: 'OK', count: 6, detail: '6 competencies approved.' },
                { key: 'starter-tasks', state: 'OK', count: 2, detail: '2 starter tasks ready to claim.' },
            ]),
            corpusOk,
        );
        // The baseline rung went when the path became goal-directed: it was asking a PM to make a
        // selection nothing read, which looks like progress while somebody does it.
        expect(ladder.rungs.map((r) => r.key)).toEqual(['corpus', 'skill-map', 'starter-tasks']);
        expect(ladder.rungs[1].title).toBe('Skill map approved');
        expect(ladder.rungs[1].route).toBe('/graph-studio');
        expect(ladder.ready).toBe(true);
    });

    // The bug that started this: a map was generated but never approved, so a page read empty.
    it('is not ready when proposals await review', () => {
        const ladder = buildLadder(
            readiness([
                {
                    key: 'skill-map',
                    state: 'WARN',
                    count: 0,
                    detail: '25 competencies and 19 edges are waiting for your review.',
                },
                { key: 'starter-tasks', state: 'WARN', count: 0, detail: 'No starter tasks yet.' },
            ]),
            corpusOk,
        );
        expect(ladder.ready).toBe(false);
        const skillMap = ladder.rungs.find((r) => r.key === 'skill-map');
        expect(skillMap?.state).toBe('WARN');
        expect(skillMap?.detail).toContain('waiting for your review');
    });

    it('renders the tracks rung last, pointing at the role table on this same page', () => {
        const ladder = buildLadder(
            readiness([
                { key: 'skill-map', state: 'OK', count: 6, detail: 'ok' },
                { key: 'starter-tasks', state: 'OK', count: 2, detail: 'ok' },
                {
                    key: 'tracks',
                    state: 'WARN',
                    count: 1,
                    detail: '2 of 3 people here have no track on their role.',
                },
            ]),
            corpusOk,
        );
        expect(ladder.rungs.map((r) => r.key)).toEqual([
            'corpus',
            'skill-map',
            'starter-tasks',
            'tracks',
        ]);
        // The role-track table sits under the ladder, so "open" stays put rather than navigating.
        expect(ladder.rungs[3].route).toBe('/setup');
        expect(ladder.ready).toBe(false);
    });

    // A rung the client does not know is dropped rather than rendered blank, so a backend that
    // grows a stage cannot put an unlabelled row in front of a PM.
    it('ignores a rung it has no metadata for', () => {
        const ladder = buildLadder(
            readiness([
                { key: 'skill-map', state: 'OK', count: 6, detail: 'ok' },
                { key: 'starter-tasks', state: 'OK', count: 2, detail: 'ok' },
                { key: 'something-new', state: 'WARN', count: 0, detail: 'from a newer backend' },
            ]),
            corpusOk,
        );
        expect(ladder.rungs.map((r) => r.key)).toEqual(['corpus', 'skill-map', 'starter-tasks']);
        expect(ladder.ready).toBe(true);
    });

    it('is not ready when the corpus rung is not OK even if the backend rungs are', () => {
        const ladder = buildLadder(
            readiness([
                { key: 'skill-map', state: 'OK', count: 6, detail: 'ok' },
                { key: 'starter-tasks', state: 'OK', count: 2, detail: 'ok' },
            ]),
            { key: 'corpus', state: 'WARN', count: 0, detail: 'No corpus yet.' },
        );
        expect(ladder.ready).toBe(false);
    });
});
