import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessRoute,
  getDefaultRoute,
  getMatchingProtectedRoute,
} from "../auth/accessPolicy";
import { useAuth } from "../context/useAuth";
import { WorkingArea } from "../services/types.ts";

import {
  getSkillAssessmentPromptState,
  getMyTeamOverview,
  hasCompletedSkillAssessment,
  getSkills,
} from "../services/teamManagementService";

interface AuthGuardProps {
  children: ReactNode;
}

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { status, profile } = useAuth();

  const location = useLocation();

  const [needsSkillAssessment, setNeedsSkillAssessment] = useState(false);

  const [checkingSkillAssessment, setCheckingSkillAssessment] = useState(false);

  useEffect(() => {
    async function checkSkillAssessment() {
      if (status !== "authenticated" || !profile?.id) {
        setNeedsSkillAssessment(false);
        setCheckingSkillAssessment(false);
        return;
      }

      setCheckingSkillAssessment(true);

      const teamMember = await getMyTeamOverview();
      const completed = await hasCompletedSkillAssessment(teamMember.userId);
      const promptState = getSkillAssessmentPromptState(teamMember.userId);
      const allSkills = await getSkills();

      const hasSkillsForRoles =
        !!teamMember &&
        teamMember.roles.some((role) =>
          allSkills.some((skill) => skill.roleId === role.id),
        );

      setNeedsSkillAssessment(
        !!teamMember && hasSkillsForRoles && !completed && promptState === null,
      );

      setCheckingSkillAssessment(false);
    }

    void checkSkillAssessment();
  }, [status, profile?.id, location.pathname]);

  if (status === "loading" || checkingSkillAssessment) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-app-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
      </div>
    );
  } // 1. If not logged in, force to /login

  if (status === "unauthenticated" && location.pathname !== "/login") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } // 2. Prevent authenticated users from going back to login

  if (status === "authenticated" && location.pathname === "/login") {
    const state = location.state as LocationState;
    const fromPath = state?.from?.pathname;
    const fromRoute = fromPath ? getMatchingProtectedRoute(fromPath) : null;
    const from =
      fromPath && fromRoute && canAccessRoute(profile, fromRoute)
        ? fromPath
        : getDefaultRoute(profile);

    return <Navigate to={from} replace />;
  }

  // 3. No working area yet -> wizard (but don't redirect if already there)
  if (
    status === "authenticated" &&
    profile?.workingArea === WorkingArea.NO_WORKING_AREA &&
    !canAccessRoute(profile, "/admin") &&
    location.pathname !== "/selection-wizard"
  ) {
    return <Navigate to="/selection-wizard" replace />;
  } // 4. Has assigned project role but no skill assessment yet → skill wizard

  if (
    status === "authenticated" &&
    profile?.id &&
    !checkingSkillAssessment &&
    needsSkillAssessment &&
    location.pathname !== "/skill-wizard"
  ) {
    return <Navigate to="/skill-wizard" replace />;
  }

  if (
    status === "authenticated" &&
    (profile?.workingArea !== WorkingArea.NO_WORKING_AREA ||
      canAccessRoute(profile, "/admin")) &&
    location.pathname === "/selection-wizard"
  ) {
    return <Navigate to={getDefaultRoute(profile)} replace />;
  }

  if (status === "authenticated") {
    const protectedRoute = getMatchingProtectedRoute(location.pathname);

    if (protectedRoute && !canAccessRoute(profile, protectedRoute)) {
      return <Navigate to={getDefaultRoute(profile)} replace />;
    }
  }

  return <>{children}</>;
}
