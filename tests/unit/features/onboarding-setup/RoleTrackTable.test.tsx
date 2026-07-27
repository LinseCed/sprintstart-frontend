import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoleTrackTable } from '../../../../src/features/onboarding-setup/components/RoleTrackTable';
import type {
    OnboardingTrack,
    ProjectRoleWithTrack,
} from '../../../../src/features/onboarding-setup/types';

const ENGINEERING: OnboardingTrack = {
    key: 'engineering',
    label: 'Engineering',
    contributionNoun: 'change',
    contributionNounPlural: 'changes',
    contributionVerbPast: 'merged',
    evidenceKinds: ['PULL_REQUEST'],
};

const DELIVERY: OnboardingTrack = {
    key: 'delivery',
    label: 'Agile delivery',
    contributionNoun: 'ceremony',
    contributionNounPlural: 'ceremonies',
    contributionVerbPast: 'facilitated',
    evidenceKinds: [],
};

const role = (over: Partial<ProjectRoleWithTrack> = {}): ProjectRoleWithTrack => ({
    id: 'r1',
    name: 'Backend Developer',
    description: 'Builds services',
    onboardingTrackKey: 'engineering',
    ...over,
});

function renderTable(over: Partial<Parameters<typeof RoleTrackTable>[0]> = {}) {
    const props = {
        tracks: [ENGINEERING, DELIVERY],
        roles: [role()],
        loading: false,
        error: false,
        savingRoleId: null,
        saveError: null,
        setTrack: vi.fn().mockResolvedValue(undefined),
        canEdit: true,
        ...over,
    };
    render(<RoleTrackTable {...props} />);
    return props;
}

describe('RoleTrackTable', () => {
    it('describes what a role\'s current track means in its own words', () => {
        renderTable();

        // "Engineering" appears twice — as the summary and as the selected option — so the
        // meaningful assertion is the sentence, not the label.
        expect(screen.getByText(/counts once merged/)).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument();
    });

    it('warns that a track admitting no evidence cannot measure progress', () => {
        renderTable({ roles: [role({ onboardingTrackKey: 'delivery' })] });

        // The consequence belongs next to the choice: assigning this track is legitimate for the
        // vocabulary, but nothing that role does can be observed by anything connected today.
        expect(
            screen.getByText(/progress will stay at zero/i),
        ).toBeInTheDocument();
    });

    it('says a role with no track falls back to the default rather than being broken', () => {
        renderTable({ roles: [role({ onboardingTrackKey: null })] });

        expect(screen.getByText(/uses the default track/i)).toBeInTheDocument();
    });

    it('sends the chosen track key', () => {
        const { setTrack } = renderTable();

        fireEvent.change(screen.getByLabelText(/Onboarding track for Backend Developer/i), {
            target: { value: 'delivery' },
        });

        expect(setTrack).toHaveBeenCalledWith('r1', 'delivery');
    });

    it('clears the track as null rather than a sentinel string', () => {
        const { setTrack } = renderTable();

        fireEvent.change(screen.getByLabelText(/Onboarding track for Backend Developer/i), {
            target: { value: '__unset__' },
        });

        expect(setTrack).toHaveBeenCalledWith('r1', null);
    });

    it('disables the control for somebody who may read but not set tracks', () => {
        renderTable({ canEdit: false });

        expect(screen.getByLabelText(/Onboarding track for Backend Developer/i)).toBeDisabled();
    });

    it('points at where roles are created when none exist yet', () => {
        renderTable({ roles: [] });

        expect(screen.getByText(/No project roles exist yet/i)).toBeInTheDocument();
    });
});
