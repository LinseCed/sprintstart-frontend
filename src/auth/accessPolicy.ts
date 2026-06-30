import { PermissionGroup, type UserProfile } from '../services/types';

export type AppRoute =
    | '/'
    | '/chat'
    | '/knowledge-base'
    | '/onboarding'
    | '/skill-wizard'
    | '/data-ingestion'
    | '/pm-dashboard'
    | '/team-management'
    | '/admin';

const routePermissions: Record<AppRoute, readonly PermissionGroup[]> = {
    '/': [PermissionGroup.USER, PermissionGroup.PM, PermissionGroup.HR, PermissionGroup.ADMIN],
    '/chat': [PermissionGroup.USER, PermissionGroup.PM, PermissionGroup.HR, PermissionGroup.ADMIN],
    '/knowledge-base': [
        PermissionGroup.USER,
        PermissionGroup.PM,
        PermissionGroup.HR,
        PermissionGroup.ADMIN,
    ],
    '/onboarding': [
        PermissionGroup.USER,
        PermissionGroup.PM,
        PermissionGroup.HR,
        PermissionGroup.ADMIN,
    ],
    '/skill-wizard': [
        PermissionGroup.USER,
        PermissionGroup.PM,
        PermissionGroup.HR,
        PermissionGroup.ADMIN,
    ],
    '/data-ingestion': [PermissionGroup.PM, PermissionGroup.HR, PermissionGroup.ADMIN],
    '/pm-dashboard': [PermissionGroup.PM, PermissionGroup.HR, PermissionGroup.ADMIN],
    '/team-management': [PermissionGroup.PM, PermissionGroup.HR, PermissionGroup.ADMIN],
    '/admin': [PermissionGroup.HR, PermissionGroup.ADMIN],
};

const routePrefixes: Partial<Record<AppRoute, readonly string[]>> = {
    '/chat': ['/chat/'],
    '/onboarding': ['/onboarding/'],
};

export function canAccessRoute(profile: UserProfile | null, route: AppRoute): boolean {
    if (!profile) {
        return false;
    }

    return routePermissions[route].includes(profile.permissionGroup);
}

export function getDefaultRoute(profile: UserProfile | null): AppRoute {
    if (!profile) {
        return '/';
    }

    if (canAccessRoute(profile, '/')) {
        return '/';
    }

    if (canAccessRoute(profile, '/admin')) {
        return '/admin';
    }

    if (canAccessRoute(profile, '/data-ingestion')) {
        return '/data-ingestion';
    }

    return '/';
}

export function getMatchingProtectedRoute(pathname: string): AppRoute | null {
    const routes = Object.keys(routePermissions) as AppRoute[];

    const exactMatch = routes.find((route) => route === pathname);

    if (exactMatch) {
        return exactMatch;
    }

    return (
        routes.find((route) =>
            routePrefixes[route]?.some((prefix) => pathname.startsWith(prefix)),
        ) ?? null
    );
}
