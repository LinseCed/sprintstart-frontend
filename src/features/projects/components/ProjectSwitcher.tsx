import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronsUpDown, FolderKanban } from "lucide-react";
import { useProjectContext } from "../useProjectContext";
import { ProjectSwitcherPopover } from "./ProjectSwitcherPopover";

type ProjectSwitcherProps = {
  className?: string;
};

/**
 * Global project switcher shown in the sidebar footer.
 *
 * Renders nothing for permission groups that do not get a switcher, so the
 * sidebar layout is unaffected for those users. Opens with a click or with
 * Cmd/Ctrl+K, and returns focus to the trigger on close so keyboard users are
 * never stranded.
 */
export function ProjectSwitcher({ className = "" }: ProjectSwitcherProps) {
  const {
    projects,
    selectedProject,
    selectedProjectId,
    isLoading,
    errorMessage,
    isSwitcherEnabled,
    setSelectedProjectId,
  } = useProjectContext();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Cmd/Ctrl+K opens the switcher from anywhere.
  useEffect(() => {
    if (!isSwitcherEnabled) return;

    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isSwitcherEnabled]);

  // Close when interacting outside the switcher.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!isSwitcherEnabled) {
    return null;
  }

  const handleSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    close();
  };

  const triggerLabel = selectedProject?.name ?? "Select a project";
  const triggerHint = !selectedProject
    ? "No project selected"
    : selectedProject.isManaged
      ? "Managed by you"
      : "Member";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={`Switch project. Current project: ${triggerLabel}`}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-[48px] w-full items-center gap-[10px] rounded-[8px] border border-app-border bg-app-bg px-[10px] text-left transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-brand-soft">
          <FolderKanban className="h-4 w-4 text-app-brand" />
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-app-text">
            {triggerLabel}
          </span>

          <span className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
            {triggerHint}
          </span>
        </span>

        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-app-text-muted" />
      </button>

      {isOpen ? (
        <ProjectSwitcherPopover
          projects={projects}
          selectedProjectId={selectedProjectId}
          isLoading={isLoading}
          errorMessage={errorMessage}
          listboxId={listboxId}
          onSelect={handleSelect}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
