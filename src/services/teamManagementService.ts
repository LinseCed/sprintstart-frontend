import { apiClient } from "./apiClient";
import { competencyDashboardService } from "./competencyDashboardService";
import type {
  ProjectRole,
  Skill,
  TeamOverviewUser,
  SkillStatus,
} from "../features/team-management/types";

/**
 * The team, each member with their competency ledger.
 *
 * Reads `GET /onboarding/dashboard/users`. The old `/onboarding/team-overview` this used to call
 * was deleted with the per-user step tree (backend#53) and had been 404ing ever since -- which
 * was invisible because this function used to `catch` and return a bundled fixture of thirteen
 * invented people. Errors now propagate so a broken call looks broken.
 */
export async function getTeamOverview(
  roleId?: string,
  _sortBy?: string,
  projectIds?: string[],
): Promise<TeamOverviewUser[]> {
  const page = await competencyDashboardService.fetchUserCompetencySummaries({
    roleIds: roleId && roleId !== "all" ? [roleId] : undefined,
    projectIds,
    size: 100,
  });

  const users: TeamOverviewUser[] = page.content.map((summary) => ({
    userId: summary.userId,
    firstname: summary.firstname,
    lastname: summary.lastname,
    profileIcon: summary.profileIcon,
    roles: summary.roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: "",
    })),
    projects: summary.projects,
    competencies: summary.competencies,
    hasFeedback: false,
  }));

  // Unread feedback is a separate endpoint; a failure there must not blank the team list, so it
  // degrades to "no feedback flags" rather than taking the page down with it.
  try {
    const feedback = await getAllOnboardingFeedback();
    const withUnread = new Set(
      feedback
        .filter((item) => item.read !== true && !item.readAt)
        .map((item) => item.userId)
        .filter((userId): userId is string => Boolean(userId)),
    );
    return users.map((user) => ({
      ...user,
      hasFeedback: withUnread.has(user.userId),
    }));
  } catch {
    return users;
  }
}

export async function getTeamMember(
  userId: string,
): Promise<TeamOverviewUser | undefined> {
  const users = await getTeamOverview();

  return users.find((user) => user.userId === userId);
}



export async function getProjectRoles(): Promise<ProjectRole[]> {
  const response = await apiClient.fetch<
    { projectRoles?: ProjectRole[] } | ProjectRole[]
  >("/api/v1/projectRoles");

  return Array.isArray(response) ? response : (response.projectRoles ?? []);
}

export async function createProjectRole(
name: string,
description: string,
): Promise<ProjectRole> {
// No fallback: silently "creating" a role in memory reported success for a write that never
// reached the server, so the role vanished on reload.
return await apiClient.fetch<ProjectRole>("/api/v1/projectRoles", {
  method: "POST",
  body: JSON.stringify({ name, description }),
});
}

export async function assignProjectRoleToUser(
userId: string,
roleId: string,
): Promise<void> {
  await apiClient.fetch(`/api/v1/users/${userId}/project-roles`, {
    method: "POST",
    body: JSON.stringify({ roleId }),
  });
}

export async function unassignProjectRoleFromUser(
  userId: string,
  roleId: string,
): Promise<void> {
  await apiClient.fetch(`/api/v1/users/${userId}/project-roles/${roleId}`, {
    method: "DELETE",
  });

  return;
}

export type OnboardingFeedback = {
  id: string;
  userId?: string;
  pageId?: string | null;
  pageTitle?: string | null;
  moduleId?: string | null;
  competencyKey?: string | null;
  message: string;
  comment?: string;
  helpful?: boolean | null;
  createdAt?: string;
  read?: boolean;
  readAt?: string | null;
};

export async function getUserOnboardingFeedback(
  userId: string,
): Promise<OnboardingFeedback[]> {
  const feedback = await apiClient.fetch<OnboardingFeedback[]>(
    `/api/v1/admin/onboarding/users/${userId}/feedback`,
  );

  return feedback.map((item) => ({
    ...item,
    message: item.message ?? item.comment ?? "",
  }));
}

export async function getAllOnboardingFeedback(): Promise<
  OnboardingFeedback[]
> {
  const feedback = await apiClient.fetch<OnboardingFeedback[]>(
    "/api/v1/admin/onboarding/feedback",
  );

  return feedback.map((item) => ({
    ...item,
    message: item.message ?? item.comment ?? "",
  }));
}

export async function markOnboardingFeedbackRead(
  feedbackId: string,
): Promise<void> {
  await apiClient.fetch(
    `/api/v1/admin/onboarding/feedback/${feedbackId}/read`,
    {
      method: "POST",
    },
  );
}

type SkillResponseDto = {
  id: string;
  name: string;
  status?: SkillStatus;
  roleId?: string;
  roleIds?: string[];
  projectRole?: {
    id: string;
  };
};

function toSkill(skill: SkillResponseDto): Skill {
  const legacyRoleIds = skill.projectRole?.id
    ? [skill.projectRole.id]
    : skill.roleId
      ? [skill.roleId]
      : [];

  return {
    id: skill.id,
    name: skill.name,
    roleIds: skill.roleIds ?? legacyRoleIds,
    status: skill.status ?? "ACTIVE",
  };
}

export async function getSkills(): Promise<Skill[]> {
  const response =
    await apiClient.fetch<SkillResponseDto[]>("/api/v1/skills");

  return response.map(toSkill);
}

export async function getSkillById(skillId: string): Promise<Skill> {
  const response = await apiClient.fetch<SkillResponseDto>(
    `/api/v1/skills/${skillId}`,
  );

  return toSkill(response);
}

export async function updateSkill(
  skillId: string,
  data: { name?: string; roleIds?: string[] },
): Promise<Skill> {
  const response = await apiClient.fetch<SkillResponseDto>(
    `/api/v1/admin/skills/${skillId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );

  return toSkill(response);
}

export async function getSkillsByRoleId(roleId: string): Promise<Skill[]> {
  const response = await apiClient.fetch<SkillResponseDto[]>(
    `/api/v1/projectRoles/${roleId}/skills`,
  );

  return response.map(toSkill);
}

export async function updateRoleSkills(
  roleId: string,
  skillIds: string[],
): Promise<Skill[]> {
  const response = await apiClient.fetch<SkillResponseDto[]>(
    `/api/v1/projectRoles/${roleId}/skills`,
    {
      method: "PUT",
      body: JSON.stringify({ skillIds }),
    },
  );

  return response.map(toSkill);
}

/**
 * Re-adds a previously deleted skill.
 *
 * `_skillId` is unused: the server has no reactivate endpoint, so this re-creates the skill by
 * name. Only the removed mock branch ever read the id. Kept in the signature because callers pass
 * it and a server-side reactivate would need it.
 */
export async function reactivateSkill(
  _skillId: string,
  name: string,
  roleIds: string[],
): Promise<Skill> {
  const response = await apiClient.fetch<SkillResponseDto>(
    "/api/v1/admin/skills",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        roleIds,
      }),
    },
  );

  return toSkill(response);
}

export async function createSkill(
  name: string,
  roleIds: string[],
): Promise<Skill> {
  const response = await apiClient.fetch<SkillResponseDto>(
    "/api/v1/admin/skills",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        roleIds,
      }),
    },
  );

  return toSkill(response);
}

export async function deleteProjectRole(roleId: string): Promise<void> {
  await apiClient.fetch(`/api/v1/projectRoles/${roleId}`, {
    method: "DELETE",
  });

  return;
}

export async function deleteSkill(skillId: string): Promise<void> {
  await apiClient.fetch(`/api/v1/admin/skills/${skillId}`, {
    method: "DELETE",
  });

  return;
}
