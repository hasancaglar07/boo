/**
 * Testimonials Data for Homepage
 *
 * Transformed from customerReviews in reviews-data.ts
 * to match TestimonialsColumnsSection component format.
 *
 * Role assignments based on review content and results mentioned.
 */

import { TestimonialItem } from "@/components/ui/testimonials-columns-1";

/**
 * Generate role based on review content and author
 */
function getRole(author: string, text: string): string {
  if (text.includes("KDP") || text.includes("published")) {
    return "Published Author";
  }
  if (text.includes("consultant") || text.includes("expertise")) {
    return "Consultant";
  }
  if (text.includes("blog content") || text.includes("lead generation")) {
    return "Content Marketer";
  }
  if (text.includes("niche") || text.includes("positioning")) {
    return "Nonfiction Author";
  }
  if (text.includes("Turkish") || text.includes("multilingual")) {
    return "Multilingual Author";
  }
  if (text.includes("first book") || text.includes("sequel")) {
    return "First-time Author";
  }
  return "Author";
}

/**
 * Testimonials data for the homepage
 * Transformed from customerReviews with roles assigned
 */
export const testimonialData: TestimonialItem[] = [
  {
    name: "Sarah M.",
    role: "Published Author",
    rating: 5,
    text: "Published my first KDP book in 3 days. The chapter structure alone saved me weeks of outlining work. AI kept the tone consistent throughout.",
  },
  {
    name: "Michael R.",
    role: "Consultant",
    rating: 5,
    text: "As a consultant, I needed to turn my expertise into a book quickly. This tool transformed my scattered notes into a structured manuscript in under a week.",
  },
  {
    name: "Elena K.",
    role: "First-time Author",
    rating: 4,
    text: "The outline generator gave me a clear direction I was missing for months. Finished my first nonfiction book and already planning the sequel.",
  },
  {
    name: "David L.",
    role: "Nonfiction Author",
    rating: 5,
    text: "KDP niche analyzer helped me find a profitable niche I hadn't considered. Book Generator made the entire process from idea to publication seamless.",
  },
  {
    name: "Jennifer T.",
    role: "Content Marketer",
    rating: 5,
    text: "I had blog content sitting idle for years. Content to Book Converter transformed it into a structured book format. Now I have another lead generation asset.",
  },
  {
    name: "Robert Chen",
    role: "Multilingual Author",
    rating: 4,
    text: "The Turkish language support is impressive. Generated a professional-quality book in Turkish that required minimal editing. Great for multilingual authors.",
  },
  {
    name: "Amanda P.",
    role: "Published Author",
    rating: 5,
    text: "From blank page to published book in 2 weeks. The AI maintained my voice throughout while handling the heavy lifting of content generation.",
  },
  {
    name: "Carlos M.",
    role: "Nonfiction Author",
    rating: 5,
    text: "Title critic tool alone was worth it. Helped me refine my positioning before writing. The book production workflow is intuitive and powerful.",
  },
];

/**
 * Aggregate rating for schema markup
 */
export const testimonialsAggregateRating = {
  ratingValue: 4.8,
  reviewCount: testimonialData.length,
  bestRating: 5,
  worstRating: 1,
};
