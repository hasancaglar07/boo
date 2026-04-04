"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import {
  bookTypeLabel,
  type FunnelBookType,
  type FunnelDraft,
  type FunnelLanguage,
} from "@/lib/funnel-draft";
import { ChoiceGrid } from "@/components/funnel/shared/choice-grid";

const BOOK_TYPES: FunnelBookType[] = ["rehber", "is", "egitim", "cocuk", "diger"];

const BOOK_TYPE_DESCRIPTIONS: Record<FunnelBookType, string> = {
  rehber: "Adım adım öğreten, net ve uygulanabilir akış.",
  is: "Uzmanlık, danışmanlık veya marka otoritesi için güçlü kurgu.",
  egitim: "Öğretici, örnekli ve daha sistemli anlatım.",
  cocuk: "Daha sıcak, ritimli ve sade anlatım düzeni.",
  diger: "Özel konu veya hibrit kurgular için esnek alan.",
};

export function TopicStep({
  draft,
  onUpdate,
  onNext,
  error,
  onError,
}: {
  draft: FunnelDraft;
  onUpdate: (changes: Partial<FunnelDraft>) => void;
  onNext: () => void;
  error: string;
  onError: (msg: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Context hint — replaces the 3 info cards */}
      <div className="rounded-[20px] border border-primary/15 bg-primary/[0.04] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" />
          <div className="text-sm leading-7 text-muted-foreground">
            Konuyu net yazdığında başlık önerileri ve bölüm planı otomatik gelir.
            Hemen ardından kitabın gerçekten çıkmaya değer olup olmadığını ön izlemeyle göreceksin.
          </div>
        </div>
      </div>

      {/* Topic textarea — primary focus */}
      <div className="space-y-2">
        <label htmlFor="topic" className="text-sm font-semibold text-foreground">
          Kitabın konusu ne?
        </label>
        <Textarea
          id="topic"
          value={draft.topic}
          onChange={(event) => onUpdate({ topic: event.target.value })}
          placeholder={"örnek: danışmanların uzmanlığını lead magnet ve authority book'a dönüştürme rehberi"}
          rows={4}
          autoFocus
          className="resize-none text-base leading-7 placeholder:text-muted-foreground/60 min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground/70">
          Sorun, hedef okur ve vaat ne kadar netse çıkan outline o kadar iyi olur.
        </p>
      </div>

      {/* Book type — visual cards */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">Kitap tipi</div>
        <ChoiceGrid
          values={BOOK_TYPES}
          selected={draft.bookType}
          labelFor={(value) => bookTypeLabel(value)}
          descriptionFor={(value) => BOOK_TYPE_DESCRIPTIONS[value]}
          onSelect={(value) => onUpdate({ bookType: value })}
          columns="md:grid-cols-2 xl:grid-cols-3"
        />
      </div>

      {/* Target audience — optional, collapsible feel */}
      <div className="space-y-2">
        <label htmlFor="audience" className="text-sm font-semibold text-foreground">
          Hedef okur <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
        </label>
        <Input
          id="audience"
          value={draft.audience}
          onChange={(event) => onUpdate({ audience: event.target.value })}
          placeholder="örnek: yeni başlayan oyuncular ve ebeveynler"
          className="h-12 text-base"
        />
      </div>

      {error ? (
        <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button size="lg" onClick={onNext}>
          Başlık Önerilerine Geç
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() =>
            onUpdate({
              topic: draft.topic || "uzmanlığını kitaba dönüştürmek isteyen danışmanlar için authority book rehberi",
              audience: draft.audience || "koçlar, danışmanlar ve course creator'lar",
            })
          }
        >
          Örnek Doldur
        </Button>
      </div>
    </div>
  );
}
