/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OnBoardingPage } from '../../../src/pages/OnBoardingPage';
import { onboardingService } from '../../../src/services/onboardingService';
import { userService } from '../../../src/services/userService';
import { ApiError } from '../../../src/services/apiClient';

vi.mock('../../../src/services/onboardingService', () => ({
    onboardingService: {
        fetchPath: vi.fn(),
        personalizePath: vi.fn(),
        startStep: vi.fn(),
    }
}));

vi.mock('../../../src/services/userService', () => ({
    userService: {
        getProfile: vi.fn(),
    }
}));

describe('OnBoardingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default happy path mock
        vi.mocked(userService.getProfile).mockResolvedValue({ id: 'user1' } as any);
    });

    it('renders loading state initially', () => {
        // Delay fetchPath indefinitely to catch loading state
        vi.mocked(onboardingService.fetchPath).mockImplementation(() => new Promise(() => {}));
        render(<MemoryRouter><OnBoardingPage /></MemoryRouter>);
        
        expect(screen.getByText('Loading onboarding path...')).toBeInTheDocument();
    });

    it('renders error state on unexpected failure', async () => {
        vi.mocked(onboardingService.fetchPath).mockRejectedValue(new Error('Network error'));
        
        render(<MemoryRouter><OnBoardingPage /></MemoryRouter>);
        
        await waitFor(() => {
            expect(screen.getByText('Onboarding could not be loaded')).toBeInTheDocument();
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    it('transitions to generating state if 404 is thrown, and succeeds', async () => {
        // Simulate no path exists
        vi.mocked(onboardingService.fetchPath).mockRejectedValue(new ApiError(404, 'Not Found'));
        
        // Mock the SSE stream behavior for personalizePath
        vi.mocked(onboardingService.personalizePath).mockImplementation(async (handlers) => {
            await Promise.resolve();
            handlers.onStage?.('Planning Phase', 'Creating items');
            // Allow UI to render generating stage
            setTimeout(() => {
                handlers.onPath({
                    id: 'newPath',
                    phases: [{
                        id: 'phase1', title: 'Phase 1', description: '', steps: [
                            { id: 's1', title: 'Step 1', status: 'OPEN', estimatedMinutes: 10 }
                        ]
                    }]
                } as any);
                handlers.onDone();
            }, 10);
        });

        render(<MemoryRouter><OnBoardingPage /></MemoryRouter>);
        
        // Wait for it to hit the generating state and verify output
        await waitFor(() => {
            expect(screen.getByText('Generating your personalized onboarding path...')).toBeInTheDocument();
            expect(screen.getByText('Planning Phase')).toBeInTheDocument();
            expect(screen.getByText('Creating items')).toBeInTheDocument();
        });

        // Eventually it succeeds and shows the path
        await waitFor(() => {
            expect(screen.getByText('Your onboarding journey')).toBeInTheDocument();
            expect(screen.getAllByText('Phase 1').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Step 1').length).toBeGreaterThan(0);
        });
    });

    it('renders populated path and computes progress', async () => {
        const mockPath = {
            id: 'path1',
            phases: [
                {
                    id: 'phase1',
                    title: 'Onboarding Phase 1',
                    description: 'Desc 1',
                    steps: [
                        { id: 'step1', title: 'Step 1', status: 'FINISHED' },
                        { id: 'step2', title: 'Step 2', status: 'IN_PROGRESS' },
                        { id: 'step3', title: 'Step 3', status: 'OPEN' }
                    ]
                }
            ]
        };
        vi.mocked(onboardingService.fetchPath).mockResolvedValue(mockPath as any);

        render(<MemoryRouter><OnBoardingPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Your onboarding journey')).toBeInTheDocument();
        });

        // 1 finished out of 3 steps = 33% overall and phase progress
        expect(screen.getAllByText('33%').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Onboarding Phase 1').length).toBeGreaterThan(0);
        expect(screen.getByText('1/3 Tasks')).toBeInTheDocument();

        // The banner for the recommended next step should show Step 2
        // because it's IN_PROGRESS (the first one not FINISHED/SKIPPED)
        const bannerTitle = screen.getAllByText('Step 2')[0]; // The h2 in the banner
        expect(bannerTitle).toBeInTheDocument();
    });
});
