import { apiClient } from "./apiClient";
import teamOverviewMock from "../mocks/teamOverviewMock.json";
import skillsMock from "../mocks/skillsMock.json";
import type {
  ProjectRole,
  Skill,
  TeamOverviewUser,
  SkillLevel,
} from "../features/team-management/types";
import type {
  OnboardingPhaseEndpoint,
  OnboardingPathEndpoint,
  OnboardingStepEndpoint,
  OnboardingTaskEndpoint,
  StepType,
} from "../features/onboarding/types";

let mockUsers = teamOverviewMock.users as TeamOverviewUser[];

let mockProjectRoles: ProjectRole[] = Array.from(
  new Map(
    mockUsers.flatMap((user) => user.roles).map((role) => [role.id, role]),
  ).values(),
);

let mockSkills = skillsMock.skills as Skill[];

export async function getTeamOverview(
  roleId?: string,
  sortBy?: string,
): Promise<TeamOverviewUser[]> {
  try {
    const params = new URLSearchParams();
    if (roleId && roleId !== "all") params.append("roleIds", roleId);
    if (sortBy) params.append("sortBy", sortBy);
    params.append("size", "100");

    const query = params.toString();
    const url = `/api/v1/onboarding/team-overview${query ? `?${query}` : ""}`;

        const response = await apiClient.fetch<{ content: TeamOverviewUser[] }>(
            url,
        );

        return response.content.map((user) => ({
            ...user,
            roles: user.roles.map(
                (role: ProjectRole & { roleId?: string }) => ({
                    ...role,
                    id: role.id || role.roleId || '',
                }),
            ),
        }));
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
    const user = await apiClient.fetch<TeamOverviewUser>("/api/v1/onboarding/me/team-overview");
    return {
      ...user,
      roles: user.roles.map(
    (role: ProjectRole & { roleId?: string }) => ({
        ...role,
        id: role.id || role.roleId || '',
    }),
),
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

export async function acceptOnboardingSkipRequest(
  skipId: string,
  reviewComment = "",
): Promise<void> {
  await apiClient.fetch(`/api/v1/admin/onboarding/skips/${skipId}/accept`, {
    method: "POST",
    body: JSON.stringify({
      reviewComment,
    }),
  });
}

export async function denyOnboardingSkipRequest(
  skipId: string,
  reviewComment = "",
): Promise<void> {
  await apiClient.fetch(`/api/v1/admin/onboarding/skips/${skipId}/deny`, {
    method: "POST",
    body: JSON.stringify({
      reviewComment,
    }),
  });
}

export type OnboardingFeedback = {
  id: string;
  userId?: string;
  stepId?: string | null;
  stepTitle?: string | null;
  message: string;
  createdAt?: string;
  read?: boolean;
  readAt?: string | null;
};

export async function getUserOnboardingFeedback(
  userId: string,
): Promise<OnboardingFeedback[]> {
  try {
    return await apiClient.fetch<OnboardingFeedback[]>(
      `/api/v1/admin/onboarding/users/${userId}/feedback`,
    );
  } catch {
    return [];
  }
}

export async function markOnboardingFeedbackRead(
  feedbackId: string,
): Promise<void> {
  await apiClient.fetch(`/api/v1/admin/onboarding/feedback/${feedbackId}/read`, {
    method: "POST",
  });
}

export async function getUserOnboardingPath(
  userId: string,
): Promise<OnboardingPathEndpoint | null> {
  try {
    const path = await apiClient.fetch<OnboardingPathEndpoint>(
      `/api/v1/onboarding/users/${userId}/path`,
    );

    const phases =
      path.phases?.length > 0
        ? path.phases
        : await apiClient.fetch<OnboardingPhaseEndpoint[]>(
            `/api/v1/onboarding/users/${userId}/path/phases`,
          );

    const hydratedPhases = await Promise.all(
      phases.map(async (phase) => {
        if (phase.steps?.length > 0) return phase;

        try {
          const steps = await apiClient.fetch<OnboardingStepEndpoint[]>(
            `/api/v1/onboarding/phases/${phase.id}/steps`,
          );

          return {
            ...phase,
            steps,
          };
        } catch {
          return {
            ...phase,
            steps: [],
          };
        }
      }),
    );

    return {
      ...path,
      phases: hydratedPhases,
    };
  } catch {
    return null;
  }
}

export type CreateOnboardingStepRequest = {
  position: number;
  title: string;
  description: string;
  type: StepType;
  estimatedMinutes: number;
  expectedOutcome?: string;
};

export async function createOnboardingStepForPhase(
  phaseId: string,
  request: CreateOnboardingStepRequest,
): Promise<void> {
  await apiClient.fetch(`/api/v1/onboarding/phases/${phaseId}/steps`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function deleteOnboardingStep(stepId: string): Promise<void> {
  await apiClient.fetch(`/api/v1/onboarding/steps/${stepId}`, {
    method: "DELETE",
  });
}

export async function getOnboardingTasksByStep(
  stepId: string,
): Promise<OnboardingTaskEndpoint[]> {
  try {
    return await apiClient.fetch<OnboardingTaskEndpoint[]>(
      `/api/v1/onboarding/steps/${stepId}/tasks`,
    );
  } catch {
    return [];
  }
}

export async function deleteOnboardingTask(taskId: string): Promise<void> {
  await apiClient.fetch(`/api/v1/onboarding/tasks/${taskId}`, {
    method: "DELETE",
  });
}

type SkillResponseDto = {
    id: string;
    name: string;
    roleId?: string;
    projectRole?: {
        id: string;
    };
};

export async function getSkills(): Promise<Skill[]> {
    try {
        const response = await apiClient.fetch<SkillResponseDto[]>('/api/v1/skills');

        return response.map(skill => ({
            id: skill.id,
            name: skill.name,
            roleId: skill.projectRole?.id || skill.roleId || '',
        }));
    } catch {
        return mockSkills;
    }
}

export async function createSkill(
    name: string,
    roleId: string
): Promise<Skill> {
    try {
        const response = await apiClient.fetch<SkillResponseDto>('/api/v1/skills', {
            method: 'POST',
            body: JSON.stringify({
                name,
                roleId,
            }),
        });

        return {
            id: response.id,
            name: response.name,
            roleId: response.projectRole?.id || response.roleId || '',
        };
    } catch {
        const newSkill: Skill = {
            id: `mock-skill-${Date.now()}`,
            name,
            roleId,
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

    mockSkills = mockSkills.filter((skill) => skill.roleId !== roleId);

    mockUsers = mockUsers.map((user) => ({
      ...user,
      roles: user.roles.filter((role) => role.id !== roleId),
    }));
  }
}

export async function deleteSkill(skillId: string): Promise<void> {
  try {
    await apiClient.fetch(`/api/v1/skills/${skillId}`, {
      method: "DELETE",
    });

    return;
  } catch {
    mockSkills = mockSkills.filter((skill) => skill.id !== skillId);
  }
}

// Removed mock role functions

export type CreateSkillAssessmentRequest = {
    userId: string;
    skillId: string;
    level: SkillLevel;
};

let mockSkillAssessments: CreateSkillAssessmentRequest[] = [];

const skillAssessmentPromptStatePrefix = 'skill-assessment-prompt-state';

export type SkillAssessmentPromptState = 'dismissed' | 'completed';

function getSkillAssessmentPromptStateKey(userId: string) {
    return `${skillAssessmentPromptStatePrefix}:${userId}`;
}

export function getSkillAssessmentPromptState(
    userId: string,
): SkillAssessmentPromptState | null {
    if (typeof window === 'undefined') return null;

    const value = window.localStorage.getItem(
        getSkillAssessmentPromptStateKey(userId),
    );

    return value === 'dismissed' || value === 'completed' ? value : null;
}

export function markSkillAssessmentPromptDismissed(userId: string): void {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
        getSkillAssessmentPromptStateKey(userId),
        'dismissed',
    );
}

export function markSkillAssessmentPromptCompleted(userId: string): void {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
        getSkillAssessmentPromptStateKey(userId),
        'completed',
    );
}

export async function hasCompletedSkillAssessment(
    userId: string,
): Promise<boolean> {
    try {
        const response = await apiClient.fetch<{ userId: string; skillId: string; level: SkillLevel }[]>(
            `/api/v1/users/${userId}/skill-assessments/completed`,
        );

        return response.length > 0;
    } catch {
        return mockSkillAssessments.some(
            (assessment) => assessment.userId === userId,
        );
    }
}

export async function saveUserSkillAssessments(
    assessments: CreateSkillAssessmentRequest[],
): Promise<void> {
    try {
        for (const assessment of assessments) {
            await apiClient.fetch('/api/v1/skill-assessments', {
                method: 'POST',
                body: JSON.stringify({
                    skillId: assessment.skillId,
                    level: assessment.level,
                }),
            });
        }
    } catch {
        mockSkillAssessments = mockSkillAssessments.filter(
            (assessment) =>
                !assessments.some(
                    (incoming) =>
                        incoming.userId === assessment.userId &&
                        incoming.skillId === assessment.skillId,
                ),
        );

        mockSkillAssessments = [...mockSkillAssessments, ...assessments];
    }
}

export type UserSkillLevel = {
    id: string;
    skillId: string;
    skillName: string;
    roleName: string;
    level: SkillLevel;
};

export async function getUserSkillLevels(
    userId: string,
): Promise<UserSkillLevel[]> {
    try {
        const [assessments, skills, roles] = await Promise.all([
            apiClient.fetch<{ userId: string; skillId: string; level: SkillLevel }[]>(
                `/api/v1/users/${userId}/skill-assessments/completed`,
            ),
            getSkills(),
            getProjectRoles(),
        ]);

        return assessments.map((assessment) => {
            const skill = skills.find((s) => s.id === assessment.skillId);
            const role = roles.find((r) => r.id === skill?.roleId);

            return {
                id: `${userId}-${assessment.skillId}`,
                skillId: assessment.skillId,
                skillName: skill?.name ?? 'Unknown skill',
                roleName: role?.name ?? 'Unknown role',
                level: assessment.level,
            };
        });
    } catch {
        return [];
    }
}
