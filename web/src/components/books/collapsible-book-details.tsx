"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, FileText, PenTool, User } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleBookDetailsProps {
  authorName: string;
  imprint: string;
  logoText: string;
  logoUrl?: string;
  authorBio?: string;
  coverBrief?: string;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleBookDetails({
  authorName,
  imprint,
  logoText,
  logoUrl,
  authorBio,
  coverBrief,
  className,
  defaultExpanded = false,
}: CollapsibleBookDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const t = useTranslations("CollapsibleBookDetails");

  const hasContent = Boolean(authorBio || logoUrl || coverBrief);
  const sections = [
    {
      id: "author" as const,
      label: t("sectionAuthor"),
      icon: User,
      content: authorName,
      alwaysVisible: true,
    },
    {
      id: "logo" as const,
      label: t("sectionImprint"),
      icon: PenTool,
      content: logoText || imprint,
      alwaysVisible: true,
    },
    {
      id: "cover" as const,
      label: t("sectionCoverEmphasis"),
      icon: FileText,
      content: coverBrief,
      alwaysVisible: false,
    },
  ];

  return (
    <Card className={cn("overflow-hidden transition-all duration-300", className)}>
      <CardContent className="p-5">
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between gap-4 text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">{t("title")}</span>
            {hasContent && !isExpanded && (
              <span className="text-xs text-muted-foreground">
                ({authorBio ? 1 : 0} + {logoUrl ? 1 : 0} + {coverBrief ? 1 : 0} hidden)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {isExpanded ? t("hide") : t("show")}
            </span>
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        <div
          className={cn(
            "mt-4 grid overflow-hidden transition-all duration-300",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-3">
              {/* Always Visible Sections */}
              {sections.filter(s => s.alwaysVisible).map((section) => (
                <div
                  key={section.id}
                  className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {section.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Logo */}
              {logoUrl && (
                <div className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("sectionLogo")}
                  </div>
                  <div className="relative mt-2 h-10 w-[120px] overflow-hidden rounded-md bg-muted/30">
                    <Image
                      src={logoUrl}
                      alt={`${logoText} logo`}
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Conditional Sections */}
              {sections.filter(s => !s.alwaysVisible && s.content).map((section) => {
                const SectionIcon = section.icon;
                return (
                  <div
                    key={section.id}
                    className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <SectionIcon className="size-3" aria-hidden="true" />
                      {section.label}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-foreground">
                      {section.content}
                    </div>
                  </div>
                );
              })}

              {/* Author Bio */}
              {authorBio && (
                <div className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("sectionAuthorBio")}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    {authorBio}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}