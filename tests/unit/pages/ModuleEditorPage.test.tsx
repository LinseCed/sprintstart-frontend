import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleEditorPage } from '../../../src/pages/ModuleEditorPage';
import { PermissionGroup } from '../../../src/services/types';

const profile: { permissionGroup: PermissionGroup } = {
    permissionGroup: PermissionGroup.PM,
};
vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile }),
}));

vi.mock('../../../src/services/competencyModuleService', () => ({
    competencyModuleService: {
        get: vi.fn(),
        addPage: vi.fn(),
        updatePage: vi.fn(),
        deletePage: vi.fn(),
        reorderPages: vi.fn(),
        approve: vi.fn(),
        reject: vi.fn(),
    },
}));

import { competencyModuleService } from '../../../src/services/competencyModuleService';

const page = (id: string, title: string, position: number, provenance = 'AI') => ({
    id,
    kind: 'LESSON',
    title,
    body: `${title} body`,
    position,
    provenance,
    updatedAt: '2026-07-20T10:00:00Z',
});

const draft = {
    id: 'm1',
    competencyKey: 'deploy',
    competencyLabel: 'Deploy the service',
    projectId: 'p1',
    version: 2,
    status: 'PROPOSED',
    origin: 'AI',
    title: 'Deploying',
    summary: null,
    pages: [page('pg1', 'First', 0), page('pg2', 'Second', 1), page('pg3', 'Third', 2, 'PM')],
    verificationType: 'KNOWLEDGE',
    updatedAt: '2026-07-20T10:00:00Z',
};

function renderEditor() {
    return render(
        <MemoryRouter initialEntries={['/competency-modules/m1']}>
            <Routes>
                <Route path="/graph-studio" element={<p>studio</p>} />
                <Route path="/competency-modules/:moduleId" element={<ModuleEditorPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('ModuleEditorPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        profile.permissionGroup = PermissionGroup.PM;
        vi.mocked(competencyModuleService.get).mockResolvedValue(draft as never);
    });

    it('frames editing as publishing to everyone, not a private draft', async () => {
        renderEditor();

        expect(await screen.findByText(/there is no per-person copy/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /publish to everyone/i })).toBeInTheDocument();
    });

    it('says what regenerating would replace, before it happens', async () => {
        renderEditor();

        // Two of three pages are still AI drafts.
        expect(await screen.findByText(/2 of 3 pages are still AI drafts/i)).toBeInTheDocument();
        expect(
            screen.getByText(/leave anything you have edited untouched/i),
        ).toBeInTheDocument();
    });

    it('reorders with a single ordered call, not one call per page', async () => {
        vi.mocked(competencyModuleService.reorderPages).mockResolvedValue(draft as never);
        const user = userEvent.setup();
        renderEditor();

        await user.click(await screen.findByRole('button', { name: /move second up/i }));

        await waitFor(() => {
            expect(competencyModuleService.reorderPages).toHaveBeenCalledTimes(1);
        });
        expect(competencyModuleService.reorderPages).toHaveBeenCalledWith('m1', [
            'pg2',
            'pg1',
            'pg3',
        ]);
    });

    it('saves a page edit and reloads, since positions are renumbered server-side', async () => {
        vi.mocked(competencyModuleService.updatePage).mockResolvedValue(draft.pages[0] as never);
        const user = userEvent.setup();
        renderEditor();

        const editor = await screen.findByTestId('page-editor-pg1');
        const body = editor.querySelector('textarea') as HTMLTextAreaElement;
        await user.type(body, ' more');
        await user.click(within(editor).getByRole('button', { name: 'Save page' }));

        await waitFor(() => {
            expect(competencyModuleService.updatePage).toHaveBeenCalledWith(
                'pg1',
                expect.objectContaining({ body: 'First body more' }),
            );
        });
        expect(competencyModuleService.get).toHaveBeenCalledTimes(2);
    });

    it('publishes on an explicit act, never as a side effect of editing', async () => {
        vi.mocked(competencyModuleService.approve).mockResolvedValue(draft as never);
        const user = userEvent.setup();
        renderEditor();

        await user.click(await screen.findByRole('button', { name: /publish to everyone/i }));

        await waitFor(() => {
            expect(competencyModuleService.approve).toHaveBeenCalledWith('m1');
        });
    });

    it('treats a live version as a read-only record of what hires were taught', async () => {
        vi.mocked(competencyModuleService.get).mockResolvedValue({
            ...draft,
            status: 'ACTIVE',
        } as never);

        renderEditor();

        expect(await screen.findByText(/it is read-only/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save page' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /add page/i })).not.toBeInTheDocument();
    });

    it('lets HR read the module but not change it', async () => {
        profile.permissionGroup = PermissionGroup.HR;

        renderEditor();

        expect(await screen.findByTestId('page-editor-pg1')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save page' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /publish to everyone/i })).not.toBeInTheDocument();
    });
});
