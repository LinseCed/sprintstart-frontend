import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillsRail } from '../../../../src/features/my-path/components/SkillsRail';
import type { MyCompetency } from '../../../../src/features/my-path/types';

function competency(overrides: Partial<MyCompetency> = {}): MyCompetency {
    return {
        competencyKey: 'kotlin',
        label: 'Kotlin',
        kind: 'SKILL',
        level: 2,
        targetLevel: 2,
        source: 'VERIFIED',
        updatedAt: '2026-07-19T00:00:00Z',
        ...overrides
    };
}

function renderRail(competencies: MyCompetency[], graphKeys: string[] = ['kotlin']) {
    const onFocusKey = vi.fn();
    render(
        <SkillsRail
            competencies={competencies}
            isLoading={false}
            error={null}
            graphKeys={new Set(graphKeys)}
            onFocusKey={onFocusKey}
        />
    );
    return { onFocusKey };
}

function section(name: string | RegExp) {
    return screen.getByRole('heading', { name }).closest('section') as HTMLElement;
}

describe('SkillsRail', () => {
    it('lists a competency at or above its target level as a held skill', () => {
        renderRail([competency({ level: 2, targetLevel: 2 })]);

        expect(within(section(/on this project/i)).getByText('Kotlin')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /in progress/i })).not.toBeInTheDocument();
    });

    it('does not present a below-target competency as a held skill', () => {
        // The live bug: a hire who said "i dont know, i am a beginner" was placed at level 1
        // and the rail listed it next to skills they had actually proven.
        renderRail([competency({ level: 1, targetLevel: 2, source: 'ASSESSED' })]);

        expect(screen.queryByRole('heading', { name: /on this project/i })).not.toBeInTheDocument();
        expect(within(section(/in progress/i)).getByText('Kotlin')).toBeInTheDocument();
    });

    it('shows a below-target row as distance to go rather than a bare level', () => {
        renderRail([competency({ level: 1, targetLevel: 3 })]);

        expect(screen.getByText('L1 of 3')).toBeInTheDocument();
    });

    it('keeps a level-0 row off the rail entirely', () => {
        // 0 means "we asked and saw no competence" -- not even progress.
        renderRail([competency({ level: 0, targetLevel: 2, source: 'ASSESSED' })]);

        expect(screen.queryByText('Kotlin')).not.toBeInTheDocument();
        expect(screen.getByText(/nothing on your ledger yet/i)).toBeInTheDocument();
    });

    it('separates held skills proven elsewhere from this project’s graph', () => {
        renderRail(
            [
                competency({ competencyKey: 'kotlin', label: 'Kotlin' }),
                competency({ competencyKey: 'rust', label: 'Rust' })
            ],
            ['kotlin']
        );

        expect(within(section(/on this project/i)).getByText('Kotlin')).toBeInTheDocument();
        expect(within(section(/transferable/i)).getByText('Rust')).toBeInTheDocument();
    });

    it('lets an in-progress skill on the graph focus its node', async () => {
        const { onFocusKey } = renderRail([competency({ level: 1, targetLevel: 2 })]);

        await userEvent.click(screen.getByRole('button', { name: /Kotlin/ }));

        expect(onFocusKey).toHaveBeenCalledWith('kotlin');
    });

    it('offers no node to focus for an in-progress skill off the graph', () => {
        renderRail([competency({ level: 1, targetLevel: 2 })], []);

        expect(within(section(/in progress/i)).queryByRole('button')).not.toBeInTheDocument();
    });
});
