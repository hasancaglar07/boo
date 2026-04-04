"use client";

import { ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ChoiceGrid } from "@/components/funnel/shared/choice-grid";
import { LiveBookCard } from "@/components/funnel/shared/live-book-card";
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
const TABS = ["identity", "cover", "advanced"] as const;

type StyleTab = (typeof TABS)[number];

const TONE_DESCRIPTIONS: Record<FunnelTone, string> = {
  clear: "Hızlı taranır, doğrudan ve net.",
  professional: "Güven veren, düzenli ve uzman hissi taşıyan anlatım.",
  warm: "Daha yakın, akıcı ve dostane ton.",
  inspiring: "Enerji veren, motive eden ve vizyon odaklı dil.",
};

const DEPTH_DESCRIPTIONS: Record<FunnelDepth, string> = {
  hizli: "Kısa sürede okunan, öz ve yüksek tempolu kurgu.",
  dengeli: "Çoğu kitap için en güvenli denge; netlik ve kapsam birlikte.",
  detayli: "Daha çok örnek, daha çok bağlam ve daha güçlü derinlik.",
};

const COVER_DESCRIPTIONS: Record<FunnelCoverDirection, string> = {
  editorial: "Yayıncılık hissi veren raf kalitesi, daha ciddi bir yüz.",
  tech: "Teknoloji, oyun ve AI başlıkları için daha keskin görünüm.",
  minimal: "Daha sakin, temiz ve premium sade yön.",
  energetic: "Daha canlı, parlak ve hareketli görsel ritim.",
};

const TAB_LABELS: Record<StyleTab, { title: string; description: string }> = {
  identity: {
    title: "Yazar ve marka",
    description: "Yazar adı, yayınevi, logo metni ve kısa biyografi alanlarını düzenle.",
  },
  cover: {
    title: "Kapak ve logo",
    description: "Kapakta görünen kısa vurgu ve yayın evi logosunu seç.",
  },
  advanced: {
    title: "Ton ve ileri ayarlar",
    description: "Anlatım tonu, derinlik ve genel kapak yönünü burada netleştir.",
  },
};

function publisherFamilyLabel(family: "heritage" | "masthead" | "studio" | "letterpress") {
  switch (family) {
    case "heritage":
      return "Heritage";
    case "masthead":
      return "Masthead";
    case "studio":
      return "Studio";
    case "letterpress":
      return "Letterpress";
  }
}

function getProfilePublisherBrand() {
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
    reader.onerror = () => reject(new Error("Logo dosyası okunamadı."));
    reader.onload = () => {
      const result = String(reader.result || "");
      if (!result.startsWith("data:image/")) {
        reject(new Error("Geçerli bir görsel yüklenemedi."));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
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
  const profileBrand = getProfilePublisherBrand();
  const [activeTab, setActiveTab] = useState<StyleTab>("identity");

  const selectedLogoPreset = useMemo(
    () => PUBLISHER_LOGO_PRESETS.find((preset) => preset.url === draft.logoUrl) || null,
    [draft.logoUrl],
  );

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      onError("Yalnızca görsel dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onError("Logo dosyası 4 MB'den küçük olmalı.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      onUpdate({ logoUrl: dataUrl });
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Logo yüklenemedi.");
    }
  }

  return (
    <div className="space-y-8">
      {!appShell ? <LiveBookCard draft={draft} /> : null}

      <div className="rounded-[24px] border border-border/80 bg-background/72 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[15px] font-semibold text-foreground">AI stil paketi</div>
            <div className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              Seçtiğin dile göre yazar adı, yayınevi adı, logo metni, kapak vurgu metni ve kısa biyografiyi otomatik üret.
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onStyleAi} isLoading={aiLoading === "style"}>
            <Sparkles className="mr-1.5 size-3.5" />
            AI ile oluştur
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="language" className="text-sm font-semibold text-foreground">
          Kitap dili
        </label>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <select
            id="language"
            value={draft.language}
            onChange={(event) => onUpdate({ language: event.target.value as FunnelLanguage })}
            className="flex h-14 w-full rounded-[20px] border border-input bg-card px-5 text-[15px] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
          >
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
          <div className="rounded-[20px] border border-border/80 bg-background/72 px-4 py-4 text-sm leading-7 text-muted-foreground">
            <span className="font-semibold text-foreground">{languageLabel(draft.language)}:</span> {languageDescription(draft.language)}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border/70 bg-card/60 p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-[18px] border px-4 py-3 text-left transition-all duration-200",
                  active
                    ? "border-primary/25 bg-primary/[0.08] shadow-sm"
                    : "border-border/60 bg-background/70 hover:border-primary/15 hover:bg-background",
                )}
              >
                <div className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/80")}>{TAB_LABELS[tab].title}</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">{TAB_LABELS[tab].description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "identity" ? (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="author-name" className="text-sm font-semibold text-foreground">
                Yazar adı
              </label>
              <Input
                id="author-name"
                value={draft.authorName}
                onChange={(event) => onUpdate({ authorName: event.target.value })}
                placeholder="örnek: İhsan Yılmaz"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imprint" className="text-sm font-semibold text-foreground">
                Yayınevi adı
              </label>
              <Input
                id="imprint"
                value={draft.imprint}
                onChange={(event) => onUpdate({ imprint: event.target.value })}
                placeholder="örnek: Kuzey Işık Yayınları"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-text" className="text-sm font-semibold text-foreground">
                Logo metni
              </label>
              <Input
                id="logo-text"
                value={draft.logoText}
                onChange={(event) => onUpdate({ logoText: event.target.value })}
                placeholder="örnek: İY Atölye"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-url" className="text-sm font-semibold text-foreground">
                İstersen logo bağlantısı da ekleyebilirsin
              </label>
              <Input
                id="logo-url"
                value={draft.logoUrl.startsWith("data:image/") ? "" : draft.logoUrl}
                onChange={(event) => onUpdate({ logoUrl: event.target.value })}
                placeholder="örnek: https://site.com/logo.png"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="author-bio" className="text-sm font-semibold text-foreground">
              Kısa yazar biyografisi
            </label>
            <Textarea
              id="author-bio"
              rows={4}
              value={draft.authorBio}
              onChange={(event) => onUpdate({ authorBio: event.target.value })}
              placeholder="örnek: Oyun rehberleri ve yapay zeka destekli yayıncılık üzerine çalışan bağımsız yazar."
              className="resize-none leading-7"
            />
          </div>
        </div>
      ) : null}

      {activeTab === "cover" ? (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4 rounded-[24px] border border-border/80 bg-background/72 p-5">
              <div className="space-y-2">
                <label htmlFor="cover-brief" className="text-sm font-semibold text-foreground">
                  Kapakta öne çıkan vurgu
                </label>
                <Input
                  id="cover-brief"
                  value={draft.coverBrief}
                  onChange={(event) => onUpdate({ coverBrief: event.target.value })}
                  placeholder="örnek: Güçlen • Kur • İlerle"
                  className="h-11"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const preset = pickRandomPublisherLogo();
                    onUpdate({ imprint: preset.imprint, logoText: preset.mark, logoUrl: preset.url });
                  }}
                >
                  <Wand2 className="mr-1.5 size-3.5" />
                  Rastgele logo
                </Button>
                <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>
                  <ImagePlus className="mr-1.5 size-3.5" />
                  Logo yükle
                </Button>
                {profileBrand ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onUpdate({
                        imprint: profileBrand.imprint,
                        logoText: profileBrand.logoText,
                        logoUrl: profileBrand.logoUrl || draft.logoUrl,
                      })
                    }
                  >
                    Profil logosu
                  </Button>
                ) : null}
              </div>

              <div className="grid max-h-[340px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {PUBLISHER_LOGO_PRESETS.map((preset) => {
                  const selected = draft.logoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={cn(
                        "rounded-[20px] border p-4 text-left transition",
                        selected
                          ? "border-primary/40 bg-primary/8 ring-1 ring-primary/20"
                          : "border-border/80 bg-card hover:border-primary/20 hover:bg-accent",
                      )}
                      onClick={() => onUpdate({ imprint: preset.imprint, logoText: preset.mark, logoUrl: preset.url })}
                    >
                      <div className="flex min-h-[88px] items-center rounded-[18px] border border-border/60 bg-background/85 px-4 py-4">
                        <img src={preset.url} alt={preset.imprint} className="h-14 w-auto max-w-full object-contain" />
                      </div>
                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {publisherFamilyLabel(preset.family)}
                      </div>
                      <div className="mt-1 text-sm font-medium leading-6 text-foreground">{preset.imprint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-border/80 bg-card/65 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Seçili logo</div>
                <div className="mt-3 rounded-[20px] border border-border/70 bg-background/80 p-4">
                  {draft.logoUrl ? (
                    <div className="flex min-h-[88px] items-center justify-center rounded-[16px] border border-border/60 bg-card px-4 py-4">
                      <img src={draft.logoUrl} alt={draft.imprint || draft.logoText || "Logo"} className="h-16 w-auto max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                      Henüz bir logo seçmedin.
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Yayınevi</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{draft.imprint || "Henüz seçilmedi"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Logo metni</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{draft.logoText || "Henüz girilmedi"}</div>
                    </div>
                    {selectedLogoPreset ? (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Aile</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">{publisherFamilyLabel(selectedLogoPreset.family)}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "advanced" ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Ton</div>
            <ChoiceGrid
              values={TONES}
              selected={draft.tone}
              labelFor={(value) => toneLabel(value, draft.language)}
              descriptionFor={(value) => TONE_DESCRIPTIONS[value]}
              onSelect={(value) => onUpdate({ tone: value })}
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Derinlik</div>
            <ChoiceGrid
              values={DEPTHS}
              selected={draft.depth}
              labelFor={(value) => depthLabel(value, draft.language)}
              descriptionFor={(value) => DEPTH_DESCRIPTIONS[value]}
              onSelect={(value) => onUpdate({ depth: value })}
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Kapak yönü</div>
            <ChoiceGrid
              values={COVER_DIRECTIONS}
              selected={draft.coverDirection}
              labelFor={(value) => coverDirectionLabel(value, draft.language)}
              descriptionFor={(value) => COVER_DESCRIPTIONS[value]}
              onSelect={(value) => onUpdate({ coverDirection: value })}
              columns="md:grid-cols-2"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button variant="ghost" size="lg" onClick={onBack}>
          Geri
        </Button>
        <Button size="lg" onClick={onNext}>
          Ön İzlemeyi Hazırla
        </Button>
      </div>
    </div>
  );
}
