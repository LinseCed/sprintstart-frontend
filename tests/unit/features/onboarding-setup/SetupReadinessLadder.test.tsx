import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SetupReadinessLadder } from '../../../../src/features/onboarding-setup/components/SetupReadinessLadder';
import { buildLadder } from '../../../../src/features/onboarding-setup/ladder';
import type { SetupRung } from '../../../../src/features/onboarding-setup/types';

const corpus = (state: SetupRung['state'] = 'OK'): SetupRung => ({
    key: 'corpus',
    state,
    count: state === 'OK' ? 663 : 0,
    detail: state === 'OK' ? '663 artifacts ingested.' : 'No sources connected yet.',
});

function renderLadder(rungs: SetupRung[], corpusRung = corpus()) {
    const ladder = buildLadder(
        { projectId: 'p1', rungs, ready: rungs.every((r) => r.state === 'OK') },
        corpusRung,
    );

    return render(
        <MemoryRouter>
            <SetupReadinessLadder ladder={ladder} />
        </MemoryRouter>,
    );
}

const allOk: SetupRung[] = [
    { key: 'skill-map', state: 'OK', count: 6, detail: '6 competencies.' },
    { key: 'starter-tasks', state: 'OK', count: 2, detail: '2 starter tasks ready to claim.' },
    { key: 'tracks', state: 'OK', count: 3, detail: 'Every role says which track it onboards on.' },
];

describe('SetupReadinessLadder', () => {
    /**
     * The whole point of D4. A rung that reads as a chore invents work — the *dead work* failure
     * the baseline died of, where a ladder rung asks a PM for something nothing reads and looks
     * like progress while somebody does it. Three of these four fill themselves in from a crawl.
     */
    it('never labels an unfinished stage as somebody’s outstanding task', () => {
        renderLadder([
            { key: 'skill-map', state: 'WARN', count: 0, detail: 'No competencies yet.' },
            { key: 'starter-tasks', state: 'WARN', count: 0, detail: 'No starter tasks yet.' },
        ]);

        expect(screen.queryByText('Needs you')).not.toBeInTheDocument();
        expect(screen.getAllByText('Not yet').length).toBeGreaterThan(0);
    });

    /**
     * "2 stages need attention" is a count of chores, and counting them is what made this a
     * checklist. Nothing here is outstanding work.
     */
    it('does not count how many stages are unfinished', () => {
        renderLadder([
            { key: 'skill-map', state: 'WARN', count: 0, detail: 'No competencies yet.' },
            { key: 'starter-tasks', state: 'WARN', count: 0, detail: 'No starter tasks yet.' },
        ]);

        expect(screen.queryByText(/\d+ stages?/)).not.toBeInTheDocument();
        expect(screen.queryByText(/need.? attention/i)).not.toBeInTheDocument();
    });

    /** Nothing here gates anything, and an unready project has to say so where it is read. */
    it('says nobody is held up while a stage is unfinished', () => {
        renderLadder([{ key: 'skill-map', state: 'WARN', count: 0, detail: 'No competencies.' }]);

        expect(screen.getByText(/Nobody is blocked meanwhile/i)).toBeInTheDocument();
    });

    it('describes a ready project by what it has, not by stages being done', () => {
        renderLadder(allOk);

        expect(screen.getByText(/a corpus, a vocabulary, and work they can claim/i)).toBeInTheDocument();
    });

    /**
     * Each rung links to the thing it is about. "Open this stage" framed every one as a step in a
     * pipeline somebody advances, and there is no pipeline left to advance.
     */
    it('names each link for the thing it opens', () => {
        renderLadder(allOk);

        expect(screen.getByRole('link', { name: /Open Data Ingestion/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Open the studio/ })).toBeInTheDocument();
        expect(screen.queryByText('Open this stage')).not.toBeInTheDocument();
    });

    /**
     * Since D1, mined tasks are claimable the moment they land. "Review proposals" told a PM that
     * work was held up pending their decision, which it is not.
     */
    it('does not call the mined-task link a review queue', () => {
        renderLadder(allOk);

        expect(screen.getByRole('link', { name: /Look over what was mined/ })).toBeInTheDocument();
        expect(screen.queryByText('Review proposals')).not.toBeInTheDocument();
    });
});
