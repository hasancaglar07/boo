"use client";

import { Check, ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppFrame } from "@/components/app/app-frame";
import { GenerateAuthGateDialog } from "@/components/funnel/generate-auth-gate-dialog";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GenerateLoadingScreen } from "@/components/funnel/generate-loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackEventOnce } from "@/lib/analytics";
import {
  loadSettings,
  providerLooksReady,
  runWorkflow,
  saveBook,
  startBookPreviewPipeline,
} from "@/lib/dashboard-api";
import {
  bookTypeLabel,
  buildGuidedBookPayload,
  canOpenStep,
  CHAPTER_LENGTHS,
  CHAPTER_ROLES,
  clearPendingGenerateIntent,
  clearFunnelDraft,
  chapterLengthLabel,
  chapterRoleDescription,
  chapterRoleLabel,
  chapterWordRange,
  coverDirectionLabel,
  createDefaultFunnelDraft,
  enrichOutlineItems,
  depthLabel,
  FUNNEL_STEPS,
  isTurkishLanguage,
  BOOK_LENGTHS,
  bookLengthDescription,
  bookLengthLabel,
  languageDescription,
  languageLabel,
  loadPendingGenerateIntent,
  loadFunnelDraft,
  localOutlineSuggestions,
  localTitleSuggestions,
  nextStep,
  normalizeFunnelDraft,
  normalizeFunnelLanguage,
  previousStep,
  savePendingGenerateIntent,
  saveFunnelDraft,
  stepIndex,
  suggestedStyleProfile,
  SUPPORTED_LANGUAGES,
  toneLabel,
  outlineWordRange,
  workflowStyleLabel,
  workflowGenreLabel,
  workflowToneLabel,
  type FunnelBookType,
  type FunnelCoverDirection,
  type FunnelBookLength,
  type FunnelChapterLength,
  type FunnelChapterRole,
  type FunnelDepth,
  type FunnelDraft,
  type FunnelLanguage,
  type FunnelOutlineItem,
  type FunnelStep,
  type FunnelTone,
} from "@/lib/funnel-draft";
import { formatChapterReference } from "@/lib/book-language";
import { PUBLISHER_LOGO_PRESETS, pickRandomPublisherLogo } from "@/lib/publisher-logo-library";
import { getAccount, getPlan, getSession, getViewer, syncPreviewAuthState } from "@/lib/preview-auth";
import { cn } from "@/lib/utils";

const BOOK_TYPES: FunnelBookType[] = ["rehber", "is", "egitim", "cocuk", "diger"];
const TONES: FunnelTone[] = ["clear", "professional", "warm", "inspiring"];
const DEPTHS: FunnelDepth[] = ["hizli", "dengeli", "detayli"];
const COVER_DIRECTIONS: FunnelCoverDirection[] = ["editorial", "tech", "minimal", "energetic"];
const GENERATION_STAGES = [
  "Kitap yapısı hazırlanıyor",
  "Başlık ve outline kaydediliyor",
  "Önizleme bölümleri hazırlanıyor",
  "Kilitli bölümler düzenleniyor",
  "Preview ekranı açılıyor",
] as const;

const BOOK_TYPE_DESCRIPTIONS: Record<FunnelBookType, string> = {
  rehber: "Adım adım öğreten, net ve uygulanabilir akış.",
  is: "Uzmanlık, danışmanlık veya marka otoritesi için güçlü kurgu.",
  egitim: "Öğretici, örnekli ve daha sistemli anlatım.",
  cocuk: "Daha sıcak, ritimli ve sade anlatım düzeni.",
  diger: "Özel konu veya hibrit kurgular için esnek alan.",
};

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

const RANDOM_COVER_BRIEFS = [
  "Premium guide edition",
  "Strategy • Systems • Clarity",
  "Practical framework",
  "Field guide edition",
  "Build • Learn • Apply",
  "Blueprint for growth",
] as const;

const STYLE_COPY_BY_LANGUAGE: Partial<
  Record<
    FunnelLanguage,
    {
      authors: string[];
      briefs: string[];
      bios: string[];
    }
  >
> = {
  Turkish: {
    authors: ["Deniz Aksoy", "Cemre Yalçın", "Mert Aydın"],
    briefs: [
      "Net strateji • Güçlü anlatım • Uygulanabilir rehber",
      "Açık sistemler • Profesyonel ton • Raf kalitesi",
      "Pratik akış • Güçlü yapı • Editoryal denge",
    ],
    bios: [
      "{topic} alanında çalışan bağımsız yazar ve yayın üreticisi. Karmaşık bilgiyi okunabilir ve uygulanabilir kitaplara dönüştürür.",
      "{topic} odaklı rehberler üreten editoryal yazar. Net sistemler, güçlü akış ve güven veren anlatım üzerine çalışır.",
    ],
  },
  English: {
    authors: ["Clara Bennett", "Noah Carter", "Elena Brooks"],
    briefs: [
      "Clear strategy • Practical systems • Editorial finish",
      "Structured guidance • Strong voice • Professional flow",
      "Readable framework • Premium tone • Practical depth",
    ],
    bios: [
      "Independent author and publishing maker working on {topic}. Turns complex ideas into clear, practical books with an editorial finish.",
      "Writer and editorial builder focused on {topic}. Creates readable systems, strong positioning, and shelf-ready non-fiction.",
    ],
  },
  German: {
    authors: ["Leonie Hartmann", "Jonas Keller", "Mila Becker"],
    briefs: [
      "Klare Struktur • Praxistiefe • Editorialer Ton",
      "Deutliche Führung • Starke Ordnung • Professioneller Stil",
    ],
    bios: [
      "Unabhängige:r Autor:in und Publishing-Maker im Bereich {topic}. Verdichtet komplexes Wissen zu klaren, anwendbaren Büchern.",
    ],
  },
  French: {
    authors: ["Camille Laurent", "Élodie Martin", "Lucas Fournier"],
    briefs: [
      "Clarté éditoriale • Système net • Guide pratique",
      "Structure lisible • Ton fort • Finition éditoriale",
    ],
    bios: [
      "Auteur indépendant et artisan éditorial autour de {topic}. Transforme des idées complexes en livres clairs et utiles.",
    ],
  },
  Spanish: {
    authors: ["Lucía Navarro", "Daniel Ortega", "Sofía Romero"],
    briefs: [
      "Estrategia clara • Sistema práctico • Acabado editorial",
      "Guía sólida • Voz profesional • Flujo legible",
    ],
    bios: [
      "Autor independiente y creador editorial en {topic}. Convierte conocimiento complejo en libros claros y aplicables.",
    ],
  },
  Italian: {
    authors: ["Giulia Moretti", "Luca Rinaldi", "Elisa Conti"],
    briefs: [
      "Struttura chiara • Taglio pratico • Finitura editoriale",
      "Guida leggibile • Voce forte • Qualità editoriale",
    ],
    bios: [
      "Autore indipendente e progettista editoriale su {topic}. Trasforma contenuti complessi in libri chiari e utili.",
    ],
  },
  Portuguese: {
    authors: ["Beatriz Silva", "Miguel Duarte", "Inês Rocha"],
    briefs: [
      "Estratégia clara • Sistema prático • Acabamento editorial",
      "Leitura fluida • Estrutura forte • Tom profissional",
    ],
    bios: [
      "Autor independente e criador editorial em {topic}. Transforma conhecimento complexo em livros claros e aplicáveis.",
    ],
  },
  Dutch: {
    authors: ["Sanne de Vries", "Milan Jansen", "Lotte Visser"],
    briefs: [
      "Duidelijke structuur • Praktische aanpak • Redactionele afwerking",
      "Heldere flow • Sterke toon • Professionele gids",
    ],
    bios: [
      "Onafhankelijke auteur en editorial maker rond {topic}. Zet complexe kennis om in heldere, bruikbare boeken.",
    ],
  },
  Polish: {
    authors: ["Zofia Kowalska", "Jan Nowak", "Maja Zielinska"],
    briefs: [
      "Jasna struktura • Praktyczne wskazówki • Editorialny styl",
      "Mocny układ • Czytelny ton • Profesjonalne wykończenie",
    ],
    bios: [
      "Niezależny autor i twórca redakcyjny w obszarze {topic}. Przekłada złożoną wiedzę na czytelne i praktyczne książki.",
    ],
  },
  Romanian: {
    authors: ["Ana Ionescu", "Matei Popescu", "Ilinca Radu"],
    briefs: [
      "Structură clară • Sistem practic • Finisaj editorial",
      "Ghid lizibil • Ton profesionist • Flux puternic",
    ],
    bios: [
      "Autor independent și creator editorial în zona {topic}. Transformă idei complexe în cărți clare și aplicabile.",
    ],
  },
  Swedish: {
    authors: ["Elsa Lindberg", "Noah Berg", "Maja Nystrom"],
    briefs: [
      "Tydlig struktur • Praktisk vagledning • Redaktionell ton",
      "Klar rytm • Stark guide • Professionell finish",
    ],
    bios: [
      "Oberoende forfattare och editorial maker inom {topic}. Gor komplex kunskap tydlig, anvandbar och bokmogen.",
    ],
  },
  Danish: {
    authors: ["Freja Madsen", "Emil Nielsen", "Clara Holm"],
    briefs: [
      "Klar struktur • Praktisk guide • Redaktionel finish",
      "Stark opbygning • Rolig tone • Professionelt udtryk",
    ],
    bios: [
      "Uafhaengig forfatter og editorial maker inden for {topic}. Gorer kompleks viden klar og anvendelig i bogform.",
    ],
  },
  Norwegian: {
    authors: ["Ingrid Solberg", "Magnus Dahl", "Emma Lunde"],
    briefs: [
      "Tydelig struktur • Praktisk veiledning • Redaksjonell finish",
      "Lesbar flyt • Profesjonell tone • Sterk guide",
    ],
    bios: [
      "Uavhengig forfatter og editorial maker innen {topic}. Gjør kompleks kunnskap tydelig og anvendelig i bokform.",
    ],
  },
  Finnish: {
    authors: ["Aino Virtanen", "Elias Korhonen", "Ella Laine"],
    briefs: [
      "Selkea rakenne • Kaytannon opas • Editorial viimeistely",
      "Vahva rytmi • Luettava virta • Ammattimainen saavy",
    ],
    bios: [
      "Itsenainen kirjoittaja ja editorial maker aiheessa {topic}. Muuttaa monimutkaisen tiedon selkeiksi ja kaytannollisiksi kirjoiksi.",
    ],
  },
  Czech: {
    authors: ["Ema Novakova", "Jakub Svoboda", "Tereza Dvorakova"],
    briefs: [
      "Jasna struktura • Prakticky pristup • Redakcni styl",
      "Silny rytmus • Citelny ton • Profesionalni finish",
    ],
    bios: [
      "Nezavisly autor a editorial maker v oblasti {topic}. Pretvari slozite znalosti do jasnych a pouzitelnych knih.",
    ],
  },
  Slovak: {
    authors: ["Nina Kovacova", "Tomas Urban", "Ela Hruskova"],
    briefs: [
      "Jasna struktura • Prakticke vedenie • Redakcny styl",
      "Silny tok • Profesionálny ton • Citatelny sprievodca",
    ],
    bios: [
      "Nezavisly autor a editorial maker v oblasti {topic}. Premiena komplexne poznatky na jasne a pouzitelne knihy.",
    ],
  },
  Hungarian: {
    authors: ["Lili Horvath", "Mate Szabo", "Anna Varga"],
    briefs: [
      "Tiszta szerkezet • Gyakorlati utmutato • Szerkesztoi hang",
      "Eros ritmus • Olvashato vezetes • Professzionalis finish",
    ],
    bios: [
      "{topic} teruleten dolgozo fuggetlen szerzo es editorial maker. Az osszetett tudast tiszta, hasznalhato konyvekké alakitja.",
    ],
  },
  Greek: {
    authors: ["Ελένη Παππά", "Νίκος Ανδρέου", "Μαρία Θεοδώρου"],
    briefs: [
      "Καθαρή δομή • Πρακτικός οδηγός • Εκδοτική αισθητική",
      "Ισχυρή ροή • Επαγγελματικός τόνος • Καθαρή καθοδήγηση",
    ],
    bios: [
      "Ανεξάρτητος συγγραφέας και editorial maker στο {topic}. Μετατρέπει σύνθετη γνώση σε καθαρά και χρήσιμα βιβλία.",
    ],
  },
  Russian: {
    authors: ["Анна Волкова", "Илья Смирнов", "Мария Орлова"],
    briefs: [
      "Четкая структура • Практичный подход • Редакционный стиль",
      "Сильный ритм • Понятный тон • Профессиональная подача",
    ],
    bios: [
      "Независимый автор и editorial maker в сфере {topic}. Превращает сложные знания в ясные и полезные книги.",
    ],
  },
  Ukrainian: {
    authors: ["Олена Мельник", "Артем Шевченко", "Марія Коваль"],
    briefs: [
      "Чітка структура • Практичний підхід • Редакційний стиль",
      "Сильний ритм • Зрозумілий тон • Професійна подача",
    ],
    bios: [
      "Незалежний автор та editorial maker у сфері {topic}. Перетворює складні знання на зрозумілі й корисні книги.",
    ],
  },
  Arabic: {
    authors: ["ليلى خوري", "عمر ناصر", "سارة حداد"],
    briefs: [
      "هيكل واضح • دليل عملي • لمسة تحريرية",
      "تدفق قوي • نبرة مهنية • بناء مقروء",
    ],
    bios: [
      "كاتب مستقل وصانع نشر يعمل في مجال {topic}. يحول المعرفة المعقدة إلى كتب واضحة وعملية.",
    ],
  },
  Japanese: {
    authors: ["佐藤 美月", "高橋 蓮", "中村 葵"],
    briefs: [
      "明快な構成 • 実践的ガイド • エディトリアル品質",
      "読みやすい流れ • 強い整理 • プロ品質",
    ],
    bios: [
      "{topic} 分野で活動する独立系ライター兼エディトリアルメーカー。複雑な知識を読みやすく実用的な本に整えます。",
    ],
  },
  Hindi: {
    authors: ["आन्या शर्मा", "आरव मेहता", "सिया वर्मा"],
    briefs: [
      "स्पष्ट संरचना • व्यावहारिक मार्गदर्शन • संपादकीय गुणवत्ता",
      "मजबूत प्रवाह • पेशेवर स्वर • साफ दिशा",
    ],
    bios: [
      "{topic} पर काम करने वाले स्वतंत्र लेखक और एडिटोरियल मेकर। जटिल ज्ञान को स्पष्ट और उपयोगी पुस्तकों में बदलते हैं।",
    ],
  },
  Indonesian: {
    authors: ["Alya Pratama", "Raka Putra", "Nadia Lestari"],
    briefs: [
      "Struktur jelas • Panduan praktis • Sentuhan editorial",
      "Alur kuat • Nada profesional • Hasil rapi",
    ],
    bios: [
      "Penulis independen dan editorial maker di bidang {topic}. Mengubah pengetahuan kompleks menjadi buku yang jelas dan berguna.",
    ],
  },
  Malay: {
    authors: ["Aisyah Rahman", "Adam Hakim", "Sofia Zulkifli"],
    briefs: [
      "Struktur jelas • Panduan praktikal • Sentuhan editorial",
      "Aliran kuat • Nada profesional • Kemasan kemas",
    ],
    bios: [
      "Penulis bebas dan editorial maker dalam bidang {topic}. Menjadikan pengetahuan kompleks sebagai buku yang jelas dan berguna.",
    ],
  },
};

function normalizeRouteBase(routeBase: string) {
  const normalized = routeBase.trim().replace(/\/+$/, "");
  return normalized || "/start";
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

function defaultAudience(language: FunnelLanguage) {
  return isTurkishLanguage(language) ? "genel okur" : "general readers";
}

function defaultChapterReference(language: FunnelLanguage, number: number) {
  return formatChapterReference(language, number);
}

function randomCoverBrief() {
  return RANDOM_COVER_BRIEFS[Math.floor(Math.random() * RANDOM_COVER_BRIEFS.length)];
}

function getProfilePublisherBrand() {
  const account = getAccount();
  const planId = getPlan();
  if (planId !== "pro") return null;

  const imprint = String(account.publisherImprint || "").trim();
  const logoUrl = String(account.publisherLogoUrl || "").trim();
  if (!imprint && !logoUrl) return null;

  return {
    imprint: imprint || "Studio Press",
    logoText: imprint || "Studio Press",
    logoUrl,
  };
}

function randomFrom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function styleCopyForLanguage(language: FunnelLanguage) {
  return STYLE_COPY_BY_LANGUAGE[language] || STYLE_COPY_BY_LANGUAGE.English!;
}

function fallbackTopicLabel(language: FunnelLanguage) {
  if (isTurkishLanguage(language)) {
    return "uzmanlık alanı";
  }
  return languageLabel(language);
}

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

function formatWordCount(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));
}

function buildRandomStyleCopy(draft: FunnelDraft) {
  const copy = styleCopyForLanguage(draft.language);
  const topic = draft.topic.trim() || fallbackTopicLabel(draft.language);
  return {
    authorName: randomFrom(copy.authors),
    coverBrief: randomFrom(copy.briefs),
    authorBio: randomFrom(copy.bios).replace("{topic}", topic),
  };
}

function firstAllowedStep(draft: FunnelDraft, desired: FunnelStep) {
  const targetIndex = stepIndex(desired);
  for (let index = targetIndex; index >= 0; index -= 1) {
    const candidate = FUNNEL_STEPS[index];
    if (canOpenStep(draft, candidate)) return candidate;
  }
  return "topic";
}

function SummaryCards({ draft }: { draft: FunnelDraft }) {
  const items = [
    { label: "Konu", value: draft.topic || "Henüz seçilmedi" },
    { label: "Başlık", value: draft.title || "Henüz seçilmedi" },
    { label: "Yazar", value: draft.authorName || "Henüz girilmedi" },
    { label: "Branding", value: draft.logoText || draft.imprint || "Henüz girilmedi" },
    { label: "Okur", value: draft.audience || "Henüz seçilmedi" },
    { label: "Dil", value: languageLabel(draft.language) },
    { label: "Bölümler", value: draft.outline.length ? `${draft.outline.length} bölüm` : "Henüz oluşturulmadı" },
    { label: "Stil", value: `${toneLabel(draft.tone, draft.language)} • ${depthLabel(draft.depth, draft.language)}` },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] border border-border/80 bg-background/74 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</div>
          <div className="mt-2 text-[15px] font-medium leading-7 text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function LiveBookCard({ draft }: { draft: FunnelDraft }) {
  const displayTitle = draft.title || "Kitabının adı burada görünecek";
  const displaySubtitle =
    draft.subtitle ||
    "Başlık, alt başlık ve kapak yönü ilerledikçe burada daha net bir kitap hissi oluşturur.";
  const displayBrand = draft.logoText || draft.imprint || "Wordmark";
  const displayAuthor = draft.authorName || "Yazar adı";

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/80 bg-[radial-gradient(circle_at_top,_rgba(188,104,67,0.18),_transparent_34%),linear-gradient(180deg,_#261c16_0%,_#523629_52%,_#b96a42_100%)] p-6 text-white shadow-[0_24px_48px_rgba(37,27,20,0.18)]">
      <div className="flex items-center justify-between gap-3">
        {draft.logoUrl ? (
          <img
            src={draft.logoUrl}
            alt={`${displayBrand} logosu`}
            className="h-12 w-auto max-w-[190px] object-contain"
          />
        ) : (
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
            {displayBrand}
          </div>
        )}
      </div>
      <div className="mt-12">
        <div className="max-w-[12ch] text-3xl font-semibold leading-[1.02] md:text-4xl">{displayTitle}</div>
        <div className="mt-4 max-w-[28ch] text-sm leading-7 text-white/82">{displaySubtitle}</div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {draft.coverBrief ? (
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
            {draft.coverBrief}
          </span>
        ) : null}
        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
          {coverDirectionLabel(draft.coverDirection, draft.language)}
        </span>
        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
          {toneLabel(draft.tone, draft.language)}
        </span>
      </div>
      <div className="mt-10 text-sm font-medium tracking-[0.14em] text-white/82 uppercase">{displayAuthor}</div>
    </div>
  );
}

function ChoiceGrid<T extends string>({
  values,
  selected,
  labelFor,
  descriptionFor,
  onSelect,
  columns = "sm:grid-cols-2",
}: {
  values: T[];
  selected: T;
  labelFor: (value: T) => string;
  descriptionFor?: (value: T) => string;
  onSelect: (value: T) => void;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-3", columns)}>
      {values.map((value) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            className={cn(
              "group relative min-h-[76px] rounded-[22px] border px-5 py-5 text-left outline-none",
              "transition-all duration-150 ease-out",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              isSelected
                ? "scale-[1.02] border-primary/50 bg-primary/10 shadow-[0_4px_16px_rgba(var(--primary),0.12)] ring-1 ring-primary/25"
                : "border-border bg-background/72 hover:scale-[1.01] hover:border-primary/30 hover:bg-accent/70 hover:shadow-md active:scale-[0.995]",
            )}
            onClick={() => onSelect(value)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[15px] font-semibold leading-snug transition-colors duration-150",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-foreground",
                )}>
                  {labelFor(value)}
                </div>
                {descriptionFor ? (
                  <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{descriptionFor(value)}</div>
                ) : null}
              </div>
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-card text-transparent group-hover:border-primary/30",
                )}
              >
                <Check className={cn("size-3.5 transition-all duration-150", isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75")} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function GuidedWizardScreen({
  step,
  routeBase = "/start",
  shellMode = "funnel",
}: {
  step: FunnelStep;
  routeBase?: string;
  shellMode?: "funnel" | "app";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<FunnelDraft>(() => createDefaultFunnelDraft());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [titleOptions, setTitleOptions] = useState<Array<{ title: string; subtitle: string }>>([]);
  const [aiLoading, setAiLoading] = useState<"" | "title" | "outline" | "style" | "generate">("");
  const [generationStageIndex, setGenerationStageIndex] = useState(0);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const autoFillRef = useRef({ title: false, outline: false, style: false });
  const topicPrefillRef = useRef(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const resumeAttemptRef = useRef(false);
  const normalizedRouteBase = normalizeRouteBase(routeBase);
  const appShellEnabled = shellMode === "app";
  const profileBrand = getProfilePublisherBrand();
  const shouldResumeGenerate = searchParams.get("resume") === "1";

  function stepHref(target: FunnelStep) {
    return `${normalizedRouteBase}/${target}`;
  }

  function generateResumePath() {
    return `${stepHref("generate")}?resume=1`;
  }

  function makePendingGenerateIntent(
    authMethod?: "google" | "magic" | "credentials" | null,
    authMode?: "login" | "register" | null,
  ) {
    return {
      source: "start_generate" as const,
      draftId: draft.id,
      step: "generate" as const,
      resumePath: generateResumePath(),
      createdAt: new Date().toISOString(),
      authMethod: authMethod || null,
      authMode: authMode || null,
    };
  }

  function usageBillingHref(reason?: string | null) {
    return `/app/settings/billing?intent=start-book${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;
  }

  function maybeRouteToUsageGate(
    usage = getViewer()?.usage,
  ) {
    if (!usage || usage.canStartBook) {
      return false;
    }
    clearPendingGenerateIntent();
    setAuthGateOpen(false);
    trackEvent("second_book_gate_viewed", {
      source: appShellEnabled ? "app_new_generate" : "start_generate",
      reason: usage.reason || "unknown",
    });
    router.push(usageBillingHref(usage.reason));
    return true;
  }

  function openGenerateAuthGate() {
    savePendingGenerateIntent(makePendingGenerateIntent());
    setAuthGateOpen(true);
    trackEvent("generate_auth_gate_viewed", {
      source: appShellEnabled ? "app_new_generate" : "start_generate",
      language: draft.language,
    });
  }

  function handleAuthGateOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setAuthGateOpen(true);
      return;
    }

    const intent = loadPendingGenerateIntent();
    if (!intent?.authMethod) {
      clearPendingGenerateIntent();
    }

    setAuthGateOpen(false);
    trackEvent("generate_auth_gate_closed", {
      source: appShellEnabled ? "app_new_generate" : "start_generate",
      method: intent?.authMethod || "none",
    });
  }

  function handleAuthGateMethodSelected(input: {
    method: "google" | "magic" | "credentials";
    mode: "login" | "register";
  }) {
    savePendingGenerateIntent(makePendingGenerateIntent(input.method, input.mode));
  }

  useEffect(() => {
    const stored = normalizeFunnelDraft(loadFunnelDraft());
    const allowedStep = firstAllowedStep(stored, step);
    if (allowedStep !== step) {
      router.replace(stepHref(allowedStep));
      return;
    }
    const account = getAccount();
    const nextDraft = {
      ...stored,
      currentStep: step,
      authorName: stored.authorName || account.name || "",
      imprint: stored.imprint || "Book Generator",
    };
    setDraft(nextDraft);
    saveFunnelDraft(nextDraft);
    setReady(true);
  }, [router, step, normalizedRouteBase]);

  useEffect(() => {
    if (!ready) return;
    saveFunnelDraft({ ...draft, currentStep: step });
  }, [draft, ready, step]);

  useEffect(() => {
    if (!ready || step !== "topic" || topicPrefillRef.current) return;
    topicPrefillRef.current = true;
    const topic = (searchParams.get("topic") || "").trim();
    const audience = (searchParams.get("audience") || "").trim();
    const language = normalizeFunnelLanguage(searchParams.get("language") || undefined);
    const bookType = searchParams.get("bookType");
    if (!topic && !audience && !bookType && !searchParams.get("language")) return;
    setDraft((current) => ({
      ...current,
      topic: current.topic.trim() || topic,
      audience: current.audience.trim() || audience,
      language: current.topic.trim() || current.audience.trim() ? current.language : language,
      bookType:
        current.topic.trim() || current.audience.trim()
          ? current.bookType
          : bookType === "rehber" || bookType === "is" || bookType === "egitim" || bookType === "cocuk" || bookType === "diger"
            ? bookType
            : current.bookType,
      updatedAt: new Date().toISOString(),
    }));
  }, [ready, searchParams, step]);

  useEffect(() => {
    if (step === "topic") {
      const source = appShellEnabled ? "app_new_topic" : "start_topic";
      trackEventOnce("wizard_started", { source }, { key: `wizard_started:${source}`, ttlMs: 15_000 });
    }
  }, [appShellEnabled, step]);

  useEffect(() => {
    if (aiLoading !== "generate") {
      setGenerationStageIndex(0);
      return;
    }

    setGenerationStageIndex(0);
    const timer = window.setInterval(() => {
      setGenerationStageIndex((current) => Math.min(GENERATION_STAGES.length - 1, current + 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [aiLoading]);

  useEffect(() => {
    if (step !== "generate") {
      setAuthGateOpen(false);
    }
  }, [step]);

  useEffect(() => {
    if (!ready || step !== "generate" || !shouldResumeGenerate || resumeAttemptRef.current) {
      return;
    }

    const intent = loadPendingGenerateIntent();
    if (!intent || intent.draftId !== draft.id || intent.resumePath !== generateResumePath()) {
      return;
    }

    resumeAttemptRef.current = true;

    void (async () => {
      const authState = await syncPreviewAuthState().catch(() => null);
      const hasSession = Boolean(authState?.authenticated || getSession());
      if (!hasSession) {
        resumeAttemptRef.current = false;
        return;
      }

      if (maybeRouteToUsageGate(authState?.usage || getViewer()?.usage)) {
        return;
      }

      trackEvent("generate_auth_gate_completed", {
        method: intent.authMethod || "resume",
        mode: intent.authMode || "register",
      });
      trackEvent("generate_auth_gate_resumed", {
        method: intent.authMethod || "resume",
      });

      await runGenerateAfterAuth();
    })();
  }, [draft.id, ready, searchParams, shouldResumeGenerate, step]);

  const summary = useMemo(
    () => [
      { label: "Konu", value: draft.topic || "Henüz seçilmedi" },
      { label: "Başlık", value: draft.title || "Henüz seçilmedi" },
      { label: "Yazar", value: draft.authorName || "Henüz girilmedi" },
      { label: "Dil", value: languageLabel(draft.language) },
      { label: "Uzunluk", value: bookLengthLabel(draft.bookLength, draft.language) },
      { label: "Bölümler", value: draft.outline.length ? `${draft.outline.length} bölüm` : "Henüz oluşturulmadı" },
    ],
    [draft],
  );

  const outlineWordEstimate = useMemo(
    () => outlineWordRange(draft.outline.length ? draft.outline : localOutlineSuggestions(draft), draft.bookLength),
    [draft],
  );

  function updateDraft(changes: Partial<FunnelDraft>) {
    setDraft((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }));
    setError("");
  }

  function updateOutline(index: number, changes: Partial<FunnelOutlineItem>) {
    setDraft((current) => ({
      ...current,
      outline: current.outline.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
      updatedAt: new Date().toISOString(),
    }));
    trackEvent("outline_manual_edited", { index });
  }

  function goBack() {
    const prev = previousStep(step);
    if (prev) router.push(stepHref(prev));
  }

  function goNext() {
    if (step === "topic") {
      if (!draft.topic.trim()) {
        setError("Konu boş bırakılamaz.");
        return;
      }
      trackEvent("wizard_topic_completed", { language: draft.language });
    }

    if (step === "title" && !draft.title.trim()) {
      setError("Başlık gerekli.");
      return;
    }

    if (step === "outline" && draft.outline.filter((item) => item.title.trim()).length < 3) {
      setError("En az 3 bölüm gerekli.");
      return;
    }

    const next = nextStep(step);
    if (next) router.push(stepHref(next));
  }

  async function handleTitleAi(forceReplace = false) {
    if (!draft.topic.trim()) {
      setError("Önce konuyu netleştir.");
      router.push(stepHref("topic"));
      return;
    }

    setAiLoading("title");
    try {
      const settings = await loadSettings().catch(() => null);
      let suggestions = localTitleSuggestions(draft);

      if (settings && providerLooksReady(settings)) {
        const response = await runWorkflow({
          action: "topic_suggest",
          topic: draft.topic,
          audience: draft.audience || defaultAudience(draft.language),
          category: bookTypeLabel(draft.bookType),
        });
        const generatedPayload = response.generated as { titles?: Array<Record<string, unknown>> } | undefined;
        const generated = Array.isArray(generatedPayload?.titles) ? generatedPayload.titles : [];
        if (generated.length) {
          suggestions = generated.map((item) => ({
            title: String(item.title || "").trim(),
            subtitle: String(item.subtitle || "").trim(),
          }));
        }
      }

      setTitleOptions(suggestions.filter((item) => item.title));
      if ((forceReplace || !draft.title.trim()) && suggestions[0]) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { language: draft.language });
    } catch {
      const suggestions = localTitleSuggestions(draft);
      setTitleOptions(suggestions);
      if (suggestions[0] && (forceReplace || !draft.title.trim())) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { fallback: true });
    } finally {
      setAiLoading("");
    }
  }

  async function handleSubtitleAi() {
    if (!titleOptions.length) {
      await handleTitleAi();
      return;
    }
    const nextOption = titleOptions.find((item) => item.subtitle && item.subtitle !== draft.subtitle) || titleOptions[0];
    updateDraft({ subtitle: nextOption.subtitle });
    trackEvent("subtitle_ai_used", { language: draft.language });
  }

  async function handleOutlineAi() {
    if (!draft.topic.trim()) {
      setError("Önce konuyu belirle.");
      router.push(stepHref("topic"));
      return;
    }

    setAiLoading("outline");
    try {
      const settings = await loadSettings().catch(() => null);
      let chapters = localOutlineSuggestions(draft);
      let maybeTitle = draft.title;
      let maybeSubtitle = draft.subtitle;

      if (settings && providerLooksReady(settings)) {
        const response = await runWorkflow({
          action: "outline_suggest",
          topic: draft.topic,
          title: draft.title,
          subtitle: draft.subtitle,
          language: draft.language,
          audience: draft.audience || defaultAudience(draft.language),
          genre: workflowGenreLabel(draft.bookType),
          style: workflowStyleLabel(draft.depth),
          tone: workflowToneLabel(draft.tone),
        });
        const generated = response.generated as
          | {
              title?: string;
              subtitle?: string;
              chapters?: Array<{ title?: string; summary?: string }>;
            }
          | undefined;
        if (generated?.chapters?.length) {
          chapters = enrichOutlineItems(
            generated.chapters.map((item, index) => ({
              title: String(item.title || defaultChapterReference(draft.language, index + 1)).trim(),
              summary: String(item.summary || "").trim(),
            })),
            draft,
          );
          maybeTitle = String(generated.title || maybeTitle || "").trim();
          maybeSubtitle = String(generated.subtitle || maybeSubtitle || "").trim();
        }
      }

      updateDraft({
        title: maybeTitle || draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: maybeSubtitle || draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: chapters,
      });
      trackEvent("outline_ai_used", { language: draft.language, count: chapters.length });
    } catch {
      const fallback = localOutlineSuggestions(draft);
      updateDraft({
        title: draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: fallback,
      });
      trackEvent("outline_ai_used", { fallback: true, count: fallback.length });
    } finally {
      setAiLoading("");
    }
  }

  function applyRandomStyleProfile(forceReplace = false) {
    const style = suggestedStyleProfile(draft);
    const preset = pickRandomPublisherLogo();
    const localized = buildRandomStyleCopy(draft);
    updateDraft({
      ...style,
      authorName: forceReplace ? localized.authorName : draft.authorName || getAccount().name || localized.authorName,
      imprint: forceReplace ? preset.imprint : draft.imprint && draft.imprint !== "Book Generator" ? draft.imprint : preset.imprint,
      logoText: forceReplace ? preset.mark : draft.logoText || preset.mark,
      logoUrl: forceReplace ? preset.url : draft.logoUrl || preset.url,
      coverBrief: forceReplace ? localized.coverBrief : draft.coverBrief || localized.coverBrief || randomCoverBrief(),
      authorBio: forceReplace ? localized.authorBio : draft.authorBio || localized.authorBio,
    });
    return style;
  }

  function handleStyleAi() {
    const style = applyRandomStyleProfile(true);
    setAiLoading("style");
    trackEvent("style_ai_used", {
      tone: style.tone,
      depth: style.depth,
      cover: style.coverDirection,
    });
    window.setTimeout(() => setAiLoading(""), 400);
  }

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Yalnızca görsel dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Logo dosyası 4 MB'den küçük olmalı.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateDraft({ logoUrl: dataUrl });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Logo yüklenemedi.");
    }
  }

  useEffect(() => {
    if (!ready || step !== "title" || autoFillRef.current.title) return;
    autoFillRef.current.title = true;
    const local = localTitleSuggestions(draft);
    if (!draft.title.trim() && local[0]) {
      setTitleOptions(local);
      updateDraft({ title: local[0].title, subtitle: local[0].subtitle || draft.subtitle });
    } else if (!titleOptions.length) {
      setTitleOptions(local);
    }
    if (!draft.topic.trim()) return;
    void handleTitleAi(true);
  }, [ready, step]);

  useEffect(() => {
    if (!ready || step !== "outline" || autoFillRef.current.outline) return;
    autoFillRef.current.outline = true;
    if (!draft.outline.length) {
      updateDraft({
        title: draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: localOutlineSuggestions(draft),
      });
    }
    if (!draft.topic.trim()) return;
    void handleOutlineAi();
  }, [ready, step]);

  useEffect(() => {
    if (!ready || step !== "style" || autoFillRef.current.style) return;
    autoFillRef.current.style = true;
    applyRandomStyleProfile(false);
  }, [ready, step]);

  async function runGenerateAfterAuth() {
    if (aiLoading === "generate") {
      return;
    }

    setAiLoading("generate");
    setError("");
    setPendingRedirect("");
    setAuthGateOpen(false);
    clearPendingGenerateIntent();

    try {
      const account = getAccount();
      const payload = buildGuidedBookPayload(draft, account.name);
      const book = await saveBook(payload);
      if (!book) throw new Error("Kitap kaydedilemedi: sunucu geçersiz yanıt döndürdü.");

      const nextDraft = {
        ...draft,
        currentStep: "generate" as const,
        status: "generating" as const,
        generatedSlug: book.slug,
        updatedAt: new Date().toISOString(),
      };
      saveFunnelDraft(nextDraft);
      trackEvent("generate_started", { slug: book.slug });
      void startBookPreviewPipeline(book.slug).catch(() => undefined);

      // Store destination — GenerateLoadingScreen will navigate after its 5-second animation
      setPendingRedirect(`/app/book/${encodeURIComponent(book.slug)}/preview`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kitap oluşturulamadı. Lütfen tekrar dene.");
      setAiLoading("");
    }
    // Note: aiLoading stays "generate" until GenerateLoadingScreen completes
  }

  async function requestGenerate(trigger: "manual" | "inline_auth" = "manual") {
    if (aiLoading === "generate") {
      return;
    }

    setError("");

    if (trigger === "manual") {
      trackEvent("wizard_generate_clicked", {
        language: draft.language,
        chapter_count: draft.outline.length,
      });
    }

    const authState = await syncPreviewAuthState().catch(() => null);
    const hasSession = Boolean(authState?.authenticated || getSession());

    if (!hasSession) {
      openGenerateAuthGate();
      return;
    }

    if (maybeRouteToUsageGate(authState?.usage || getViewer()?.usage)) {
      return;
    }

    await runGenerateAfterAuth();
  }

  if (!ready) return null;

  function wrapInShell(input: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) {
    const shell = (
      <FunnelShell
        step={step}
        title={input.title}
        description={input.description}
        summary={summary}
        mode={appShellEnabled ? "embedded" : "funnel"}
      >
        {input.children}
      </FunnelShell>
    );

    if (!appShellEnabled) {
      return shell;
    }

    return (
      <AppFrame current="new" title="Yeni Kitap" books={[]} showBookShelf={false}>
        {shell}
      </AppFrame>
    );
  }

  // ── TOPIC ──────────────────────────────────────────────────────────────────
  if (step === "topic") {
    return wrapInShell({
      title: "Kitabın konusu ne?",
      description: "Bir fikir yazman yeterli. Bu adımdan sonra başlık, outline ve preview akışı onun etrafında kurulur.",
      children: (
        <div className="space-y-8">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-border/80 bg-background/72 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Bu adımda senden
              </div>
              <div className="mt-2 text-sm leading-6 text-foreground">
                Sadece konu, okur ve kitap tipi isteriz. Boş sayfayla kalmazsın.
              </div>
            </div>
            <div className="rounded-[20px] border border-border/80 bg-background/72 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Sonraki çıktı
              </div>
              <div className="mt-2 text-sm leading-6 text-foreground">
                Başlık önerileri ve bölüm planı otomatik gelir, istersen elle düzenlersin.
              </div>
            </div>
            <div className="rounded-[20px] border border-primary/20 bg-primary/5 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Hedef
              </div>
              <div className="mt-2 text-sm leading-6 text-foreground">
                Preview'ı hızlı gösterip tam kitabı unlock etmeye değer olup olmadığını netleştirmek.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-semibold text-foreground">
              Konu
            </label>
            <Textarea
              id="topic"
              value={draft.topic}
              onChange={(event) => updateDraft({ topic: event.target.value })}
              placeholder="örnek: danışmanların uzmanlığını lead magnet ve authority book'a dönüştürme rehberi"
              rows={3}
              autoFocus
              className="resize-none text-base leading-7 placeholder:text-muted-foreground/60"
            />
            <p className="text-xs text-muted-foreground/70">
              Sorun, hedef okur ve vaat ne kadar netse çıkan outline o kadar iyi olur.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Kitap tipi</div>
            <ChoiceGrid
              values={BOOK_TYPES}
              selected={draft.bookType}
              labelFor={(value) => bookTypeLabel(value)}
              descriptionFor={(value) => BOOK_TYPE_DESCRIPTIONS[value]}
              onSelect={(value) => updateDraft({ bookType: value })}
              columns="md:grid-cols-2 xl:grid-cols-3"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audience" className="text-sm font-semibold text-foreground">
              Hedef okur <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
            </label>
            <Input
              id="audience"
              value={draft.audience}
              onChange={(event) => updateDraft({ audience: event.target.value })}
              placeholder="örnek: yeni başlayan oyuncular ve ebeveynler"
              className="h-12 text-base"
            />
          </div>

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" onClick={goNext}>
              Devam Et
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                updateDraft({
                  topic: draft.topic || "uzmanlığını kitaba dönüştürmek isteyen danışmanlar için authority book rehberi",
                  audience: draft.audience || "koçlar, danışmanlar ve course creator'lar",
                })
              }
            >
              Örnek Doldur
            </Button>
          </div>
        </div>
      ),
    });
  }

  // ── TITLE ──────────────────────────────────────────────────────────────────
  if (step === "title") {
    return wrapInShell({
      title: "Başlık ve alt başlık",
      description: "Kendin yaz ya da AI’dan öneri al.",
      children: (
        <div className="space-y-8">
          {!appShellEnabled ? <LiveBookCard draft={draft} /> : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleTitleAi()} isLoading={aiLoading === "title"}>
              <Sparkles className="mr-1.5 size-3.5" />
              Başlık öner
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleSubtitleAi()}>
              <Wand2 className="mr-1.5 size-3.5" />
              Alt başlık öner
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-foreground">
              Başlık
            </label>
            <Input
              id="title"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="örnek: Minecraft Oyun Rehberi"
              className="h-12 text-base font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subtitle" className="text-sm font-semibold text-foreground">
              Alt başlık <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
            </label>
            <Textarea
              id="subtitle"
              value={draft.subtitle}
              onChange={(event) => updateDraft({ subtitle: event.target.value })}
              placeholder="örnek: Hayatta kalma, inşa ve macera için başlangıçtan ileri seviyeye Türkçe rehber"
              rows={3}
              className="resize-none leading-7"
            />
          </div>

          {titleOptions.length ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">AI önerileri</div>
              <div className="grid gap-2">
                {titleOptions.slice(0, 4).map((option) => (
                  <button
                    key={`${option.title}-${option.subtitle}`}
                    type="button"
                    className="group rounded-[20px] border border-border/70 bg-background/72 px-4 py-4 text-left transition-all duration-150 hover:scale-[1.005] hover:border-primary/25 hover:bg-accent hover:shadow-sm active:scale-[0.998]"
                    onClick={() => updateDraft({ title: option.title, subtitle: option.subtitle })}
                  >
                    <div className="text-[15px] font-semibold text-foreground group-hover:text-foreground">{option.title}</div>
                    {option.subtitle ? (
                      <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{option.subtitle}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={goNext}>
              Bölümleri Kur
            </Button>
          </div>
        </div>
      ),
    });
  }

  // ── OUTLINE ────────────────────────────────────────────────────────────────
  if (step === "outline") {
    return wrapInShell({
      title: "Bölüm planı",
      description: "AI ile otomatik oluştur ya da kendin düzenle. En az 3 bölüm gerekli, ama hepsi aynı ritimde olmak zorunda değil.",
      children: (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[24px] border border-border/80 bg-background/72 p-5">
              <div className="text-sm font-semibold text-foreground">Kitap uzunluğu hedefi</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Gerçek kitaplarda açılış ve kapanış daha kısa, taşıyıcı bölümler daha güçlü olur. Burada toplam omurgayı belirle.
              </p>
              <div className="mt-4">
                <ChoiceGrid
                  values={BOOK_LENGTHS}
                  selected={draft.bookLength}
                  labelFor={(value) => bookLengthLabel(value, draft.language)}
                  descriptionFor={(value) => bookLengthDescription(value, draft.language)}
                  onSelect={(value) => updateDraft({ bookLength: value })}
                  columns="sm:grid-cols-3"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-primary/12 bg-primary/5 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Tahmini toplam hacim
              </div>
              <div className="mt-3 text-3xl font-semibold text-foreground">
                {formatWordCount(outlineWordEstimate.min)}-{formatWordCount(outlineWordEstimate.max)}
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {isTurkishLanguage(draft.language) ? "kelime" : "words"}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {isTurkishLanguage(draft.language)
                  ? "Bu sayı bölüm rollerine göre esnek dağılır; tüm bölümlerin aynı kelime bandında gitmesi hedeflenmez."
                  : "This estimate flexes by chapter role; the plan avoids forcing every chapter into the same band."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleOutlineAi()} isLoading={aiLoading === "outline"}>
              <Sparkles className="mr-1.5 size-3.5" />
              AI ile oluştur
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateDraft({
                  outline: [
                    ...draft.outline,
                    {
                      title: defaultChapterReference(draft.language, draft.outline.length + 1),
                      summary: isTurkishLanguage(draft.language) ? "Bu bölümün kısa amacı." : "Short purpose of this section.",
                      role: "core",
                      length: draft.bookLength === "extended" ? "long" : "medium",
                    },
                  ],
                });
                trackEvent("outline_manual_edited", { action: "add" });
              }}
            >
              + Bölüm ekle
            </Button>
          </div>

          <div className="space-y-3">
            {draft.outline.map((item, index) => (
              <div
                key={`${index}-${item.title}`}
                className="group relative rounded-[22px] border border-border/70 bg-card transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-0 p-4">
                  {/* Chapter number badge */}
                  <div className="mr-4 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <Input
                      id={`outline-title-${index}`}
                      value={item.title}
                      onChange={(event) => updateOutline(index, { title: event.target.value })}
                      placeholder="Bölüm başlığı"
                      className="h-10 font-medium"
                    />
                    <Textarea
                      id={`outline-summary-${index}`}
                      value={item.summary}
                      onChange={(event) => updateOutline(index, { summary: event.target.value })}
                      placeholder="Bu bölümde ne anlatılacak?"
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <div className="grid gap-3 pt-1 md:grid-cols-2">
                      <div className="space-y-1">
                        <label htmlFor={`outline-role-${index}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Bölüm rolü
                        </label>
                        <select
                          id={`outline-role-${index}`}
                          value={item.role}
                          onChange={(event) => updateOutline(index, { role: event.target.value as FunnelChapterRole })}
                          className="flex h-10 w-full rounded-[16px] border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                        >
                          {CHAPTER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {chapterRoleLabel(role, draft.language)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor={`outline-length-${index}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Bölüm derinliği
                        </label>
                        <select
                          id={`outline-length-${index}`}
                          value={item.length}
                          onChange={(event) => updateOutline(index, { length: event.target.value as FunnelChapterLength })}
                          className="flex h-10 w-full rounded-[16px] border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                        >
                          {CHAPTER_LENGTHS.map((length) => (
                            <option key={length} value={length}>
                              {chapterLengthLabel(length, draft.language)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-border/60 bg-background/70 px-3 py-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {formatWordCount(chapterWordRange(item.length, draft.bookLength).min)}-{formatWordCount(chapterWordRange(item.length, draft.bookLength).max)}{" "}
                        {isTurkishLanguage(draft.language) ? "kelime" : "words"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {chapterRoleDescription(item.role, draft.language)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 mt-0.5 h-8 w-8 shrink-0 p-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    disabled={draft.outline.length <= 3}
                    onClick={() => {
                      updateDraft({
                        outline: draft.outline.filter((_, itemIndex) => itemIndex !== index),
                      });
                      trackEvent("outline_manual_edited", { action: "remove", index });
                    }}
                    title="Sil"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={goNext}>
              Stili Seç
            </Button>
          </div>
        </div>
      ),
    });
  }

  // ── STYLE ──────────────────────────────────────────────────────────────────
  if (step === "style") {
    return wrapInShell({
      title: "Dil ve stil",
      description: "Bu ekran otomatik doldu. İstersen dili, markayı ve kapağın genel hissini burada değiştir.",
      children: (
        <div className="space-y-8">
          {!appShellEnabled ? <LiveBookCard draft={draft} /> : null}

          <div className="rounded-[22px] border border-border/80 bg-background/72 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-semibold text-foreground">AI stil paketi</div>
                <div className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Seçtiğin dile göre yazar adı, imprint, wordmark, kapak vurgu metni ve kısa biyografiyi otomatik üret.
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleStyleAi} isLoading={aiLoading === "style"}>
                <Sparkles className="mr-1.5 size-3.5" />
                AI ile oluştur
              </Button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="language" className="text-sm font-semibold text-foreground">Kitap dili</label>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <select
                  id="language"
                  value={draft.language}
                  onChange={(event) => updateDraft({ language: event.target.value as FunnelLanguage })}
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
            <div className="space-y-2">
              <label htmlFor="author-name" className="text-sm font-semibold text-foreground">Yazar adı</label>
              <Input
                id="author-name"
                value={draft.authorName}
                onChange={(event) => updateDraft({ authorName: event.target.value })}
                placeholder="örnek: İhsan Yılmaz"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imprint" className="text-sm font-semibold text-foreground">İmprint / yayınevi</label>
              <Input
                id="imprint"
                value={draft.imprint}
                onChange={(event) => updateDraft({ imprint: event.target.value })}
                placeholder="örnek: North Peak Books"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-text" className="text-sm font-semibold text-foreground">Logo / wordmark metni</label>
              <Input
                id="logo-text"
                value={draft.logoText}
                onChange={(event) => updateDraft({ logoText: event.target.value })}
                placeholder="örnek: IY Studio"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cover-brief" className="text-sm font-semibold text-foreground">Kapakta öne çıkan vurgu</label>
              <Input
                id="cover-brief"
                value={draft.coverBrief}
                onChange={(event) => updateDraft({ coverBrief: event.target.value })}
                placeholder="örnek: Survival • Build • Explore"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-url" className="text-sm font-semibold text-foreground">İstersen logo URL de ekleyebilirsin</label>
              <Input
                id="logo-url"
                value={draft.logoUrl.startsWith("data:image/") ? "" : draft.logoUrl}
                onChange={(event) => updateDraft({ logoUrl: event.target.value })}
                placeholder="örnek: https://site.com/logo.png"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="author-bio" className="text-sm font-semibold text-foreground">Kısa yazar biyografisi</label>
            <Textarea
              id="author-bio"
              rows={3}
              value={draft.authorBio}
              onChange={(event) => updateDraft({ authorBio: event.target.value })}
              placeholder="örnek: Oyun rehberleri ve yapay zeka destekli yayıncılık üzerine çalışan bağımsız yazar."
              className="resize-none leading-7"
            />
          </div>

          <div className="space-y-4 rounded-[24px] border border-border/80 bg-background/72 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-semibold text-foreground">Yayın evi logosu</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">
                  Hazır yayın evi wordmark’larından birini seçebilir ya da kendi logonu yükleyebilirsin.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleLogoUpload(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const preset = pickRandomPublisherLogo();
                    updateDraft({
                      imprint: preset.imprint,
                      logoText: preset.mark,
                      logoUrl: preset.url,
                    });
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
                      updateDraft({
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
            </div>

            <div className="grid max-h-[320px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {PUBLISHER_LOGO_PRESETS.map((preset) => {
                const selected = draft.logoUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn(
                      "rounded-[20px] border p-4 text-left transition",
                      selected ? "border-primary/40 bg-primary/8 ring-1 ring-primary/20" : "border-border/80 bg-card hover:border-primary/20 hover:bg-accent",
                    )}
                    onClick={() =>
                      updateDraft({
                        imprint: preset.imprint,
                        logoText: preset.mark,
                        logoUrl: preset.url,
                      })
                    }
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

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Ton</div>
            <ChoiceGrid
              values={TONES}
              selected={draft.tone}
              labelFor={(value) => toneLabel(value, draft.language)}
              descriptionFor={(value) => TONE_DESCRIPTIONS[value]}
              onSelect={(value) => updateDraft({ tone: value })}
            />
          </div>

          <details className="rounded-[22px] border border-border/60 bg-background/60 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-foreground select-none hover:bg-accent/40 transition-colors">
              <span>Gelişmiş seçenekler</span>
              <svg className="size-4 text-muted-foreground transition-transform [[open]>&]:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </summary>
            <div className="space-y-6 px-5 pb-5 pt-2">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Derinlik</div>
                <ChoiceGrid
                  values={DEPTHS}
                  selected={draft.depth}
                  labelFor={(value) => depthLabel(value, draft.language)}
                  descriptionFor={(value) => DEPTH_DESCRIPTIONS[value]}
                  onSelect={(value) => updateDraft({ depth: value })}
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Kapak yönü</div>
                <ChoiceGrid
                  values={COVER_DIRECTIONS}
                  selected={draft.coverDirection}
                  labelFor={(value) => coverDirectionLabel(value, draft.language)}
                  descriptionFor={(value) => COVER_DESCRIPTIONS[value]}
                  onSelect={(value) => updateDraft({ coverDirection: value })}
                  columns="md:grid-cols-2"
                />
              </div>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={goNext}>
              Önizlemeyi Hazırla
            </Button>
          </div>
        </div>
      ),
    });
  }

  // ── GENERATE ───────────────────────────────────────────────────────────────
  return wrapInShell({
    title: "Önizlemeyi başlat",
    description: appShellEnabled
      ? "Kitap vitrini tek akışta hazırlanır. Kapak ve ilk okunabilir bölüm arka planda canlı üretime girer."
      : "Preview kaybolmasın diye bu aşamada hesabına bağlarız. Kitap doğrudan kütüphanene kaydolur ve üretim arka planda devam eder.",
    children: (
      aiLoading === "generate" ? (
        <GenerateLoadingScreen redirectPath={pendingRedirect || undefined} />
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <GenerateAuthGateDialog
            open={authGateOpen}
            onOpenChange={handleAuthGateOpenChange}
            resumePath={generateResumePath()}
            onMethodSelected={handleAuthGateMethodSelected}
            onAuthenticated={() => requestGenerate("inline_auth")}
          />

          <div className="rounded-[24px] border border-border/80 bg-background/72 p-6">
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">1. önce</div>
                <div className="mt-2 text-sm leading-6 text-foreground">Kapak ve preview hazırlanır.</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">2. sonra</div>
                <div className="mt-2 text-sm leading-6 text-foreground">Değeri görür, düzenler ve karar verirsin.</div>
              </div>
              <div className="rounded-[18px] border border-primary/20 bg-primary/5 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">3. unlock</div>
                <div className="mt-2 text-sm leading-6 text-foreground">Tam kitap, PDF ve EPUB daha sonra açılır.</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Başlık</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{draft.title}</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dil</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{languageLabel(draft.language)}</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bölüm sayısı</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{draft.outline.length} bölüm</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Branding</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{draft.imprint || draft.logoText || "Hazır"}</div>
              </div>
            </div>
            <div className="mt-5 rounded-[18px] border border-border/80 bg-card px-4 py-4 text-sm leading-7 text-muted-foreground">
              {appShellEnabled
                ? "Generate'a bastığında kitap aynı hesabın altında kaydedilir. İlk okunabilir bölüm gelir gelmez preview açılır; tam kitap ve export daha sonra unlock edilir."
                : "Önce hesabını oluşturur veya giriş yaparsın. Bunun amacı preview'ı ve kitabını kaybetmemen. Sonra üretim başlar ve preview hazır olunca doğrudan kitabına dönersin."}
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={() => void requestGenerate()}>
              {appShellEnabled ? "Önizlemeyi Oluştur" : "Hesabını Oluştur ve Önizlemeyi Başlat"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                clearFunnelDraft();
                router.push(stepHref("topic"));
              }}
            >
              Baştan Kur
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/70">
            {appShellEnabled
              ? "Aynı hesapta devam et · Önce preview gör · Tam kitabı sonra unlock et"
              : "Hesabına bağlanır · Preview kaybolmaz · Hazır olunca doğrudan geri dönersin"}
          </p>
        </div>
      )
    ),
  });
}
