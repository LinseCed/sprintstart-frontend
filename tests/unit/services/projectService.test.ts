import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from '../../../src/services/projectService';

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: vi.fn(),
    }
}));

describe('projectService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        projectService.resetProjectMocks(); // ensures tests are clean if mocks are used
    });

    it('getProjects fetches from api when mocks are disabled or just returns mock list', async () => {
        // Since USE_PROJECT_MOCKS is hardcoded to true in the file currently,
        // we can test if it returns the mock list correctly.
        const projects = await projectService.getProjects();
        expect(projects).toBeDefined();
        expect(Array.isArray(projects)).toBe(true);
    });

    it('getProjectById returns mapped project details', async () => {
        const projects = await projectService.getProjects();
        if (projects.length === 0) return; // Skip if no mock projects

        const projectId = projects[0].id;
        const details = await projectService.getProjectById(projectId);
        
        expect(details.id).toBe(projectId);
        expect(details.users).toBeDefined(); // detail object has fully mapped users array
    });

    it('createProject returns newly created project mock', async () => {
        const req = { name: 'Test Project', description: 'Test Desc', tags: ['T1'] };
        const newProject = await projectService.createProject(req);
        
        expect(newProject.name).toBe('Test Project');
        expect(newProject.description).toBe('Test Desc');
        expect(newProject.tags).toContain('T1');
        
        const all = await projectService.getProjects();
        expect(all.some(p => p.id === newProject.id)).toBe(true);
    });

    it('updateProject modifies existing project mock', async () => {
        const projects = await projectService.getProjects();
        if (projects.length === 0) return;

        const target = projects[0];
        const updated = await projectService.updateProject(target.id, { name: 'Updated Name' });
        
        expect(updated.name).toBe('Updated Name');
        // Unmodified fields should remain
        expect(updated.description).toBe(target.description);
    });

    it('deleteProject removes project from mock list', async () => {
        const newProject = await projectService.createProject({ name: 'To Delete' });
        
        let all = await projectService.getProjects();
        expect(all.some(p => p.id === newProject.id)).toBe(true);

        await projectService.deleteProject(newProject.id);

        all = await projectService.getProjects();
        expect(all.some(p => p.id === newProject.id)).toBe(false);
    });
});
