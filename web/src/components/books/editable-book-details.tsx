"use client";

import { Check, PenTool, X, Loader2, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/ui/loading";
import { saveBook, type Book } from "@/lib/dashboard-api";
import { trackEvent } from "@/lib/analytics";

interface EditableBookDetailsProps {
  slug: string;
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  authorBio?: string;
  coverBrief?: string;
  onUpdate?: () => void;
  isLoading?: boolean;
}

export function EditableBookDetails({
  slug,
  title,
  subtitle,
  author,
  publisher,
  authorBio,
  coverBrief,
  onUpdate,
  isLoading = false,
}: EditableBookDetailsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(30);

  // Form state
  const [draft, setDraft] = useState({
    title,
    subtitle: subtitle || "",
    author: author || "",
    publisher: publisher || "",
    authorBio: authorBio || "",
    coverBrief: coverBrief || "",
  });

  // Auto-save countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isDirty && !isSaving && isEditing) {
      interval = setInterval(() => {
        setAutoSaveCountdown((prev) => {
          if (prev <= 1) {
            handleSave();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDirty, isSaving, isEditing]);

  // Reset countdown when changes are saved
  useEffect(() => {
    if (!isDirty) {
      setAutoSaveCountdown(30);
    }
  }, [isDirty]);

  const handleFieldChange = (field: keyof typeof draft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveError(null);
  };

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveBook({
        slug,
        title: draft.title,
        subtitle: draft.subtitle,
        author: draft.author,
        publisher: draft.publisher,
        author_bio: draft.authorBio,
        cover_brief: draft.coverBrief,
      });

      setIsDirty(false);
      setAutoSaveCountdown(30);
      onUpdate?.();

      trackEvent("profile_next_step_clicked", { action: "book_details_saved" });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Failed to save book details:", error);
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [slug, draft, isDirty, isSaving, onUpdate, router]);

  const handleCancel = () => {
    setDraft({
      title,
      subtitle: subtitle || "",
      author: author || "",
      publisher: publisher || "",
      authorBio: authorBio || "",
      coverBrief: coverBrief || "",
    });
    setIsDirty(false);
    setIsEditing(false);
    setSaveError(null);
    setAutoSaveCountdown(30);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    trackEvent("profile_next_step_clicked", { action: "book_details_edit_started" });
  };

  // Skeleton loader
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card">
        <CardContent className="p-6 space-y-6">
          {/* Cover skeleton */}
          <div className="flex gap-6">
            <SkeletonCard className="h-48 w-36 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <SkeletonCard className="h-8 w-3/4" />
              <SkeletonCard className="h-5 w-1/2" />
              <SkeletonCard className="h-4 w-full" />
              <SkeletonCard className="h-4 w-2/3" />
            </div>
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-4">
            <SkeletonCard className="h-10 w-full" />
            <SkeletonCard className="h-10 w-full" />
            <SkeletonCard className="h-24 w-full" />
            <SkeletonCard className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isEditing) {
    // View mode
    return (
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <PenTool className="size-4 text-muted-foreground" />
              <span className="text-xs md:text-sm font-semibold text-foreground">Book Details</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="h-8 px-2 md:px-3 text-xs"
            >
              <PenTool className="mr-1 md:mr-1.5 size-3.5" />
              <span className="hidden sm:inline">Edit</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>

          <div className="space-y-2 md:space-y-3">
            {/* Always visible fields */}
            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Title
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {title}
              </div>
            </div>

            {subtitle && (
              <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Subtitle
                </div>
                <div className="mt-1 text-sm text-foreground">
                  {subtitle}
                </div>
              </div>
            )}

            {author && (
              <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Author
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {author}
                </div>
              </div>
            )}

            {publisher && (
              <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Publisher
                </div>
                <div className="mt-1 text-sm text-foreground">
                  {publisher}
                </div>
              </div>
            )}

            {authorBio && (
              <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Author Biography
                </div>
                <div className="mt-1 text-sm leading-5 md:leading-6 text-muted-foreground">
                  {authorBio}
                </div>
              </div>
            )}

            {coverBrief && (
              <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Cover Emphasis
                </div>
                <div className="mt-1 text-sm leading-5 md:leading-6 text-foreground">
                  {coverBrief}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Card className="border-primary/30 bg-card/50 shadow-lg">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2 md:gap-4 mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <PenTool className="size-4 text-primary" />
            <span className="text-xs md:text-sm font-semibold text-foreground">Edit Book Details</span>
            {isDirty && !isSaving && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Unsaved
              </span>
            )}
            {isSaving && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
          <div className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
            Auto-save in {autoSaveCountdown}s
          </div>
        </div>

        {saveError && (
          <div className="mb-3 md:mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 md:px-3 py-2 text-xs md:text-sm text-red-700 dark:text-red-400">
            {saveError}
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={draft.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter book title"
              className="mt-1.5 h-11"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Subtitle
            </label>
            <Input
              value={draft.subtitle}
              onChange={(e) => handleFieldChange("subtitle", e.target.value)}
              placeholder="Enter subtitle (optional)"
              className="mt-1.5 h-11"
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Author
            </label>
            <Input
              value={draft.author}
              onChange={(e) => handleFieldChange("author", e.target.value)}
              placeholder="Enter author name"
              className="mt-1.5 h-11"
            />
          </div>

          {/* Publisher */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Publisher
            </label>
            <Input
              value={draft.publisher}
              onChange={(e) => handleFieldChange("publisher", e.target.value)}
              placeholder="Enter publisher name"
              className="mt-1.5 h-11"
            />
          </div>

          {/* Author Bio */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Author Biography
            </label>
            <Textarea
              value={draft.authorBio}
              onChange={(e) => handleFieldChange("authorBio", e.target.value)}
              placeholder="Enter author biography"
              className="mt-1.5 min-h-[80px] md:min-h-[100px]"
            />
          </div>

          {/* Cover Brief */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Cover Emphasis
            </label>
            <Textarea
              value={draft.coverBrief}
              onChange={(e) => handleFieldChange("coverBrief", e.target.value)}
              placeholder="Describe the cover design emphasis"
              className="mt-1.5 min-h-[60px] md:min-h-[80px]"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 md:mt-6 flex items-center justify-between gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-9 px-3 text-xs"
          >
            <X className="mr-1.5 md:mr-2 size-3.5" />
            <span className="hidden sm:inline">Cancel</span>
            <span className="sm:hidden">Cancel</span>
          </Button>

          <div className="flex items-center gap-1.5 md:gap-2">
            {isDirty && (
              <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">
                Changes not saved
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="h-9 px-3 md:px-4 text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 md:mr-2 size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="mr-1.5 md:mr-2 size-3.5" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
