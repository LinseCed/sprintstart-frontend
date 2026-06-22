import type {
    TeamOverviewFilters,
    TeamOverviewUser,
} from '../types';

type TeamMemberFiltersProps = {
    users: TeamOverviewUser[];
    filters: TeamOverviewFilters;
    onFiltersChange: (filters: TeamOverviewFilters) => void;
};

export function TeamMemberFilters({
    users,
    filters,
    onFiltersChange,
}: TeamMemberFiltersProps) {
    const roles = Array.from(
        new Map(
            users
                .flatMap((user) => user.roles)
                .map((role) => [role.id, role])
        ).values()
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            <select
                value={filters.roleId}
                onChange={(event) =>
                    onFiltersChange({
                        ...filters,
                        roleId: event.target.value,
                    })
                }
                className="h-9 rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none hover:border-app-border-strong"
            >
                <option value="all">All roles</option>

                {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                        {role.name}
                    </option>
                ))}
            </select>

            <select
                value={filters.sortBy}
                onChange={(event) =>
                    onFiltersChange({
                        ...filters,
                        sortBy:
                            event.target.value as TeamOverviewFilters['sortBy'],
                    })
                }
                className="h-9 rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none hover:border-app-border-strong"
            >
                <option value="LONGEST_STEP">Longest on step</option>
                <option value="SHORTEST_STEP">Shortest on step</option>
                <option value="HIGHEST_PROGRESS">Highest progress</option>
                <option value="LOWEST_PROGRESS">Lowest progress</option>
            </select>
        </div>
    );
}