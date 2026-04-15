"use client";

import Image from "next/image";
import { PenTool, X, Loader2, Save, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/ui/loading";
import { CircularCountdown } from "@/components/ui/loading/circular-countdown";
import { buildBookAssetUrl, runWorkflow, saveBook, type Book } from "@/lib/dashboard-api";
import { trackEvent } from "@/lib/analytics";

interface EditableBookDetailsProps {
  slug: string;
  title: string;
  subtitle?: string;
  language?: string;
  author?: string;
  publisher?: string;
  authorBio?: string;
  coverBrief?: string;
  brandingMark?: string;
  brandingLogoUrl?: string;
  editionLabel?: string;
  printLabel?: string;
  publicationCity?: string;
  publicationCountry?: string;
  publisherAddress?: string;
  publisherPhone?: string;
  publisherEmail?: string;
  publisherWebsite?: string;
  publisherCertificateNo?: string;
  isbn13?: string;
  editorName?: string;
  proofreaderName?: string;
  typesetterName?: string;
  coverDesignerName?: string;
  printerName?: string;
  printerAddress?: string;
  printerCertificateNo?: string;
  copyrightStatement?: string;
  imprintBlock?: string;
  onUpdate?: () => void;
  isLoading?: boolean;
}

function isInlineImageDataUrl(value: string) {
  return /^data:image\//i.test(value.trim());
}

function logoPathDisplayLabel(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";
  if (isInlineImageDataUrl(value)) {
    const mime = value.slice(5, value.indexOf(";") > 5 ? value.indexOf(";") : undefined) || "image";
    return `${mime} inline data URL (${value.length.toLocaleString()} chars)`;
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return `${url.host}${url.pathname}`;
    } catch {
      return value;
    }
  }
  return value;
}

export function EditableBookDetails({
  slug,
  title,
  subtitle,
  language,
  author,
  publisher,
  authorBio,
  coverBrief,
  brandingMark,
  brandingLogoUrl,
  editionLabel,
  printLabel,
  publicationCity,
  publicationCountry,
  publisherAddress,
  publisherPhone,
  publisherEmail,
  publisherWebsite,
  publisherCertificateNo,
  isbn13,
  editorName,
  proofreaderName,
  typesetterName,
  coverDesignerName,
  printerName,
  printerAddress,
  printerCertificateNo,
  copyrightStatement,
  imprintBlock,
  onUpdate,
  isLoading = false,
}: EditableBookDetailsProps) {
  const t = useTranslations("EditableBookDetails");
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
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
    brandingMark: brandingMark || "",
    brandingLogoUrl: brandingLogoUrl || "",
    editionLabel: editionLabel || "",
    printLabel: printLabel || "",
    publicationCity: publicationCity || "",
    publicationCountry: publicationCountry || "",
    publisherAddress: publisherAddress || "",
    publisherPhone: publisherPhone || "",
    publisherEmail: publisherEmail || "",
    publisherWebsite: publisherWebsite || "",
    publisherCertificateNo: publisherCertificateNo || "",
    isbn13: isbn13 || "",
    editorName: editorName || "",
    proofreaderName: proofreaderName || "",
    typesetterName: typesetterName || "",
    coverDesignerName: coverDesignerName || "",
    printerName: printerName || "",
    printerAddress: printerAddress || "",
    printerCertificateNo: printerCertificateNo || "",
    copyrightStatement: copyrightStatement || "",
    imprintBlock: imprintBlock || "",
  });
  const normalizedBrandingLogoUrl = String(brandingLogoUrl || "").trim();
  const brandingLogoPreviewUrl = normalizedBrandingLogoUrl
    ? buildBookAssetUrl(slug, normalizedBrandingLogoUrl)
    : "";
  const brandingLogoIsDataUrl = isInlineImageDataUrl(normalizedBrandingLogoUrl);

  const handleFieldChange = (field: keyof typeof draft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveError(null);
  };

  const displayValue = useCallback(
    (value: string | undefined) => {
      const normalized = String(value || "").trim();
      return normalized || t("emptyValue");
    },
    [t],
  );

  const applySavedBookToDraft = useCallback((saved: Partial<Book>) => {
    setDraft((prev) => ({
      ...prev,
      title: String(saved.title ?? prev.title ?? ""),
      subtitle: String(saved.subtitle ?? prev.subtitle ?? ""),
      author: String(saved.author ?? prev.author ?? ""),
      publisher: String(saved.publisher ?? prev.publisher ?? ""),
      authorBio: String(saved.author_bio ?? prev.authorBio ?? ""),
      coverBrief: String(saved.cover_brief ?? prev.coverBrief ?? ""),
      brandingMark: String(saved.branding_mark ?? prev.brandingMark ?? ""),
      brandingLogoUrl: String(saved.branding_logo_url ?? prev.brandingLogoUrl ?? ""),
      editionLabel: String(saved.edition_label ?? prev.editionLabel ?? ""),
      printLabel: String(saved.print_label ?? prev.printLabel ?? ""),
      publicationCity: String(saved.publication_city ?? prev.publicationCity ?? ""),
      publicationCountry: String(saved.publication_country ?? prev.publicationCountry ?? ""),
      publisherAddress: String(saved.publisher_address ?? prev.publisherAddress ?? ""),
      publisherPhone: String(saved.publisher_phone ?? prev.publisherPhone ?? ""),
      publisherEmail: String(saved.publisher_email ?? prev.publisherEmail ?? ""),
      publisherWebsite: String(saved.publisher_website ?? prev.publisherWebsite ?? ""),
      publisherCertificateNo: String(saved.publisher_certificate_no ?? prev.publisherCertificateNo ?? ""),
      isbn13: String(saved.isbn13 ?? prev.isbn13 ?? ""),
      editorName: String(saved.editor_name ?? prev.editorName ?? ""),
      proofreaderName: String(saved.proofreader_name ?? prev.proofreaderName ?? ""),
      typesetterName: String(saved.typesetter_name ?? prev.typesetterName ?? ""),
      coverDesignerName: String(saved.cover_designer_name ?? prev.coverDesignerName ?? ""),
      printerName: String(saved.printer_name ?? prev.printerName ?? ""),
      printerAddress: String(saved.printer_address ?? prev.printerAddress ?? ""),
      printerCertificateNo: String(saved.printer_certificate_no ?? prev.printerCertificateNo ?? ""),
      copyrightStatement: String(saved.copyright_statement ?? prev.copyrightStatement ?? ""),
      imprintBlock: String(saved.imprint_block ?? prev.imprintBlock ?? ""),
    }));
  }, []);

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
        branding_mark: draft.brandingMark,
        branding_logo_url: draft.brandingLogoUrl,
        edition_label: draft.editionLabel,
        print_label: draft.printLabel,
        publication_city: draft.publicationCity,
        publication_country: draft.publicationCountry,
        publisher_address: draft.publisherAddress,
        publisher_phone: draft.publisherPhone,
        publisher_email: draft.publisherEmail,
        publisher_website: draft.publisherWebsite,
        publisher_certificate_no: draft.publisherCertificateNo,
        isbn13: draft.isbn13,
        editor_name: draft.editorName,
        proofreader_name: draft.proofreaderName,
        typesetter_name: draft.typesetterName,
        cover_designer_name: draft.coverDesignerName,
        printer_name: draft.printerName,
        printer_address: draft.printerAddress,
        printer_certificate_no: draft.printerCertificateNo,
        copyright_statement: draft.copyrightStatement,
        imprint_block: draft.imprintBlock,
      });

      setIsDirty(false);
      setAutoSaveCountdown(30);
      onUpdate?.();

      trackEvent("profile_next_step_clicked", { action: "book_details_saved" });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Failed to save book details:", error);
      setSaveError(error instanceof Error && error.message ? error.message : t("saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [slug, draft, isDirty, isSaving, onUpdate, router, t]);

  const handleGenerateDetails = useCallback(async () => {
    if (isSaving || isGeneratingDetails) return;

    setIsGeneratingDetails(true);
    setSaveError(null);

    try {
      const saved = await saveBook({
        slug,
        title: draft.title,
        subtitle: draft.subtitle,
        language: language || undefined,
        author: draft.author,
        publisher: draft.publisher,
        author_bio: draft.authorBio,
        cover_brief: draft.coverBrief,
        branding_mark: draft.brandingMark,
        branding_logo_url: draft.brandingLogoUrl,
        edition_label: draft.editionLabel,
        print_label: draft.printLabel,
        publication_city: draft.publicationCity,
        publication_country: draft.publicationCountry,
        publisher_address: draft.publisherAddress,
        publisher_phone: draft.publisherPhone,
        publisher_email: draft.publisherEmail,
        publisher_website: draft.publisherWebsite,
        publisher_certificate_no: draft.publisherCertificateNo,
        isbn13: draft.isbn13,
        editor_name: draft.editorName,
        proofreader_name: draft.proofreaderName,
        typesetter_name: draft.typesetterName,
        cover_designer_name: draft.coverDesignerName,
        printer_name: draft.printerName,
        printer_address: draft.printerAddress,
        printer_certificate_no: draft.printerCertificateNo,
        copyright_statement: draft.copyrightStatement,
        imprint_block: draft.imprintBlock,
        regenerate_professional_details: true,
        details_generation_nonce: `${Date.now()}`,
      } as Partial<Book>);

      applySavedBookToDraft(saved);
      setIsDirty(false);
      setAutoSaveCountdown(30);
      onUpdate?.();

      let frontmatterWarning = "";
      try {
        const workflowResult = await runWorkflow({
          action: "frontmatter_generate",
          slug,
          force: true,
        });
        if (workflowResult?.ok === false) {
          frontmatterWarning =
            (typeof workflowResult.output === "string" && workflowResult.output.trim()) ||
            t("saveError");
        }
      } catch (workflowError) {
        console.error("Failed to regenerate frontmatter sections:", workflowError);
        frontmatterWarning =
          workflowError instanceof Error && workflowError.message ? workflowError.message : t("saveError");
      }

      if (frontmatterWarning) {
        setSaveError(frontmatterWarning);
      }

      router.refresh();
      trackEvent("profile_next_step_clicked", { action: "book_details_generated" });
    } catch (error) {
      console.error("Failed to generate professional details:", error);
      setSaveError(error instanceof Error && error.message ? error.message : t("saveError"));
    } finally {
      setIsGeneratingDetails(false);
    }
  }, [slug, draft, language, isSaving, isGeneratingDetails, onUpdate, router, t, applySavedBookToDraft]);

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
  }, [isDirty, isSaving, isEditing, handleSave]);

  // Reset countdown when changes are saved
  useEffect(() => {
    if (!isDirty) {
      setAutoSaveCountdown(30);
    }
  }, [isDirty]);

  const handleCancel = () => {
    setDraft({
      title,
      subtitle: subtitle || "",
      author: author || "",
      publisher: publisher || "",
      authorBio: authorBio || "",
      coverBrief: coverBrief || "",
      brandingMark: brandingMark || "",
      brandingLogoUrl: brandingLogoUrl || "",
      editionLabel: editionLabel || "",
      printLabel: printLabel || "",
      publicationCity: publicationCity || "",
      publicationCountry: publicationCountry || "",
      publisherAddress: publisherAddress || "",
      publisherPhone: publisherPhone || "",
      publisherEmail: publisherEmail || "",
      publisherWebsite: publisherWebsite || "",
      publisherCertificateNo: publisherCertificateNo || "",
      isbn13: isbn13 || "",
      editorName: editorName || "",
      proofreaderName: proofreaderName || "",
      typesetterName: typesetterName || "",
      coverDesignerName: coverDesignerName || "",
      printerName: printerName || "",
      printerAddress: printerAddress || "",
      printerCertificateNo: printerCertificateNo || "",
      copyrightStatement: copyrightStatement || "",
      imprintBlock: imprintBlock || "",
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
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <PenTool className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{t("bookDetails")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleStartEdit}
                className="h-8 px-3 text-xs"
              >
                <PenTool className="mr-1.5 size-3.5" />
                {t("edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateDetails}
                disabled={isGeneratingDetails || isSaving}
                className="h-8 px-3 text-xs"
              >
                {isGeneratingDetails ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 size-3.5" />
                )}
                <span className="hidden sm:inline">{t("generateDetails")}</span>
                <span className="sm:hidden">{t("generateShort")}</span>
              </Button>
            </div>
          </div>

          {saveError && (
            <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 md:px-3 py-2 text-xs md:text-sm text-red-700 dark:text-red-400">
              {saveError}
            </div>
          )}

          <div className="space-y-2 md:space-y-3">
            {/* Always visible fields */}
            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldTitle")}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {displayValue(draft.title || title)}
              </div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldSubtitle")}
              </div>
              <div className="mt-1 text-sm text-foreground">
                {displayValue(draft.subtitle || subtitle)}
              </div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldAuthor")}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {displayValue(draft.author || author)}
              </div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldPublisher")}
              </div>
              <div className="mt-1 text-sm text-foreground">
                {displayValue(draft.publisher || publisher)}
              </div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldAuthorBio")}
              </div>
              <div className="mt-1 text-sm leading-5 md:leading-6 text-muted-foreground whitespace-pre-line">
                {displayValue(draft.authorBio || authorBio)}
              </div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldCoverEmphasis")}
              </div>
              <div className="mt-1 text-sm leading-5 md:leading-6 text-foreground whitespace-pre-line">
                {displayValue(draft.coverBrief || coverBrief)}
              </div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldBrandMark")}
              </div>
              <div className="mt-1 text-sm text-foreground">{displayValue(draft.brandingMark || brandingMark)}</div>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-background/60 px-2.5 md:px-3 py-2 md:py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("fieldBrandLogoPath")}
              </div>
              <div className="mt-1 flex items-start gap-3">
                <div className="flex h-10 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background/70">
                  {brandingLogoPreviewUrl ? (
                    <Image
                      src={brandingLogoPreviewUrl}
                      alt="Brand logo preview"
                      width={96}
                      height={40}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No logo</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-muted-foreground">
                    {displayValue(logoPathDisplayLabel(String(draft.brandingLogoUrl || normalizedBrandingLogoUrl || "")))}
                  </div>
                  {brandingLogoIsDataUrl ? (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Inline logo data detected. A file path or URL is recommended for cleaner metadata.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
                {t("publishingImprint")}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { label: t("fieldEditionLabel"), value: draft.editionLabel || editionLabel },
                  { label: t("fieldPrintLabel"), value: draft.printLabel || printLabel },
                  { label: t("fieldPublicationCity"), value: draft.publicationCity || publicationCity },
                  { label: t("fieldPublicationCountry"), value: draft.publicationCountry || publicationCountry },
                  { label: t("fieldIsbn13"), value: draft.isbn13 || isbn13 },
                  { label: t("fieldPublisherCertificateNo"), value: draft.publisherCertificateNo || publisherCertificateNo },
                  { label: t("fieldEditorName"), value: draft.editorName || editorName },
                  { label: t("fieldProofreaderName"), value: draft.proofreaderName || proofreaderName },
                  { label: t("fieldTypesetterName"), value: draft.typesetterName || typesetterName },
                  { label: t("fieldCoverDesignerName"), value: draft.coverDesignerName || coverDesignerName },
                  { label: t("fieldPrinterName"), value: draft.printerName || printerName },
                  { label: t("fieldPrinterCertificateNo"), value: draft.printerCertificateNo || printerCertificateNo },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{label}</div>
                    <div className="mt-0.5 text-xs text-foreground">{displayValue(value)}</div>
                  </div>
                ))}
              </div>
              {(draft.publisherAddress || publisherAddress || draft.printerAddress || printerAddress) && (
                <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                  {(draft.publisherAddress || publisherAddress) && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{t("fieldPublisherAddress")}</div>
                      <div className="mt-0.5 whitespace-pre-line text-xs text-foreground">{displayValue(draft.publisherAddress || publisherAddress)}</div>
                    </div>
                  )}
                  {(draft.printerAddress || printerAddress) && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{t("fieldPrinterAddress")}</div>
                      <div className="mt-0.5 whitespace-pre-line text-xs text-foreground">{displayValue(draft.printerAddress || printerAddress)}</div>
                    </div>
                  )}
                </div>
              )}
              {[draft.publisherPhone || publisherPhone, draft.publisherEmail || publisherEmail, draft.publisherWebsite || publisherWebsite].filter(Boolean).length > 0 && (
                <div className="mt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{t("fieldPublisherContact")}</div>
                  <div className="mt-0.5 text-xs text-foreground">
                    {[draft.publisherPhone || publisherPhone, draft.publisherEmail || publisherEmail, draft.publisherWebsite || publisherWebsite].filter(Boolean).join(" · ")}
                  </div>
                </div>
              )}
              {(draft.copyrightStatement || copyrightStatement) && (
                <div className="mt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{t("fieldCopyrightStatement")}</div>
                  <div className="mt-0.5 whitespace-pre-line text-xs text-foreground">{displayValue(draft.copyrightStatement || copyrightStatement)}</div>
                </div>
              )}
              {(draft.imprintBlock || imprintBlock) && (
                <div className="mt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{t("fieldImprintBlock")}</div>
                  <div className="mt-0.5 whitespace-pre-line text-xs text-foreground">{displayValue(draft.imprintBlock || imprintBlock)}</div>
                </div>
              )}
            </div>
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
            <span className="text-xs md:text-sm font-semibold text-foreground">{t("editBookDetails")}</span>
            {isDirty && !isSaving && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {t("unsaved")}
              </span>
            )}
            {isSaving && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <Loader2 className="size-3 animate-spin" />
                {t("saving")}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            <CircularCountdown
              seconds={autoSaveCountdown}
              size="sm"
              showLabel={false}
              className="opacity-80"
            />
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
              {t("fieldTitle")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={draft.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="mt-1.5 h-11"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldSubtitle")}
            </label>
            <Input
              value={draft.subtitle}
              onChange={(e) => handleFieldChange("subtitle", e.target.value)}
              placeholder={t("subtitlePlaceholder")}
              className="mt-1.5 h-11"
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldAuthor")}
            </label>
            <Input
              value={draft.author}
              onChange={(e) => handleFieldChange("author", e.target.value)}
              placeholder={t("authorPlaceholder")}
              className="mt-1.5 h-11"
            />
          </div>

          {/* Publisher */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldPublisher")}
            </label>
            <Input
              value={draft.publisher}
              onChange={(e) => handleFieldChange("publisher", e.target.value)}
              placeholder={t("publisherPlaceholder")}
              className="mt-1.5 h-11"
            />
          </div>

          {/* Author Bio */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldAuthorBio")}
            </label>
            <Textarea
              value={draft.authorBio}
              onChange={(e) => handleFieldChange("authorBio", e.target.value)}
              placeholder={t("authorBioPlaceholder")}
              className="mt-1.5 min-h-[80px] md:min-h-[100px]"
            />
          </div>

          {/* Cover Brief */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldCoverEmphasis")}
            </label>
            <Textarea
              value={draft.coverBrief}
              onChange={(e) => handleFieldChange("coverBrief", e.target.value)}
              placeholder={t("coverBriefPlaceholder")}
              className="mt-1.5 min-h-[60px] md:min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldBrandMark")}
            </label>
            <Input
              value={draft.brandingMark}
              onChange={(e) => handleFieldChange("brandingMark", e.target.value)}
              placeholder={t("brandMarkPlaceholder")}
              className="mt-1.5 h-11"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("fieldBrandLogoUrl")}
            </label>
            <Textarea
              value={draft.brandingLogoUrl}
              onChange={(e) => handleFieldChange("brandingLogoUrl", e.target.value)}
              placeholder={t("brandLogoPlaceholder")}
              className="mt-1.5 min-h-[72px] font-mono text-xs"
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-background/40 p-3 md:p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("publishingImprint")}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldEditionLabel")}
                </label>
                <Input
                  value={draft.editionLabel}
                  onChange={(e) => handleFieldChange("editionLabel", e.target.value)}
                  placeholder={t("editionLabelPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPrintLabel")}
                </label>
                <Input
                  value={draft.printLabel}
                  onChange={(e) => handleFieldChange("printLabel", e.target.value)}
                  placeholder={t("printLabelPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublicationCity")}
                </label>
                <Input
                  value={draft.publicationCity}
                  onChange={(e) => handleFieldChange("publicationCity", e.target.value)}
                  placeholder={t("publicationCityPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublicationCountry")}
                </label>
                <Input
                  value={draft.publicationCountry}
                  onChange={(e) => handleFieldChange("publicationCountry", e.target.value)}
                  placeholder={t("publicationCountryPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldIsbn13")}
                </label>
                <Input
                  value={draft.isbn13}
                  onChange={(e) => handleFieldChange("isbn13", e.target.value)}
                  placeholder={t("isbn13Placeholder")}
                  className="mt-1.5 h-11 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublisherCertificateNo")}
                </label>
                <Input
                  value={draft.publisherCertificateNo}
                  onChange={(e) => handleFieldChange("publisherCertificateNo", e.target.value)}
                  placeholder={t("publisherCertificateNoPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldEditorName")}
                </label>
                <Input
                  value={draft.editorName}
                  onChange={(e) => handleFieldChange("editorName", e.target.value)}
                  placeholder={t("editorNamePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldProofreaderName")}
                </label>
                <Input
                  value={draft.proofreaderName}
                  onChange={(e) => handleFieldChange("proofreaderName", e.target.value)}
                  placeholder={t("proofreaderNamePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldTypesetterName")}
                </label>
                <Input
                  value={draft.typesetterName}
                  onChange={(e) => handleFieldChange("typesetterName", e.target.value)}
                  placeholder={t("typesetterNamePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldCoverDesignerName")}
                </label>
                <Input
                  value={draft.coverDesignerName}
                  onChange={(e) => handleFieldChange("coverDesignerName", e.target.value)}
                  placeholder={t("coverDesignerNamePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPrinterName")}
                </label>
                <Input
                  value={draft.printerName}
                  onChange={(e) => handleFieldChange("printerName", e.target.value)}
                  placeholder={t("printerNamePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPrinterCertificateNo")}
                </label>
                <Input
                  value={draft.printerCertificateNo}
                  onChange={(e) => handleFieldChange("printerCertificateNo", e.target.value)}
                  placeholder={t("printerCertificateNoPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublisherPhone")}
                </label>
                <Input
                  value={draft.publisherPhone}
                  onChange={(e) => handleFieldChange("publisherPhone", e.target.value)}
                  placeholder={t("publisherPhonePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublisherEmail")}
                </label>
                <Input
                  value={draft.publisherEmail}
                  onChange={(e) => handleFieldChange("publisherEmail", e.target.value)}
                  placeholder={t("publisherEmailPlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublisherWebsite")}
                </label>
                <Input
                  value={draft.publisherWebsite}
                  onChange={(e) => handleFieldChange("publisherWebsite", e.target.value)}
                  placeholder={t("publisherWebsitePlaceholder")}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPublisherAddress")}
                </label>
                <Textarea
                  value={draft.publisherAddress}
                  onChange={(e) => handleFieldChange("publisherAddress", e.target.value)}
                  placeholder={t("publisherAddressPlaceholder")}
                  className="mt-1.5 min-h-[70px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldPrinterAddress")}
                </label>
                <Textarea
                  value={draft.printerAddress}
                  onChange={(e) => handleFieldChange("printerAddress", e.target.value)}
                  placeholder={t("printerAddressPlaceholder")}
                  className="mt-1.5 min-h-[70px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldCopyrightStatement")}
                </label>
                <Textarea
                  value={draft.copyrightStatement}
                  onChange={(e) => handleFieldChange("copyrightStatement", e.target.value)}
                  placeholder={t("copyrightStatementPlaceholder")}
                  className="mt-1.5 min-h-[70px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("fieldImprintBlock")}
                </label>
                <Textarea
                  value={draft.imprintBlock}
                  onChange={(e) => handleFieldChange("imprintBlock", e.target.value)}
                  placeholder={t("imprintBlockPlaceholder")}
                  className="mt-1.5 min-h-[96px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 md:mt-6 flex items-center justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving || isGeneratingDetails}
              className="h-9 px-3 text-xs"
            >
              <X className="mr-1.5 md:mr-2 size-3.5" />
              <span className="hidden sm:inline">{t("cancel")}</span>
              <span className="sm:hidden">{t("cancel")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateDetails}
              disabled={isSaving || isGeneratingDetails}
              className="h-9 px-3 text-xs"
            >
              {isGeneratingDetails ? (
                <Loader2 className="mr-1.5 md:mr-2 size-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 md:mr-2 size-3.5" />
              )}
              <span className="hidden sm:inline">{t("generateDetails")}</span>
              <span className="sm:hidden">{t("generateShort")}</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {isDirty && (
              <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">
                {t("changesNotSaved")}
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving || isGeneratingDetails}
              className="h-9 px-3 md:px-4 text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 md:mr-2 size-3.5 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <>
                  <Save className="mr-1.5 md:mr-2 size-3.5" />
                  <span className="hidden sm:inline">{t("saveChanges")}</span>
                  <span className="sm:hidden">{t("save")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
