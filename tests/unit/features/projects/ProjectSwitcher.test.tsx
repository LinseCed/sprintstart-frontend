import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import { ProjectSwitcher } from '../../../../src/features/projects/components/ProjectSwitcher';
import type { SelectableProject } from '../../../../src/features/projects/ProjectContext';

const setSelectedProjectId = vi.fn();

const contextValue = {
    projects: [] as SelectableProject[],
    selectedProject: null as SelectableProject | null,
    selectedProjectId: '',
    canManageSelected: false,
    isSwitcherEnabled: true,
    isLoading: false,
    errorMessage: null as string | null,
    setSelectedProjectId,
    reloadProjects: vi.fn()
};

vi.mock('../../../../src/features/projects/useProjectContext', () => ({
    useProjectContext: () => contextValue
}));

function project(id: string, name: string, isManaged: boolean): SelectableProject {
    return { id, name, description: '', manager: null, sources: [], users: [], isManaged };
}

const managed = project('p1', 'Apollo', true);
const member = project('p2', 'Borealis', false);

describe('ProjectSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        contextValue.projects = [managed, member];
        contextValue.selectedProject = managed;
        contextValue.selectedProjectId = 'p1';
        contextValue.isSwitcherEnabled = true;
        contextValue.isLoading = false;
        contextValue.errorMessage = null;
    });

    it('renders nothing for permission groups without a switcher', () => {
        contextValue.isSwitcherEnabled = false;

        const { container } = render(<ProjectSwitcher />);

        expect(container).toBeEmptyDOMElement();
    });

    it('exposes the current project and has no axe violations when open', async () => {
        const user = userEvent.setup();
        // Wrapped in a landmark because the switcher normally lives inside the
        // sidebar's <aside>; rendering it bare trips axe's region rule.
        const { baseElement } = render(
            <nav aria-label="Sidebar">
                <ProjectSwitcher />
            </nav>,
        );

        const trigger = screen.getByRole('button', { name: /Current project: Apollo/ });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox', { name: 'Projects' })).toBeInTheDocument();
        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('marks the selected project and groups managed projects separately', async () => {
        const user = userEvent.setup();
        render(<ProjectSwitcher />);

        await user.click(screen.getByRole('button', { name: /Current project: Apollo/ }));

        expect(screen.getByRole('option', { name: /Apollo/ })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: /Borealis/ })).toHaveAttribute('aria-selected', 'false');

        // "Managed by you" also appears as the trigger's hint, so scope the
        // group-header assertions to the listbox.
        const listbox = screen.getByRole('listbox', { name: 'Projects' });
        expect(within(listbox).getByText('Managed by you')).toBeInTheDocument();
        expect(within(listbox).getByText('Member of')).toBeInTheDocument();
    });

    it('filters projects by the search term', async () => {
        const user = userEvent.setup();
        render(<ProjectSwitcher />);

        await user.click(screen.getByRole('button', { name: /Current project: Apollo/ }));
        await user.type(screen.getByRole('combobox', { name: 'Search projects' }), 'bore');

        expect(screen.queryByRole('option', { name: /Apollo/ })).not.toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Borealis/ })).toBeInTheDocument();
    });

    it('selects a project with the keyboard', async () => {
        const user = userEvent.setup();
        render(<ProjectSwitcher />);

        await user.click(screen.getByRole('button', { name: /Current project: Apollo/ }));
        await user.keyboard('{ArrowDown}{Enter}');

        expect(setSelectedProjectId).toHaveBeenCalledWith('p2');
    });

    it('closes on Escape and returns focus to the trigger', async () => {
        const user = userEvent.setup();
        render(<ProjectSwitcher />);

        const trigger = screen.getByRole('button', { name: /Current project: Apollo/ });
        await user.click(trigger);
        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('surfaces a loading state instead of an empty list', async () => {
        const user = userEvent.setup();
        contextValue.isLoading = true;
        contextValue.projects = [];

        render(<ProjectSwitcher />);
        await user.click(screen.getByRole('button', { name: /Current project: Apollo/ }));

        expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });
});
