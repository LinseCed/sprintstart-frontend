import teamOverviewMock from '../mocks/teamOverviewMock.json';
import type { TeamOverviewUser } from '../features/team-management/types';

export async function getTeamOverview(): Promise<TeamOverviewUser[]> {
    return Promise.resolve(teamOverviewMock.users);
}
export async function getTeamMember(userId: string): Promise<TeamOverviewUser | undefined> {
    const users = await getTeamOverview();
    return users.find((user) => user.userId === userId);
}