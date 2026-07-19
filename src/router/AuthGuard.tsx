import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { assessmentService } from "../services/assessmentService";

interface AuthGuardProps {
    children: ReactNode;
}

interface LocationState {
    from?: {
        pathname: string;
    };
}

/**
 * Route guard for authentication and the skill-assessment intake gate.
 *
 * Unauthenticated visitors are sent to the login page. Authenticated `USER`s
 * who have never completed the adaptive skill assessment are sent to
 * `/onboarding/assessment` until a completed session exists on the backend
 * (`GET /me/assessment/status`) -- the store the assessment chat actually
 * writes, replacing the retired skill-wizard heuristics. While the gate is
 * open, the status is re-checked on navigation so finishing the chat
 * releases the gate without a reload; once completed, no further checks are
 * made for the session. A failed status check fails open rather than
 * trapping the user in the assessment page.
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const { status, profile } = useAuth();
    const location = useLocation();

    const [needsSkillAssessment, setNeedsSkillAssessment] = useState(false);
    const [checkingSkillAssessment, setCheckingSkillAssessment] = useState(false);
    const completedRef = useRef(false);

    const profileId = profile?.id;
    const permissionGroup = profile?.permissionGroup;

    useEffect(() => {
        let cancelled = false;

        const checkSkillAssessment = async () => {
            if (status !== "authenticated" || !profileId) {
                completedRef.current = false;
                setNeedsSkillAssessment(false);
                setCheckingSkillAssessment(false);
                return;
            }

            if (permissionGroup !== "USER" || completedRef.current) {
                setNeedsSkillAssessment(false);
                setCheckingSkillAssessment(false);
                return;
            }

            setCheckingSkillAssessment(true);
            try {
                const { completed } = await assessmentService.fetchAssessmentStatus();
                if (cancelled) return;
                completedRef.current = completed;
                setNeedsSkillAssessment(!completed);
            } catch {
                if (cancelled) return;
                setNeedsSkillAssessment(false);
            } finally {
                if (!cancelled) setCheckingSkillAssessment(false);
            }
        };

        void checkSkillAssessment();

        return () => {
            cancelled = true;
        };
    }, [status, profileId, permissionGroup, location.pathname]);

    if (status === "loading" || checkingSkillAssessment) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-app-bg">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
            </div>
        );
    }

    if (status === "unauthenticated" && location.pathname !== "/login") {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (status === "authenticated" && location.pathname === "/login") {
        const state = location.state as LocationState;
        const from = state?.from?.pathname || "/";

        return <Navigate to={from} replace />;
    }

    if (
        status === "authenticated" &&
        needsSkillAssessment &&
        location.pathname !== "/onboarding/assessment"
    ) {
        return <Navigate to="/onboarding/assessment" replace />;
    }

    return <>{children}</>;
}
