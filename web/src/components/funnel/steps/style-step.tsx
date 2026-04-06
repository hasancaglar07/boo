"use client";

import { ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  coverDirectionLabel,
  depthLabel,
  languageDescription,
  languageLabel,
  toneLabel,
  SUPPORTED_LANGUAGES,
  type FunnelCoverDirection,
  type FunnelDepth,
  type FunnelDraft,
  type FunnelLanguage,
  type FunnelTone,
} from "@/lib/funnel-draft";
import { PUBLISHER_LOGO_PRESETS, pickRandomPublisherLogo } from "@/lib/publisher-logo-library";
import { getAccount, getPlan } from "@/lib/preview-auth";
import { cn } from "@/lib/utils";

const TONES: FunnelTone[] = ["clear", "professional", "warm", "inspiring"];
const DEPTHS: FunnelDepth[] = ["hizli", "dengeli", "detayli"];
const COVER_DIRECTIONS: FunnelCoverDirection[] = ["editorial", "tech", "minimal", "energetic"];

type StyleTab = "identity" | "cover" | "advanced";

const TAB_CONFIG: Array<{ key: StyleTab; label: string }> = [
  { key: "identity", label: "Kimlik" },
  { key: "cover", label: "Cover" },
  { key: "advanced", label: "Settings" },
];

function getProfileePublisherBrand() {
  const account = getAccount();
  const planId = getPlan();
  if (planId !== "pro") return null;
  const imprint = String(account.publisherImprint || "").trim();
  const logoUrl = String(account.publisherLogoUrl || "").trim();
  if (!imprint && !logoUrl) return null;
  return { imprint: imprint || "Studio Press", logoText: imprint || "Studio Press", logoUrl };
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Logo file could not be read."));
    reader.onload = () => {
      const result = String(reader.result || "");
      if (!result.startsWith("data:image/")) {
        reject(new Error("A valid image could not be loaded."));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

/* ── Premium pill selector for tone / depth / cover direction ── */
function PillSelector<T extends string>({
  options,
  selected,
  labelFor,
  onSelect,
}: {
  options: T[];
  selected: T;
  labelFor: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((value) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "h-12 px-5 py-2.5 text-sm sm:text-base font-semibold rounded-2xl border transition-all duration-150",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border/70 bg-card text-foreground/80 hover:border-primary/25 hover:bg-accent/60",
            )}
          >
            {labelFor(value)}
          </button>
        );
      })}
    </div>
  );
}

export function StyleStep({
  draft,
  onUpdate,
  onNext,
  onBack,
  onStyleAi,
  error,
  onError,
  aiLoading,
  appShell,
}: {
  draft: FunnelDraft;
  onUpdate: (changes: Partial<FunnelDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  onStyleAi: () => void;
  error: string;
  onError: (msg: string) => void;
  aiLoading: "" | "style";
  appShell: boolean;
}) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const profileBrand = getProfileePublisherBrand();
  const [activeTab, setActiveTab] = useState<StyleTab>("identity");

  const selectedLogoPreset = useMemo(
    () => PUBLISHER_LOGO_PRESETS.find((preset) => preset.url === draft.logoUrl) || null,
    [draft.logoUrl],
  );

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      onError("Only image files can be uploaded.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onError("Logo file must be smaller than 2 MB.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      onUpdate({ logoUrl: dataUrl });
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Logo could not be uploaded.");
    }
  }

  return (
    <form id="wizard-form" onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-7">

      {/* ── Horizontal scrollable pill tab navigation ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "h-12 rounded-2xl px-5 py-2 text-sm sm:text-base font-semibold shrink-0 transition-all",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/60 text-foreground hover:border-primary/30",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── AI style button (always visible above tabs) ── */}
      <Button
        type="button"
        variant="outline"
        className="h-14 w-full rounded-2xl text-base font-bold gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
        onClick={onStyleAi}
        disabled={aiLoading === "style"}
      >
        <Sparkles className="size-4" />
        {aiLoading === "style" ? "AI generateuyor…" : "AI ile generate"}
      </Button>

      {/* ── Tab: Identity ── */}
      {activeTab === "identity" ? (
        <div className="space-y-7">
          {/* Author name */}
          <div className="space-y-2">
            <label htmlFor="author-name" className="text-base sm:text-lg font-bold">
              Author Name
            </label>
            <Input
              id="author-name"
              value={draft.authorName}
              onChange={(event) => onUpdate({ authorName: event.target.value })}
              placeholder="e.g.: John Smith"
              className="h-14 text-base rounded-2xl px-5"
            />
          </div>

          {/* Publisher name */}
          <div className="space-y-2">
            <label htmlFor="imprint" className="text-base sm:text-lg font-bold">
              Publisher Name
            </label>
            <Input
              id="imprint"
              value={draft.imprint}
              onChange={(event) => onUpdate({ imprint: event.target.value })}
              placeholder="e.g.: North Light Publishing"
              className="h-14 text-base rounded-2xl px-5"
            />
          </div>

          {/* Logo text */}
          <div className="space-y-2">
            <label htmlFor="logo-text" className="text-base sm:text-lg font-bold">
              Logo metni
            </label>
            <Input
              id="logo-text"
              value={draft.logoText}
              onChange={(event) => onUpdate({ logoText: event.target.value })}
              placeholder="e.g.: JL Studio"
              className="h-14 text-base rounded-2xl px-5"
            />
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <div className="text-base sm:text-lg font-bold">Upload Logo</div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLogoUpload(file);
                event.currentTarget.value = "";
              }}
            />
            {draft.logoUrl && draft.logoUrl.startsWith("data:image/") ? (
              <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white p-2">
                    <img src={draft.logoUrl} alt="Uploaded logo" className="max-h-12 max-w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Logo uploaded ✓</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Click to change</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdate({ logoUrl: "" })}
                    className="shrink-0 size-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border/60 bg-card/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 p-6 flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <ImagePlus className="size-5 text-primary" />
                </div>
                <div className="text-sm font-semibold text-foreground">Click to upload logo</div>
                <div className="text-xs text-muted-foreground">PNG, JPG, WebP veya SVG · Maks 2 MB</div>
              </button>
            )}
          </div>
          {/* Author bio */}
          <div className="space-y-2">
            <label htmlFor="author-bio" className="text-base sm:text-lg font-bold">
              Short Bio
            </label>
            <Textarea
              id="author-bio"
              rows={4}
              value={draft.authorBio}
              onChange={(event) => onUpdate({ authorBio: event.target.value })}
              placeholder="e.g.: Independent author working on game guides and AI-powered publishing."
              className="min-h-[140px] text-base rounded-2xl px-5 py-4 resize-none leading-7"
            />
          </div>

          {/* Language selector */}
          <div className="space-y-2">
            <label htmlFor="language" className="text-base sm:text-lg font-bold">
              Dil
            </label>
            <select
              id="language"
              value={draft.language}
              onChange={(event) => onUpdate({ language: event.target.value as FunnelLanguage, languageLocked: true })}
              className="h-14 text-base rounded-2xl px-5 w-full bg-card text-foreground outline-none"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
            <p className="text-sm px-4 py-2.5">
              <span className="font-medium text-foreground/70">{languageLabel(draft.language)}</span> — {languageDescription(draft.language)}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Tab: Cover ── */}
      {activeTab === "cover" ? (
        <div className="space-y-7">
          {/* Cover brief */}
          <div className="space-y-2">
            <label htmlFor="cover-brief" className="text-base sm:text-lg font-bold">
              Cover vurgusu
            </label>
            <Input
              id="cover-brief"
              value={draft.coverBrief}
              onChange={(event) => onUpdate({ coverBrief: event.target.value })}
              placeholder="e.g.: Build • Strengthen • Advance"
              className="h-14 text-base rounded-2xl px-5"
            />
          </div>

          {/* Logo actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-12 rounded-2xl text-sm font-semibold px-5"
              onClick={() => {
                const preset = pickRandomPublisherLogo();
                onUpdate({ imprint: preset.imprint, logoText: preset.mark, logoUrl: preset.url });
              }}
            >
              <Wand2 className="mr-1.5 size-4" />
              Rastgele logo
            </Button>
            {profileBrand ? (
              <Button
                size="sm"
                variant="outline"
                className="h-12 rounded-2xl text-sm font-semibold px-5"
                onClick={() =>
                  onUpdate({
                    imprint: profileBrand.imprint,
                    logoText: profileBrand.logoText,
                    logoUrl: profileBrand.logoUrl || draft.logoUrl,
                  })
                }
              >
                Profile logosu
              </Button>
            ) : null}
          </div>

          {/* Logo preset grid */}
          <div className="space-y-3">
            <div className="text-base sm:text-lg font-bold">Logo Library</div>
            <div className="max-h-[320px] overflow-y-auto overscroll-contain rounded-2xl border border-border/50 bg-background/40 p-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {PUBLISHER_LOGO_PRESETS.map((preset) => {
                  const selected = draft.logoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={cn(
                        "flex h-18 flex-col items-center justify-center rounded-2xl border p-2 transition-all duration-100",
                        selected
                          ? "border-primary bg-primary/8 ring-2 ring-primary"
                          : "border-border/50 bg-card/60 hover:border-primary/15 hover:bg-accent/50",
                      )}
                      onClick={() => onUpdate({ imprint: preset.imprint, logoText: preset.mark, logoUrl: preset.url })}
                    >
                      <img src={preset.url} alt={preset.imprint} className="max-h-8 max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Tab: Advanced ── */}
      {activeTab === "advanced" ? (
        <div className="space-y-7">
          {/* Tone */}
          <div className="space-y-3">
            <div className="text-base sm:text-lg font-bold">Tone</div>
            <PillSelector
              options={TONES}
              selected={draft.tone}
              labelFor={(value) => toneLabel(value, draft.language)}
              onSelect={(value) => onUpdate({ tone: value })}
            />
          </div>

          {/* Depth */}
          <div className="space-y-3">
            <div className="text-base sm:text-lg font-bold">Derinlik</div>
            <PillSelector
              options={DEPTHS}
              selected={draft.depth}
              labelFor={(value) => depthLabel(value, draft.language)}
              onSelect={(value) => onUpdate({ depth: value })}
            />
          </div>

          {/* Cover direction */}
          <div className="space-y-3">
            <div className="text-base sm:text-lg font-bold">Cover Direction</div>
            <PillSelector
              options={COVER_DIRECTIONS}
              selected={draft.coverDirection}
              labelFor={(value) => coverDirectionLabel(value, draft.language)}
              onSelect={(value) => onUpdate({ coverDirection: value })}
            />
          </div>

          {/* Language selector (also in advanced for discoverability) */}
          <div className="space-y-2">
            <label htmlFor="language-advanced" className="text-base sm:text-lg font-bold">
              Dil
            </label>
            <select
              id="language-advanced"
              value={draft.language}
              onChange={(event) => onUpdate({ language: event.target.value as FunnelLanguage, languageLocked: true })}
              className="h-14 text-base rounded-2xl px-5 w-full bg-card text-foreground outline-none"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
            <p className="text-sm px-4 py-2.5">
              <span className="font-medium text-foreground/70">{languageLabel(draft.language)}</span> — {languageDescription(draft.language)}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Error ── */}
      {error ? (
        <div role="alert" className="rounded-xl px-4 py-3 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </form>
  );
}