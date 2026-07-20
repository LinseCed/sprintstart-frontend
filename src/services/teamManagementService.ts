import { apiClient } from "./apiClient";
import teamOverviewMock from "../mocks/teamOverviewMock.json";
import skillsMock from "../mocks/skillsMock.json";
import type {
  ProjectRole,
  Skill,
  TeamOverviewUser,
  SkillStatus,
} from "../features/team-management/types";

let mockUsers = teamOverviewMock.users as TeamOverviewUser[];

let mockProjectRoles: ProjectRole[] = Array.from(
  new Map(
    mockUsers.flatMap((user) => user.roles).map((role) => [role.id, role]),
  ).values(),
);

type LegacySkill = {
  id: string;
  name: string;
  roleId?: string;
  roleIds?: string[];
  status?: SkillStatus;
};

function normalizeSkill(skill: LegacySkill): Skill {
  const roleIds = skill.roleIds ?? (skill.roleId ? [skill.roleId] : []);

  return {
    id: skill.id,
    name: skill.name,
    roleIds,
    status: skill.status ?? "ACTIVE",
  };
}

let mockSkills = (skillsMock.skills as LegacySkill[]).map(normalizeSkill);

export async function getTeamOverview(
  roleId?: string,
  sortBy?: string,
  projectIds?: string[],
): Promise<TeamOverviewUser[]> {
  try {
    const params = new URLSearchParams();
    if (roleId && roleId !== "all") params.append("roleIds", roleId);
    projectIds?.forEach((projectId) => params.append("projectIds", projectId));
    if (sortBy) params.append("sortBy", sortBy);
    params.append("size", "100");

    const query = params.toString();
    const url = `/api/v1/onboarding/team-overview${query ? `?${query}` : ""}`;

    const response = await apiClient.fetch<{ content: TeamOverviewUser[] }>(
      url,
    );

    const users = response.content.map((user) => ({
      ...user,
      roles: user.roles.map((role: ProjectRole & { roleId?: string }) => ({
        ...role,
        id: role.id || role.roleId || "",
      })),
    }));

    try {
      const feedback = await getAllOnboardingFeedback();
      const usersWithUnreadFeedback = new Set(
        feedback
          .filter((item) => item.read !== true && !item.readAt)
          .map((item) => item.userId)
          .filter((userId): userId is string => Boolean(userId)),
      );

      return users.map((user) => ({
        ...user,
        hasFeedback: usersWithUnreadFeedback.has(user.userId),
      }));
    } catch {
      return users;
    }
  } catch {
    return mockUsers;
  }
}

export async function getTeamMember(
  userId: string,
): Promise<TeamOverviewUser | undefined> {
  const users = await getTeamOverview();

  return users.find((user) => user.userId === userId);
}

export async function getMyTeamOverview(): Promise<TeamOverviewUser> {
  try {
    const user = await apiClient.fetch<TeamOverviewUser>(
      "/api/v1/onboarding/me/team-overview",
    );
    return {
      ...user,
      roles: user.roles.map((role: ProjectRole & { roleId?: string }) => ({
        ...role,
        id: role.id || role.roleId || "",
      })),
    };
  } catch {
    // Fallback to finding the first user in mock for development
    return mockUsers[0];
  }
}

export async function getProjectRoles(): Promise<ProjectRole[]> {
  try {
    const response = await apiClient.fetch<
      { projectRoles?: ProjectRole[] } | ProjectRole[]
    >("/api/v1/projectRoles");

    return Array.isArray(response) ? response : (response.projectRoles ?? []);
  } catch {
    return mockProjectRoles;
  }
}

export async function createProjectRole(
  name: string,
  description: string,
): Promise<ProjectRole> {
  try {
    return await apiClient.fetch<ProjectRole>("/api/v1/projectRoles", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
      }),
    });
  } catch {
    const newRole: ProjectRole = {
      id: `mock-role-${Date.now()}`,
      name,
      description,
    };

    mockProjectRoles = [...mockProjectRoles, newRole];

    return newRole;
  }
}

export async function assignProjectRoleToUser(
  userId: string,
  roleId: string,
): Promise<void> {
  try {
    await apiClient.fetch(`/api/v1/users/${userId}/project-roles`, {
      method: "POST",
      body: JSON.stringify({
        roleId: roleId,
      }),
    });

    return;
  } catch {
    const role = mockProjectRoles.find(
      (projectRole) => projectRole.id === roleId,
    );

    if (!role) return;

    mockUsers = mockUsers.map((user) => {
      if (user.userId !== userId) return user;

      const alreadyAssigned = user.roles.some(
        (userRole) => userRole.id === roleId,
      );

      if (alreadyAssigned) return user;

      return {
        ...user,
        roles: [...user.roles, role],
      };
    });
  }
}

export async function unassignProjectRoleFromUser(
  userId: string,
  roleId: string,
): Promise<void> {
  try {
    await apiClient.fetch(`/api/v1/users/${userId}/project-roles/${roleId}`, {
      method: "DELETE",
    });

    return;
  } catch {
    mockUsers = mockUsers.map((user) => {
      if (user.userId !== userId) return user;

      return {
        ...user,
        roles: user.roles.filter((role) => role.id !== roleId),
      };
    });
  }
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
  try {
    const response =
      await apiClient.fetch<SkillResponseDto[]>("/api/v1/skills");

    return response.map(toSkill);
  } catch {
    return mockSkills;
  }
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

export async function reactivateSkill(
  skillId: string,
  name: string,
  roleIds: string[],
): Promise<Skill> {
  try {
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
  } catch {
    mockSkills = mockSkills.map((s) =>
      s.id === skillId ? { ...s, status: "ACTIVE" as const } : s,
    );

    return (
      mockSkills.find((s) => s.id === skillId) ?? {
        id: skillId,
        name,
        roleIds,
        status: "ACTIVE",
      }
    );
  }
}

export async function createSkill(
  name: string,
  roleIds: string[],
): Promise<Skill> {
  try {
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
  } catch {
    const existing = mockSkills.find(
      (s) =>
        s.name.toLowerCase() === name.toLowerCase() && s.status === "RETIRED",
    );

    if (existing) {
      const reactivated: Skill = { ...existing, roleIds, status: "ACTIVE" };

      mockSkills = mockSkills.map((s) =>
        s.id === existing.id ? reactivated : s,
      );

      return reactivated;
    }

    const newSkill: Skill = {
      id: `mock-skill-${Date.now()}`,
      name,
      roleIds,
      status: "ACTIVE",
    };

    mockSkills = [...mockSkills, newSkill];

    return newSkill;
  }
}

export async function deleteProjectRole(roleId: string): Promise<void> {
  try {
    await apiClient.fetch(`/api/v1/projectRoles/${roleId}`, {
      method: "DELETE",
    });

    return;
  } catch {
    mockProjectRoles = mockProjectRoles.filter((role) => role.id !== roleId);

    mockSkills = mockSkills.map((skill) => ({
      ...skill,
      roleIds: skill.roleIds.filter((linkedRoleId) => linkedRoleId !== roleId),
    }));

    mockUsers = mockUsers.map((user) => ({
      ...user,
      roles: user.roles.filter((role) => role.id !== roleId),
    }));
  }
}

export async function deleteSkill(skillId: string): Promise<void> {
  try {
    await apiClient.fetch(`/api/v1/admin/skills/${skillId}`, {
      method: "DELETE",
    });

    return;
  } catch {
    mockSkills = mockSkills.map((skill) =>
      skill.id === skillId ? { ...skill, status: "RETIRED" } : skill,
    );
  }
}
