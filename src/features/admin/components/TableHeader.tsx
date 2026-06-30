type TableHeaderProps = {
    children: string;
};

export function TableHeader({ children }: TableHeaderProps) {
    return (
        <div className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
            {children}
        </div>
    );
}
