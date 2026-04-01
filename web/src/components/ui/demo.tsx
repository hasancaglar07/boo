import { cn } from "@/lib/utils";

import { LogoCloud } from "@/components/ui/logo-cloud-3";

const logos = [
  {
    src: "/logos/googleplay.svg",
    alt: "Google Play",
  },
  {
    src: "/logos/apple.svg",
    alt: "Apple",
  },
  {
    src: "/logos/openai_wordmark_light.svg",
    alt: "OpenAI",
  },
  {
    src: "/logos/claude-ai-wordmark-icon_light.svg",
    alt: "Claude AI",
  },
  {
    src: "/logos/notion.svg",
    alt: "Notion",
  },
  {
    src: "/logos/microsoft-word.svg",
    alt: "Microsoft Word",
  },
  {
    src: "/logos/canva.svg",
    alt: "Canva",
  },
  {
    src: "/logos/adobe.svg",
    alt: "Adobe",
  },
  {
    src: "/logos/dropbox_wordmark.svg",
    alt: "Dropbox",
  },
];

export default function DemoOne() {
  return (
    <section className="relative border-b border-border/80 py-18">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-1/2 left-1/2 -z-10 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-b-full",
          "bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent_50%)]",
          "blur-[30px]",
        )}
      />

      <div className="shell">
        <section className="relative mx-auto max-w-4xl">
          <h2 className="mb-5 text-center text-xl font-medium tracking-tight text-foreground md:text-3xl">
            <span className="text-muted-foreground">Trusted by experts.</span>
            <br />
            <span className="font-semibold">Used by the leaders.</span>
          </h2>
          <div className="mx-auto my-5 h-px max-w-sm bg-border [mask-image:linear-gradient(to_right,transparent,black,transparent)]" />

          <LogoCloud logos={logos} />

          <div className="mt-5 h-px bg-border [mask-image:linear-gradient(to_right,transparent,black,transparent)]" />
        </section>
      </div>
    </section>
  );
}
