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
        new Map(users.map((user) => [user.role.id, user.role])).values()
    );

    return (
        <div className="flex items-center gap-2">
            
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
        </div>
    );
}