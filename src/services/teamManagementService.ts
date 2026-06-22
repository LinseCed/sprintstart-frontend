import teamOverviewMock from '../mocks/teamOverviewMock.json';
import type { TeamOverviewUser } from '../features/team-management/types';

export async function getTeamOverview(): Promise<TeamOverviewUser[]> {
    return Promise.resolve(teamOverviewMock.users as TeamOverviewUser[]);
}

export async function getTeamMember(
    userId: string
): Promise<TeamOverviewUser | undefined> {
    return (teamOverviewMock.users as TeamOverviewUser[]).find(
        (user) => user.userId === userId
    );
}