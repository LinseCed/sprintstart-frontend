import type { ReactNode } from "react";
import { SidePanel } from "../ui/SidePanel";

type DetailsSideDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leading: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  closeAriaLabel?: string;
};

export function DetailsSideDrawer({
  isOpen,
  onClose,
  title,
  leading,
  badge,
  actions,
  children,
  footer,
  widthClassName = "w-[min(94vw,34rem)] lg:w-[min(72vw,58rem)]",
  contentClassName = "mx-5 px-4 pb-10 pt-5 lg:px-5 lg:pt-6",
  headerClassName = "mx-5 px-4 pb-0 pt-5 lg:px-5 lg:pt-6",
  closeAriaLabel = "Close details",
}: DetailsSideDrawerProps) {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      leading={leading}
      badge={badge}
      actions={actions}
      footer={footer}
      widthClassName={widthClassName}
      zIndexClassName="z-40"
      showOverlay={false}
      contentClassName={contentClassName}
      headerClassName={headerClassName}
      closeAriaLabel={closeAriaLabel}
    >
      {children}
    </SidePanel>
  );
}
