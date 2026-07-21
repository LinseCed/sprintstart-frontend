import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { PermissionGroup } from "../services/types";

interface AuthGuardProps {
    children: ReactNode;
}

interface LocationState {
    from?: {
        pathname: string;
    };
}

/**
 * Route guard for authentication, plus a hire's day-one landing.
 *
 * Unauthenticated visitors are sent to the login page and authenticated visitors
 * are bounced off it. A `USER` (a new hire) landing on the root is sent to their
 * onboarding home, `/first-week` — the single spine — rather than the generic
 * dashboard. This is a **role-based** redirect, not the retired assessment gate:
 * it makes no network call and reads nothing but the permission group, so it
 * cannot recreate the redirect-loop / retired-endpoint bugs that gate produced
 * (frontend#19/#29). It fires **only from `/`**, so a hire navigates freely
 * everywhere else and is never trapped. PM/HR/ADMIN keep the dashboard as home.
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const { status, profile } = useAuth();
    const location = useLocation();

    if (status === "loading") {
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

    // A hire's home is their onboarding, not the generic hub — but only as a
    // landing default, never a trap.
    if (
        status === "authenticated" &&
        profile?.permissionGroup === PermissionGroup.USER &&
        location.pathname === "/"
    ) {
        return <Navigate to="/first-week" replace />;
    }

    return <>{children}</>;
}
