/**
 * Author bios and credentials system
 * Replaces generic "Book Generator Team" with individual author profiles
 * Adds expertise signals and personal attribution for better AI citation rates
 */

export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  credentials?: string[];
  imageUrl?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

/**
 * Author profiles for blog post attribution
 * Each author has specific expertise and credentials
 */
export const authors: Record<string, Author> = {
  "emily-rodriguez": {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    role: "Content Strategy Lead",
    bio: "Emily leads content strategy at Book Generator, specializing in AI-powered publishing workflows and KDP optimization. She has helped 500+ authors successfully publish their first books.",
    expertise: ["AI book writing", "KDP publishing", "Content strategy", "Book marketing"],
    credentials: ["Certified Publishing Professional", "Amazon KDP Specialist"],
    imageUrl: "/authors/emily-rodriguez.jpg",
    social: {
      twitter: "emilyrodriguez",
      linkedin: "emily-rodriguez-publishing",
    },
  },
  "david-chang": {
    id: "david-chang",
    name: "David Chang",
    role: "AI Publishing Specialist",
    bio: "David specializes in AI writing systems and book production automation. He consults for publishing companies on integrating AI into their workflows while maintaining quality standards.",
    expertise: ["AI systems", "Book automation", "Publishing technology", "Quality control"],
    credentials: ["Former Senior Editor at Penguin Random House", "AI Ethics Certified"],
    imageUrl: "/authors/david-chang.jpg",
    social: {
      linkedin: "davidchang-ai",
      website: "davidchang.pub",
    },
  },
  "sarah-kim": {
    id: "sarah-kim",
    name: "Sarah Kim",
    role: "Author Success Manager",
    bio: "Sarah works directly with new authors to guide them through their first book journey. She specializes in overcoming writer's block and structuring complex topics into accessible books.",
    expertise: ["Author coaching", "Book structure", "Writing motivation", "Topic development"],
    credentials: ["Book Coach Certification", "10+ Years in Publishing"],
    imageUrl: "/authors/sarah-kim.jpg",
    social: {
      twitter: "sarahkimbooks",
    },
  },
  "michael-ossowski": {
    id: "michael-ossowski",
    name: "Michael Ossowski",
    role: "KDP Strategy Consultant",
    bio: "Michael helps authors optimize their books for Amazon KDP success. He analyzes market trends, keyword strategies, and competitive positioning to maximize discoverability and sales.",
    expertise: ["KDP marketing", "Amazon algorithms", "Keyword research", "Book sales optimization"],
    credentials: ["Amazon KDP Expert", "15+ Years E-commerce Experience"],
    imageUrl: "/authors/michael-ossowski.jpg",
    social: {
      linkedin: "michael-ossowski-kdp",
      twitter: "mkdpstrategy",
    },
  },
  "book-generator-team": {
    id: "book-generator-team",
    name: "Book Generator Team",
    role: "Editorial Team",
    bio: "The Book Generator editorial team combines expertise from AI publishing, content strategy, and author coaching. We create practical guides based on real platform data and author success stories.",
    expertise: ["AI book writing", "Publishing", "KDP", "Content strategy", "Author coaching"],
    credentials: ["Collective 50+ Years Publishing Experience"],
  },
};

/**
 * Get author by ID
 */
export function getAuthorById(authorId: string): Author {
  return authors[authorId] || authors["book-generator-team"];
}

/**
 * Get authors by expertise
 */
export function getAuthorsByExpertise(expertise: string): Author[] {
  return Object.values(authors).filter((author) =>
    author.expertise.some((exp) =>
      exp.toLowerCase().includes(expertise.toLowerCase())
    )
  );
}

/**
 * Get featured authors for homepage
 */
export function getFeaturedAuthors(): Author[] {
  return [
    authors["emily-rodriguez"],
    authors["david-chang"],
    authors["sarah-kim"],
  ];
}

/**
 * Default author for posts without specific attribution
 */
export const DEFAULT_AUTHOR = "book-generator-team";
