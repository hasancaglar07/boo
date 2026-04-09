# SEO/GEO Quick Start - Immediate Actions

## 🚀 Do These Today (2-3 hours)

### 1. Create robots.txt (5 minutes)

```bash
cd web/public
cat > robots.txt << 'EOF'
# Allow AI crawlers
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

# Allow all crawlers
User-agent: *
Allow: /

# Disallow protected areas
Disallow: /app/
Disallow: /api/
Disallow: /admin/

Sitemap: https://bookgenerator.net/sitemap.xml
EOF
```

### 2. Add "Last Updated" Component (30 minutes)

**Create:** `web/src/components/site/last-updated.tsx`

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

**Add to blog posts:** `web/src/app/blog/[slug]/page.tsx`

```tsx
import { LastUpdated } from "@/components/site/last-updated";

// In the component, add before content:
<LastUpdated date={post.dateModified} className="mb-4" />
```

### 3. Add Article Schema (1 hour)

**Create:** `web/src/lib/schema.ts`

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

**Update blog page:**

```tsx
import { buildArticleSchema } from "@/lib/schema";

// In generateMetadata:
const articleSchema = buildArticleSchema({
  title: post.title,
  description: post.summary,
  datePublished: post.datePublished,
  dateModified: post.dateModified,
  author: "Book Generator Team",
  url: absoluteUrl(`/blog/${post.slug}`),
  imageUrl: buildOgImageUrl(post.title, post.summary),
});

// In page component, add before return:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
/>
```

### 4. Add Direct Answer Block to About Page (30 minutes)

**Create:** `web/src/components/site/direct-answer.tsx`

```tsx
interface DirectAnswerProps {
  question: string;
  answer: string;
}

export function DirectAnswerBlock({ question, answer }: DirectAnswerProps) {
  return (
    <div className="my-8 rounded-lg border border-border bg-muted/50 p-6">
      <h2 className="text-lg font-semibold mb-3">{question}</h2>
      <p className="text-base leading-relaxed">{answer}</p>
    </div>
  );
}
```

**Add to about page:**

```tsx
import { DirectAnswerBlock } from "@/components/site/direct-answer";

<DirectAnswerBlock
  question="What is Book Generator?"
  answer="Book Generator is an AI-powered publishing platform that transforms your expertise into publication-ready books in 5 questions. It generates complete manuscripts, professional covers, and KDP-compliant EPUB/PDF output, handling research, outlining, writing, and formatting automatically."
/>
```

### 5. Add FAQ Schema (30 minutes)

**Create:** `web/src/lib/faq-schema.ts`

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

**Add to FAQ page:** `web/src/app/faq/page.tsx`

```tsx
import { buildFAQSchema } from "@/lib/faq-schema";

const faqData = [
  {
    question: "How much does it cost to generate a book?",
    answer: "Single book generation starts at $4. Monthly plans from $19/month include multiple books, advanced features, and priority support.",
  },
  {
    question: "Can I publish the generated books on Amazon KDP?",
    answer: "Yes, Book Generator produces KDP-compliant PDF and EPUB files ready for Amazon publishing. Over 30 books have been published using our platform.",
  },
  {
    question: "How long does it take to generate a book?",
    answer: "Most books are generated within 10-30 minutes, depending on length and complexity. The 5-question setup takes 2-3 minutes, and AI generation completes automatically.",
  },
  {
    question: "What languages are supported?",
    answer: "Book Generator supports English and Turkish with native-quality output. More languages coming soon.",
  },
];

const faqSchema = buildFAQSchema(faqData);

// Add to page:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
/>
```

---

## ✅ Verification Steps

### Test robots.txt
```bash
curl -I https://bookgenerator.net/robots.txt
# Should return 200 OK
```

### Test sitemap
```bash
curl -I https://bookgenerator.net/sitemap.xml
# Should return 200 OK
```

### Test schema markup
1. Go to: https://search.google.com/test/rich-results
2. Enter a blog post URL
3. Verify Article schema is detected
4. Check for errors

### Test AI bot access
```bash
# Test with different user agents
curl -A "GPTBot" -I https://bookgenerator.net/robots.txt
curl -A "PerplexityBot" -I https://bookgenerator.net/robots.txt
curl -A "ClaudeBot" -I https://bookgenerator.net/robots.txt
```

---

## 📊 Track Your Progress

### Week 1 Checklist
- [ ] robots.txt created and deployed
- [ ] LastUpdated component added to blog posts
- [ ] Article schema implemented on blog posts
- [ ] Direct answer block on About page
- [ ] FAQ schema added to /faq page
- [ ] All changes deployed to production
- [ ] robots.txt verified accessible
- [ ] Schema markup tested with Google

### Expected Results After Week 1
- ✅ AI crawlers can access your content
- ✅ Freshness signals visible on all content
- ✅ Blog posts have Article schema
- ✅ FAQ page has structured data
- ✅ Direct answers available for AI extraction

---

## 🎯 Next Steps (Week 2-4)

1. Add direct answer blocks to Pricing, How-it-works, Use cases
2. Create author system with credentials
3. Build comparison pages (ChatGPT vs Book Generator)
4. Add HowTo schema to /how-it-works
5. Implement ItemList schema for comparisons
6. Add statistics with sources to key pages
7. Perform baseline AI visibility audit

---

## 🔧 Troubleshooting

### robots.txt not accessible
- Ensure file is in `web/public/robots.txt`
- Check file permissions (644)
- Verify deployment included the file
- Clear CDN cache if applicable

### Schema not detected
- Validate JSON syntax
- Check JSON-LD format
- Ensure schema.org types are correct
- Test with Rich Results Test tool
- View page source to verify JSON-LD is present

### AI still not citing content
- Content needs to be 6+ months fresh
- Add more specific statistics
- Build third-party presence
- Create comparison pages
- Get mentioned on review sites

---

## 📈 Success Metrics

### After 30 Days
- robots.txt accessible ✅
- Article schema on blog posts ✅
- FAQ schema implemented ✅
- Last Updated dates visible ✅
- Direct answer blocks on top pages ✅

### After 60 Days
- Comparison pages live ✅
- HowTo schema implemented ✅
- Author bios added ✅
- Statistics with sources ✅
- Baseline visibility established ✅

### After 90 Days
- 3x increase in AI citations 🎯
- 20% increase in organic traffic 🎯
- Featured in AI answers 🎯

---

**Quick Start Status:** ✅ Ready
**Time to Complete:** 2-3 hours
**Impact:** Enables AI citations immediately
**Next:** Start with robots.txt creation
