import { Cta4 } from "@/components/ui/cta-4";

export function MarketingCtaSection({
  title = "The single clear starting point for publishing your first book.",
  description = "A book system that takes you from topic idea to first publishable file without unnecessary dashboard fatigue.",
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
      buttonText="Start Your Free Preview"
      buttonUrl="/start/topic"
      items={items}
    />
  );
}
