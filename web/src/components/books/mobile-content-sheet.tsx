"use client";

import { BookOpen, Download, FileText, LayoutGrid, Menu, X } from "lucide-react";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileContentSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type TabType = "toc" | "details" | "actions";

interface MobileContentSheetContentProps {
  tocContent: ReactNode;
  detailsContent: ReactNode;
  actionsContent: ReactNode;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export function MobileContentSheet({
  children,
  isOpen,
  onClose,
  className,
}: MobileContentSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-border/60 bg-background/97 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-12 rounded-full bg-muted" />
        </div>

        {/* Content */}
        <div className="max-h-[70dvh] overflow-y-auto pb-safe">
          {children}
        </div>
      </div>
    </>
  );
}

export function MobileContentSheetContent({
  tocContent,
  detailsContent,
  actionsContent,
  activeTab = "toc",
  onTabChange,
}: MobileContentSheetContentProps) {
  const tabs = [
    { id: "toc" as TabType, label: "Contents", icon: LayoutGrid },
    { id: "details" as TabType, label: "Details", icon: FileText },
    { id: "actions" as TabType, label: "Actions", icon: BookOpen },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  aria-current={isActive ? "true" : undefined}
                >
                  <TabIcon className="size-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "toc" && tocContent}
        {activeTab === "details" && detailsContent}
        {activeTab === "actions" && actionsContent}
      </div>
    </div>
  );
}

// Mobile Navigation Button
export function MobileNavButton({
  onClick,
  isOpen,
  unreadCount = 0,
}: {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative shrink-0"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? (
        <X className="size-5" />
      ) : (
        <>
          <Menu className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </>
      )}
    </Button>
  );
}

// Mobile Bottom Action Bar
export function MobileBottomActionBar({
  ctaText,
  ctaSubtext,
  onCtaClick,
  secondaryActions,
}: {
  ctaText: string;
  ctaSubtext?: string;
  onCtaClick: () => void;
  secondaryActions?: Array<{ label: string; icon: React.ElementType; onClick: () => void }>;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/97 px-4 pb-safe pt-3 pb-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{ctaText}</p>
          {ctaSubtext && (
            <p className="text-xs text-muted-foreground">{ctaSubtext}</p>
          )}
        </div>

        {secondaryActions && secondaryActions.length > 0 && (
          <div className="flex gap-2">
            {secondaryActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="icon"
                  onClick={action.onClick}
                  className="shrink-0"
                  aria-label={action.label}
                >
                  <ActionIcon className="size-4" />
                </Button>
              );
            })}
          </div>
        )}

        <Button
          size="default"
          className="shrink-0 font-bold shadow-md"
          onClick={onCtaClick}
        >
          <Download className="mr-1.5 size-3.5" aria-hidden="true" />
          {ctaText}
        </Button>
      </div>
    </div>
  );
}

// Mobile TOC Item
export function MobileTOCItem({
  number,
  title,
  isActive,
  isLocked,
  onClick,
}: {
  number?: string | number;
  title: string;
  isActive?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
        isActive ? "bg-primary/10 text-primary" : "bg-muted/30 text-foreground hover:bg-muted/50",
        isLocked && "opacity-50"
      )}
    >
      <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground">
        {number}
      </span>
      <span className="text-sm font-medium leading-snug">{title}</span>
    </button>
  );
}

// Mobile Action Card
export function MobileActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "success";
}) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        variant === "primary" && "border-primary/30 bg-primary/5",
        variant === "success" && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      <CardContent className="p-4">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-start gap-3 text-left"
        >
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              variant === "primary" && "bg-primary/20 text-primary",
              variant === "success" && "bg-emerald-500/20 text-emerald-600",
              variant === "default" && "bg-muted/50 text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </button>
      </CardContent>
    </Card>
  );
}