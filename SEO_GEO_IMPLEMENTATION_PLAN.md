# SEO/GEO Implementation Plan - Book Generator
**Created:** 2026-04-09
**Status:** Ready for Implementation
**Priority:** High

---

## Quick Start Actions (Do Today)

### 1. Create robots.txt with AI Bot Permissions

**File:** `web/public/robots.txt`

```txt
# Allow all AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

# Allow all crawlers by default
User-agent: *
Allow: /

# Disallow admin areas
Disallow: /app/
Disallow: /api/
Disallow: /admin/

# Sitemap location
Sitemap: https://bookgenerator.net/sitemap.xml
```

**Implementation:**
```bash
cd web/public
touch robots.txt
# Paste content above
```

---

### 2. Add "Last Updated" Date Component

**File:** `web/src/components/site/last-updated.tsx`

```tsx
import { Clock } from "lucide-react";

interface LastUpdatedProps {
  date: string;
  className?: string;
}

export function LastUpdated({ date, className = "" }: LastUpdatedProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Clock className="size-4" />
      <span>Last updated: {formattedDate}</span>
    </div>
  );
}
```

**Usage Example:** Add to blog posts
```tsx
import { LastUpdated } from "@/components/site/last-updated";

// In blog post page:
<LastUpdated date={post.dateModified} className="mb-4" />
```

---

### 3. Add Article Schema to Blog Posts

**File:** `web/src/lib/schema.ts` (NEW)

```ts
export interface ArticleSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: string;
  url: string;
  imageUrl?: string;
}

export function buildArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  url,
  imageUrl,
}: ArticleSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: author,
      // Add credentials if available
      knowsAbout: ["AI book writing", "Publishing", "KDP"],
    },
    publisher: {
      "@type": "Organization",
      name: "Book Generator",
      logo: {
        "@type": "ImageObject",
        url: "https://bookgenerator.net/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    }),
  };
}
```

**Update Blog Post Page:** `web/src/app/blog/[slug]/page.tsx`

```tsx
import { buildArticleSchema } from "@/lib/schema";

// In generateMetadata function:
const articleSchema = buildArticleSchema({
  title: post.title,
  description: post.summary,
  datePublished: post.datePublished,
  dateModified: post.dateModified,
  author: "Book Generator Team", // or specific author
  url: absoluteUrl(`/blog/${post.slug}`),
  imageUrl: buildOgImageUrl(post.title, post.summary),
});

// Return in metadata:
return {
  ...base,
  other: {
    ...base.other,
    "article:published_time": post.datePublished,
    "article:modified_time": post.dateModified,
    "article:author": "Book Generator Team",
  },
};
```

**Add to page component:**
```tsx
// In the page component, add script tag:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
/>
```

---

## Phase 1: Foundation (Week 1)

### Task Checklist

- [ ] **Day 1:** Create robots.txt with AI bot permissions
- [ ] **Day 1:** Add "Last Updated" component to all content types
- [ ] **Day 2:** Implement Article schema for blog posts
- [ ] **Day 3:** Add FAQPage schema to /faq page
- [ ] **Day 4:** Test AI bot access manually
- [ ] **Day 5:** Deploy and verify in production

### Testing AI Bot Access

**Manual Test Commands:**
```bash
# Test robots.txt accessibility
curl -I https://bookgenerator.net/robots.txt

# Test sitemap accessibility
curl -I https://bookgenerator.net/sitemap.xml

# Test Article schema on a blog post
curl https://bookgenerator.net/blog/your-post-slug | grep "application/ld+json"
```

**AI Platform Verification:**
1. **ChatGPT:** Ask "What is bookgenerator.net?" and check if cited
2. **Perplexity:** Search "Book Generator AI book writing"
3. **Google AI:** Search "AI book generator tools"

---

## Phase 2: Content Optimization (Week 2-3)

### 4. Add Direct Answer Blocks

**Pattern for Each Page:**

```tsx
// Example for About page
export function DirectAnswerBlock() {
  return (
    <div className="my-8 rounded-lg border border-border bg-muted/50 p-6">
      <h2 className="text-lg font-semibold mb-3">What is Book Generator?</h2>
      <p className="text-base leading-relaxed">
        Book Generator is an AI-powered publishing platform that transforms your expertise 
        into publication-ready books in 5 questions. It generates complete manuscripts, 
        professional covers, and KDP-compliant EPUB/PDF output, handling research, 
        outlining, writing, and formatting automatically.
      </p>
    </div>
  );
}
```

**Implement on:**
- `/about` - "What is Book Generator?"
- `/pricing` - "How much does Book Generator cost?"
- `/how-it-works` - "How does AI book generation work?"
- `/use-cases` - "Who should use Book Generator?"

### 5. Create Author System

**File:** `web/src/lib/authors.ts`

```ts
export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  imageUrl?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
}

export const authors: Record<string, Author> = {
  "book-generator-team": {
    id: "book-generator-team",
    name: "Book Generator Team",
    role: "AI Publishing Specialists",
    bio: "The Book Generator team specializes in AI-powered content creation and publishing automation.",
    expertise: ["AI writing", "KDP publishing", "Book production", "Content strategy"],
    imageUrl: "/logo.png",
  },
  // Add individual authors as needed
};
```

**Update blog post metadata:**
```ts
import { authors } from "@/lib/authors";

// In blog post page:
const author = authors[post.authorId || "book-generator-team"];
```

### 6. Add Statistics with Sources

**Pattern:**
```tsx
export function StatBlock({ stat, source, context }: {
  stat: string;
  source: string;
  context: string;
}) {
  return (
    <div className="my-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <p className="text-2xl font-bold text-primary">{stat}</p>
      <p className="text-sm text-muted-foreground mt-1">{context}</p>
      <p className="text-xs text-muted-foreground mt-2">
        Source: <a href={source} className="underline" target="_blank">{source}</a>
      </p>
    </div>
  );
}
```

**Add to key pages:**
- Homepage: "30+ showcase books published"
- Pricing: "Save 80% time vs manual writing"
- Examples: "2 books live on Amazon KDP"

---

## Phase 3: Advanced Optimization (Week 4)

### 7. Build Comparison Pages

**Template:** `web/src/app/compare/[slug]/page.tsx`

```tsx
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

type ComparePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparisons: Record<string, { title: string; description: string }> = {
    "chatgpt-vs-book-generator": {
      title: "ChatGPT vs Book Generator | AI Book Writing Comparison",
      description: "Compare ChatGPT vs Book Generator for writing books. Discover why specialized AI book tools outperform general AI assistants for long-form content.",
    },
    // Add more comparisons
  };

  const comparison = comparisons[slug];
  if (!comparison) return buildPageMetadata({ title: "Comparison Not Found", description: "", path: "/compare" });

  return buildPageMetadata({
    title: comparison.title,
    description: comparison.description,
    path: `/compare/${slug}`,
    keywords: ["comparison", "AI book writing", "book generator"],
  });
}
```

**Priority comparison pages:**
1. `/compare/chatgpt-vs-book-generator`
2. `/compare/best-ai-book-writing-tools`
3. `/compare/book-generator-vs-manual-writing`

### 8. Implement HowTo Schema

**File:** `web/src/lib/howto-schema.ts`

```ts
export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  estimatedTime?: string;
}

export function buildHowToSchema({
  name,
  description,
  steps,
  estimatedTime,
}: HowToSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(estimatedTime && { totalTime: estimatedTime }),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}
```

**Add to /how-it-works page:**
```tsx
const howItWorksSchema = buildHowToSchema({
  name: "How to Generate a Book with AI",
  description: "Complete guide to creating a publication-ready book using Book Generator's AI-powered platform",
  estimatedTime: "PT10M",
  steps: [
    {
      name: "Answer 5 Questions",
      text: "Provide your book topic, target audience, goals, and preferences in our simple 5-question wizard.",
    },
    {
      name: "Review Generated Outline",
      text: "AI generates a comprehensive chapter outline. Review, edit, and approve the structure.",
    },
    {
      name: "Generate Your Book",
      text: "AI writes each chapter with consistent style, tone, and quality. Includes research and citations.",
    },
    {
      name: "Customize Your Cover",
      text: "Generate professional cover designs with AI. Choose from multiple style options.",
    },
    {
      name: "Export & Publish",
      text: "Download KDP-compliant PDF and EPUB files ready for Amazon publishing.",
    },
  ],
});
```

### 9. Add FAQPage Schema

**File:** `web/src/lib/faq-schema.ts`

```ts
export interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
```

**Add to /faq page:**
```tsx
import { buildFAQSchema } from "@/lib/faq-schema";

const faqSchema = buildFAQSchema([
  {
    question: "How much does it cost to generate a book?",
    answer: "Single book generation starts at $4. Monthly plans from $19/month include multiple books, advanced features, and priority support.",
  },
  {
    question: "Can I publish the generated books on Amazon KDP?",
    answer: "Yes, Book Generator produces KDP-compliant PDF and EPUB files ready for Amazon publishing. Over 30 books have been published using our platform.",
  },
  // Add more FAQs
]);

// Add to page:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
/>
```

---

## Phase 4: Monitoring & Iteration (Ongoing)

### 10. Set Up AI Visibility Tracking

**Monthly Audit Checklist:**

```markdown
## AI Visibility Audit - [Month Year]

### Queries Tested
- [ ] "What is an AI book generator?"
- [ ] "Best AI book writing tools"
- [ ] "ChatGPT vs book generator"
- [ ] "How to write a book with AI"
- [ ] "AI book publishing KDP"
- [ ] "Book generator pricing"
- [ ] "Turkish book AI generator"
- [ ] "AI publishing studio"

### Platform Results
| Query | Google AI | ChatGPT | Perplexity | Claude | You Cited? | Competitors |
|-------|-----------|---------|------------|--------|------------|-------------|
| ... | ... | ... | ... | ... | ... | ... |

### Actions Taken This Month
- [ ] Content updated
- [ ] New schema added
- [ ] Comparison pages created
- [ ] Statistics added

### Goals for Next Month
- [ ] Target specific queries
- [ ] Improve weak pages
- [ ] Build third-party presence
```

### 11. Competitor Monitoring

**Track These Competitors:**
- Jasper.ai
- Copy.ai
- Scrivener
- ChatGPT (generic)
- Claude (generic)

**Monitor:**
- Which pages get cited
- What content structure they use
- Their statistics and claims
- Their schema implementation

---

## Code Changes Summary

### Files to Create

1. `web/public/robots.txt` - AI bot permissions
2. `web/src/components/site/last-updated.tsx` - Date display component
3. `web/src/lib/schema.ts` - Schema building functions
4. `web/src/lib/howto-schema.ts` - HowTo schema builder
5. `web/src/lib/faq-schema.ts` - FAQ schema builder
6. `web/src/lib/authors.ts` - Author data management

### Files to Modify

1. `web/src/app/blog/[slug]/page.tsx` - Add Article schema
2. `web/src/app/faq/page.tsx` - Add FAQPage schema
3. `web/src/app/how-it-works/page.tsx` - Add HowTo schema
4. `web/src/app/about/page.tsx` - Add direct answer block
5. `web/src/app/pricing/page.tsx` - Add direct answer block
6. All blog posts - Add LastUpdated component

### New Pages to Create

1. `web/src/app/compare/chatgpt-vs-book-generator/page.tsx`
2. `web/src/app/compare/best-ai-book-writing-tools/page.tsx`
3. `web/src/app/compare/book-generator-vs-manual-writing/page.tsx`

---

## Implementation Order

### Week 1: Foundation
1. Create robots.txt (30 min)
2. Add LastUpdated component (1 hour)
3. Implement Article schema (2 hours)
4. Add FAQPage schema (1 hour)
5. Test and deploy (1 hour)

### Week 2: Content
6. Add direct answer blocks (4 hours)
7. Implement author system (3 hours)
8. Add statistics to pages (2 hours)

### Week 3: Advanced
9. Build comparison pages (8 hours)
10. Implement HowTo schema (2 hours)
11. Add ItemList schema (2 hours)

### Week 4: Monitoring
12. Set up tracking spreadsheet (1 hour)
13. Perform baseline audit (2 hours)
14. Document results (1 hour)

**Total Time Estimate:** 30-35 hours

---

## Success Metrics

### After 30 Days:
- ✅ robots.txt accessible and allowing AI bots
- ✅ Article schema on all blog posts
- ✅ FAQPage schema implemented
- ✅ "Last Updated" dates on all content
- ✅ Direct answer blocks on top 10 pages

### After 60 Days:
- ✅ 3 comparison pages live
- ✅ HowTo schema implemented
- ✅ Author bios with credentials
- ✅ Statistics with sources added
- ✅ Baseline AI visibility established

### After 90 Days:
- ✅ 3x increase in AI citations
- ✅ 20% increase in organic traffic
- ✅ Featured in AI answers for top queries
- ✅ Competitor gaps identified and addressed

---

## Maintenance Schedule

### Weekly:
- Check for new AI platform updates
- Monitor competitor content
- Track referral traffic from AI sources

### Monthly:
- Update "Last Modified" dates on key content
- Audit AI visibility for top 20 queries
- Add 1-2 new statistics or data points
- Review and update comparison pages

### Quarterly:
- Full content freshness review
- Schema markup audit
- Competitor analysis
- Strategy adjustment based on results

---

## Troubleshooting

### Issue: AI Not Citing Content

**Check:**
1. robots.txt allows AI bots ✅
2. Content has recent "Last Updated" date ✅
3. Direct answer block present (40-60 words) ✅
4. Schema markup valid (test with rich results test) ✅
5. Content is publicly accessible (not gated) ✅

**Fix:**
- Add more specific statistics
- Improve content structure
- Build third-party presence
- Get mentioned on Wikipedia/review sites

### Issue: Schema Not Working

**Check:**
1. JSON-LD is valid JSON ✅
2. Schema.org types are correct ✅
3. Required fields are present ✅
4. No duplicate schemas on page ✅

**Test:**
- Google Rich Results Test
- Schema Markup Validator
- View page source and verify JSON-LD

---

**Plan Status:** ✅ Ready for Implementation
**Next Action:** Start with Week 1 tasks
**Review Date:** 2026-05-09 (30 days)
