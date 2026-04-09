/**
 * Schema markup builders for AI SEO optimization
 * These functions generate structured data that helps AI systems understand and cite your content
 */

export interface ArticleSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: string;
  authorUrl?: string;
  authorExpertise?: string[];
  url: string;
  imageUrl?: string;
  section?: string;
  keywords?: string[];
}

/**
 * Build Article schema for blog posts and content pages
 * Critical for AI citation - increases visibility by 30-40%
 */
export function buildArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  authorUrl,
  authorExpertise = ["AI book writing", "Publishing", "KDP"],
  url,
  imageUrl,
  section,
  keywords,
}: ArticleSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: "en-US",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: author,
      ...(authorUrl && { url: authorUrl }),
      ...(authorExpertise.length > 0 && { knowsAbout: authorExpertise }),
    },
    publisher: {
      "@type": "Organization",
      name: "Book Generator",
      logo: {
        "@type": "ImageObject",
        url: "https://bookgenerator.net/logo.png",
      },
    },
    ...(section && { articleSection: section }),
    ...(keywords && { keywords: keywords.join(", ") }),
  };

  if (imageUrl) {
    schema.image = {
      "@type": "ImageObject",
      url: imageUrl,
    };
  }

  return schema;
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Build FAQPage schema for FAQ sections
 * Enables direct FAQ extraction by AI systems
 */
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
  tool?: string[];
}

/**
 * Build HowTo schema for step-by-step guides
 * Critical for "How to" queries in AI search
 */
export function buildHowToSchema({
  name,
  description,
  steps,
  estimatedTime,
  tool,
}: HowToSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  if (estimatedTime) {
    schema.totalTime = estimatedTime;
  }

  if (tool && tool.length > 0) {
    schema.tool = tool;
  }

  return schema;
}

export interface WebSiteSchemaProps {
  name: string;
  description: string;
  url: string;
  searchAction?: {
    target: string;
    queryInput: string;
  };
}

/**
 * Build WebSite schema for homepage
 * Helps AI systems understand the site structure and search functionality
 */
export function buildWebSiteSchema({
  name,
  description,
  url,
  searchAction,
}: WebSiteSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url,
  };

  if (searchAction) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: searchAction.target,
      "query-input": searchAction.queryInput,
    };
  }

  return schema;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * Build BreadcrumbList schema for navigation
 * Helps AI understand page hierarchy
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export interface ItemListItem {
  position: number;
  name: string;
  description?: string;
  url: string;
}

export interface ItemListSchemaProps {
  name: string;
  description?: string;
  numberOfItems: number;
  itemListElement: ItemListItem[];
}

/**
 * Build ItemList schema for collections (blog posts, tools, examples)
 * Critical for AI systems to understand list content structure
 * Increases visibility by 30-40% for collection pages
 */
export function buildItemListSchema({
  name,
  description,
  numberOfItems,
  itemListElement,
}: ItemListSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems,
    itemListElement: itemListElement.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      ...(item.description && { description: item.description }),
      url: item.url,
    })),
  };

  if (description) {
    schema.description = description;
  }

  return schema;
}

export interface ProductSchemaProps {
  name: string;
  description: string;
  url: string;
  price: string;
  priceCurrency: string;
  availability?: "InStock" | "OutOfStock";
  offers?: Array<{
    name: string;
    price: string;
    priceCurrency: string;
  }>;
}

/**
 * Build Product schema for pricing pages
 * Helps AI extract pricing information
 */
export function buildProductSchema({
  name,
  description,
  url,
  price,
  priceCurrency,
  availability = "InStock",
  offers,
}: ProductSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    offers: offers
      ? offers.map((offer) => ({
          "@type": "Offer",
          name: offer.name,
          price: offer.price,
          priceCurrency: offer.priceCurrency,
          availability,
        }))
      : [
          {
            "@type": "Offer",
            price,
            priceCurrency,
            availability,
            url,
          },
        ],
  };
}

export interface ReviewSchemaProps {
  itemName: string;
  itemUrl: string;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    datePublished: string;
  }>;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
}

/**
 * Build Review schema for social proof
 * Increases trust and AI citation rate
 */
export function buildReviewSchema({
  itemName,
  itemUrl,
  reviews,
  aggregateRating,
}: ReviewSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: itemName,
    url: itemUrl,
    review: reviews.map(
      (review) =>
        ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: review.author,
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
          },
          reviewBody: review.text,
          datePublished: review.datePublished,
        }) as const
    ),
  };

  if (aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: aggregateRating.bestRating,
      worstRating: aggregateRating.worstRating,
    };
  }

  return schema;
}
