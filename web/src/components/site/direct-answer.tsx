import { Info } from "lucide-react";

interface DirectAnswerProps {
  question: string;
  answer: string;
  className?: string;
}

/**
 * DirectAnswerBlock component for AI-optimized content
 *
 * CRITICAL for AI SEO: AI systems extract 40-60 word answer blocks
 * These blocks should:
 * - Start each page with a direct answer
 * - Be self-contained (work without surrounding context)
 * - Be 40-60 words for optimal extraction
 * - Answer the question directly, don't bury the lead
 *
 * Expected impact: +37% extractability boost
 */
export function DirectAnswerBlock({ question, answer, className = "" }: DirectAnswerProps) {
  return (
    <div
      className={`my-8 rounded-lg border border-border bg-muted/50 p-6 shadow-sm ${className}`}
      role="complementary"
      aria-label="Direct answer"
    >
      <div className="flex items-start gap-3">
        <Info className="size-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-3 text-foreground">{question}</h2>
          <p className="text-base leading-relaxed text-foreground/90">{answer}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Props interface for QuickAnswerBlock - a shorter variant
 */
interface QuickAnswerProps {
  label?: string;
  answer: string;
  className?: string;
}

/**
 * QuickAnswerBlock - shorter variant for quick answers
 * Use for sidebar summaries or highlighted key points
 */
export function QuickAnswerBlock({ label = "Quick answer", answer, className = "" }: QuickAnswerProps) {
  return (
    <div className={`rounded-lg border border-primary/20 bg-primary/5 p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75 mb-2">
        {label}
      </p>
      <p className="text-sm leading-7 text-foreground">{answer}</p>
    </div>
  );
}
