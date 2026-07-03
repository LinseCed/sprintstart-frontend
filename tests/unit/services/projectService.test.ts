import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '../../../src/services/projectService';

describe('projectService', () => {
    beforeEach(() => {
        projectService.resetProjectMocks();
    });

    it('getProjects returns a list of projects', async () => {
        const projects = await projectService.getProjects();
        expect(Array.isArray(projects)).toBe(true);
    });

    it('getProjectById returns project details with users', async () => {
        const projects = await projectService.getProjects();
        if (projects.length === 0) return;

        const details = await projectService.getProjectById(projects[0].id);
        expect(details.id).toBe(projects[0].id);
        expect(Array.isArray(details.users)).toBe(true);
    });

    it('createProject adds a new project to the list', async () => {
        const newProject = await projectService.createProject({
            name: 'Test Project',
            description: 'Test Desc',
            tags: ['T1'],
        });

        expect(newProject.name).toBe('Test Project');

        const all = await projectService.getProjects();
        expect(all.some((p) => p.id === newProject.id)).toBe(true);
    });

    it('updateProject modifies an existing project', async () => {
        const projects = await projectService.getProjects();
        if (projects.length === 0) return;

        const updated = await projectService.updateProject(projects[0].id, { name: 'Updated' });
        expect(updated.name).toBe('Updated');
        expect(updated.description).toBe(projects[0].description);
    });

    it('deleteProject removes a project from the list', async () => {
        const newProject = await projectService.createProject({ name: 'To Delete' });

        let all = await projectService.getProjects();
        expect(all.some((p) => p.id === newProject.id)).toBe(true);

        await projectService.deleteProject(newProject.id);

        all = await projectService.getProjects();
        expect(all.some((p) => p.id === newProject.id)).toBe(false);
    });
});
