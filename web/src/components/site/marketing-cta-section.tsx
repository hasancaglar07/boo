import { Cta4 } from "@/components/ui/cta-4";

export function MarketingCtaSection({
  title = "İlk kitabını çıkarmak için tek net başlangıç.",
  description = "Konu fikrinden ilk yayınlanabilir dosyaya kadar seni gereksiz panel yorgunluğuna sokmadan ilerleyen bir kitap sistemi.",
  items,
}: {
  title?: string;
  description?: string;
  items?: readonly string[];
}) {
  return (
    <Cta4
      title={title}
      description={description}
      buttonText="Ücretsiz Önizlemeyi Başlat"
      buttonUrl="/start/topic"
      items={items}
    />
  );
}
