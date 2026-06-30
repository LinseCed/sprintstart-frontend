import { Layers, Users } from "lucide-react";
import type { AdminTab } from "../types";

type TabSwitcherProps = {
    activeTab: AdminTab;
    onChange: (tab: AdminTab) => void;
};

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
    return (
        <div className="flex gap-1 rounded-2xl border border-app-border bg-app-surface-muted p-1">
            <button
                type="button"
                onClick={() => onChange("users")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "users"
                        ? "bg-app-surface text-app-text shadow-sm"
                        : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                }`}
            >
                <Users className="h-4 w-4" />
                Users
            </button>

            <button
                type="button"
                onClick={() => onChange("projects")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "projects"
                        ? "bg-app-surface text-app-text shadow-sm"
                        : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                }`}
            >
                <Layers className="h-4 w-4" />
                Projects
            </button>
        </div>
    );
}
