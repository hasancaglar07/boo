export interface LoadingContent {
  id: string;
  text: string;
  category: "fact" | "tip" | "joke" | "did-you-know";
  emoji: string;
}

export const LOADING_CONTENT: LoadingContent[] = [
  // === FACTS (20+ items) ===
  {
    id: "fact-1",
    text: "Over 2.2 billion books are published worldwide every year",
    category: "fact",
    emoji: "📚",
  },
  {
    id: "fact-2",
    text: "First printed book: Gutenberg Bible (1455)",
    category: "fact",
    emoji: "📜",
  },
  {
    id: "fact-3",
    text: "World's largest library holds 170+ million books",
    category: "fact",
    emoji: "🏛️",
  },
  {
    id: "fact-4",
    text: "Average 3.5 new books published every day",
    category: "fact",
    emoji: "📖",
  },
  {
    id: "fact-5",
    text: "Most translated book: Available in every language",
    category: "fact",
    emoji: "🌍",
  },
  {
    id: "fact-6",
    text: "First ebook created in 1971",
    category: "fact",
    emoji: "💻",
  },
  {
    id: "fact-7",
    text: "600,000+ books sold worldwide every day",
    category: "fact",
    emoji: "🛒",
  },
  {
    id: "fact-8",
    text: "Longest novel: 13,000+ pages",
    category: "fact",
    emoji: "📏",
  },
  {
    id: "fact-9",
    text: "First audiobook produced in 1930s",
    category: "fact",
    emoji: "🎧",
  },
  {
    id: "fact-10",
    text: "Most borrowed library category: Children's books",
    category: "fact",
    emoji: "👶",
  },
  {
    id: "fact-11",
    text: "World's most expensive book sold for $30 million",
    category: "fact",
    emoji: "💰",
  },
  {
    id: "fact-12",
    text: "Over 1 million new books published annually",
    category: "fact",
    emoji: "📊",
  },
  {
    id: "fact-13",
    text: "Bestselling author: 500+ million books sold",
    category: "fact",
    emoji: "✍️",
  },
  {
    id: "fact-14",
    text: "When first books printed, Europe population was only 100 million",
    category: "fact",
    emoji: "🌎",
  },
  {
    id: "fact-15",
    text: "Average 4.5 new authors emerge daily",
    category: "fact",
    emoji: "👥",
  },
  {
    id: "fact-16",
    text: "World's oldest library is 7,000 years old",
    category: "fact",
    emoji: "🏺",
  },
  {
    id: "fact-17",
    text: "100,000+ books gifted every day",
    category: "fact",
    emoji: "🎁",
  },
  {
    id: "fact-18",
    text: "Most translated author available in 50+ languages",
    category: "fact",
    emoji: "🗣️",
  },
  {
    id: "fact-19",
    text: "Least read section in libraries: About libraries",
    category: "fact",
    emoji: "🤔",
  },
  {
    id: "fact-20",
    text: "7 books sold every second worldwide",
    category: "fact",
    emoji: "⚡",
  },
  {
    id: "fact-21",
    text: "First novel: 1,000+ pages, took 10 years to write",
    category: "fact",
    emoji: "📝",
  },
  {
    id: "fact-22",
    text: "Most read genres: Fiction, followed by Sci-Fi",
    category: "fact",
    emoji: "🔥",
  },

  // === TIPS (25+ items) ===
  {
    id: "tip-1",
    text: "Write 30 minutes daily, finish a book per year",
    category: "tip",
    emoji: "💡",
  },
  {
    id: "tip-2",
    text: "Morning writing boosts creativity",
    category: "tip",
    emoji: "🌅",
  },
  {
    id: "tip-3",
    text: "500 words daily = 1.5 novels per year",
    category: "tip",
    emoji: "✍️",
  },
  {
    id: "tip-4",
    text: "Don't aim for perfection in first draft",
    category: "tip",
    emoji: "🎯",
  },
  {
    id: "tip-5",
    text: "Take regular breaks to stay fresh",
    category: "tip",
    emoji: "☕",
  },
  {
    id: "tip-6",
    text: "Reading is the best way to improve writing",
    category: "tip",
    emoji: "📖",
  },
  {
    id: "tip-7",
    text: "Draw characters from real people",
    category: "tip",
    emoji: "👤",
  },
  {
    id: "tip-8",
    text: "Include conflict in every chapter",
    category: "tip",
    emoji: "⚔️",
  },
  {
    id: "tip-9",
    text: "Show, don't tell",
    category: "tip",
    emoji: "🎭",
  },
  {
    id: "tip-10",
    text: "First 10 pages are critical - hook your reader",
    category: "tip",
    emoji: "🎣",
  },
  {
    id: "tip-11",
    text: "Dialogues best develop characters",
    category: "tip",
    emoji: "💬",
  },
  {
    id: "tip-12",
    text: "Every scene should have a purpose",
    category: "tip",
    emoji: "🎪",
  },
  {
    id: "tip-13",
    text: "Find your own writing rhythm",
    category: "tip",
    emoji: "🕐",
  },
  {
    id: "tip-14",
    text: "Editing is half of writing",
    category: "tip",
    emoji: "✂️",
  },
  {
    id: "tip-15",
    text: "Get feedback, but don't listen to everyone",
    category: "tip",
    emoji: "👂",
  },
  {
    id: "tip-16",
    text: "Writer's block? Try 5-minute free writing",
    category: "tip",
    emoji: "🚀",
  },
  {
    id: "tip-17",
    text: "Plan character arcs, but stay flexible",
    category: "tip",
    emoji: "📈",
  },
  {
    id: "tip-18",
    text: "Setting is a character too",
    category: "tip",
    emoji: "🏞️",
  },
  {
    id: "tip-19",
    text: "Read aloud for final edit",
    category: "tip",
    emoji: "🗣️",
  },
  {
    id: "tip-20",
    text: "Don't think while writing, edit later",
    category: "tip",
    emoji: "🧠",
  },
  {
    id: "tip-21",
    text: "Every book needs a unique voice",
    category: "tip",
    emoji: "🎵",
  },
  {
    id: "tip-22",
    text: "Fiction is more interesting than reality",
    category: "tip",
    emoji: "🌟",
  },
  {
    id: "tip-23",
    text: "Small details make big differences",
    category: "tip",
    emoji: "🔍",
  },
  {
    id: "tip-24",
    text: "Last chapter as important as first",
    category: "tip",
    emoji: "🏁",
  },
  {
    id: "tip-25",
    text: "Writing is thinking out loud",
    category: "tip",
    emoji: "💭",
  },
  {
    id: "tip-26",
    text: "Every book contains a piece of you",
    category: "tip",
    emoji: "👤",
  },

  // === JOKES (15+ items) ===
  {
    id: "joke-1",
    text: "Writer's biggest enemy: 'I'll write tomorrow'",
    category: "joke",
    emoji: "😄",
  },
  {
    id: "joke-2",
    text: "What editors love most? To edit",
    category: "joke",
    emoji: "🤣",
  },
  {
    id: "joke-3",
    text: "Writer's favorite time: Day after deadline",
    category: "joke",
    emoji: "😅",
  },
  {
    id: "joke-4",
    text: "When is writer happiest? When book is done",
    category: "joke",
    emoji: "🎉",
  },
  {
    id: "joke-5",
    text: "Editor: 'This chapter too short', Writer: 'I'll extend it'",
    category: "joke",
    emoji: "😂",
  },
  {
    id: "joke-6",
    text: "Writer's favorite phrase: 'One last edit'",
    category: "joke",
    emoji: "😜",
  },
  {
    id: "joke-7",
    text: "Library: Writer's second home",
    category: "joke",
    emoji: "🏠",
  },
  {
    id: "joke-8",
    text: "When writers write? Anytime... while thinking",
    category: "joke",
    emoji: "🤔",
  },
  {
    id: "joke-9",
    text: "Writing a book: Best way to talk to yourself",
    category: "joke",
    emoji: "💬",
  },
  {
    id: "joke-10",
    text: "Writer's greatest success: Finishing chapter before coffee gets cold",
    category: "joke",
    emoji: "☕",
  },
  {
    id: "joke-11",
    text: "Editor: 'Too long', Writer: 'But necessary!'",
    category: "joke",
    emoji: "😊",
  },
  {
    id: "joke-12",
    text: "Writer's day: Day is day, night is night",
    category: "joke",
    emoji: "🌙",
  },
  {
    id: "joke-13",
    text: "Book writer: Creator of own world",
    category: "joke",
    emoji: "🌍",
  },
  {
    id: "joke-14",
    text: "Writer's biggest problem: Too many ideas",
    category: "joke",
    emoji: "💡",
  },
  {
    id: "joke-15",
    text: "A book: Writer's child",
    category: "joke",
    emoji: "👶",
  },
  {
    id: "joke-16",
    text: "Writer's favorite word: 'Done'",
    category: "joke",
    emoji: "✨",
  },

  // === DID YOU KNOW (10+ items) ===
  {
    id: "didyouknow-1",
    text: "First ebook created in 1971 by Michael Hart",
    category: "did-you-know",
    emoji: "🧠",
  },
  {
    id: "didyouknow-2",
    text: "World's largest book is 1.5 meters tall",
    category: "did-you-know",
    emoji: "📏",
  },
  {
    id: "didyouknow-3",
    text: "Queen of England reads 1 book per week",
    category: "did-you-know",
    emoji: "👑",
  },
  {
    id: "didyouknow-4",
    text: "First audiobook produced in 1932 in USA",
    category: "did-you-know",
    emoji: "🎧",
  },
  {
    id: "didyouknow-5",
    text: "World's most expensive book sold for $30 million",
    category: "did-you-know",
    emoji: "💰",
  },
  {
    id: "didyouknow-6",
    text: "Average 4 new books published daily",
    category: "did-you-know",
    emoji: "📊",
  },
  {
    id: "didyouknow-7",
    text: "Most translated book: Bible (700+ languages)",
    category: "did-you-know",
    emoji: "🌍",
  },
  {
    id: "didyouknow-8",
    text: "World's oldest book is 4,000 years old",
    category: "did-you-know",
    emoji: "🏺",
  },
  {
    id: "didyounow-9",
    text: "7 books sold every second",
    category: "did-you-know",
    emoji: "⚡",
  },
  {
    id: "didyouknow-10",
    text: "Most borrowed library book: Harry Potter",
    category: "did-you-know",
    emoji: "⚡",
  },
  {
    id: "didyouknow-11",
    text: "First novel: 1,000+ pages, took 10 years to write",
    category: "did-you-know",
    emoji: "📝",
  },
  {
    id: "didyouknow-12",
    text: "Over 1 billion books exist in the world",
    category: "did-you-know",
    emoji: "📚",
  },
];

// Category colors for UI
export const CATEGORY_COLORS = {
  fact: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/20",
  },
  tip: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  joke: {
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/20",
  },
  "did-you-know": {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/20",
  },
};

// Helper function to get random content
export function getRandomContent(): LoadingContent {
  const randomIndex = Math.floor(Math.random() * LOADING_CONTENT.length);
  return LOADING_CONTENT[randomIndex];
}

// Helper function to get content by category
export function getContentByCategory(category: LoadingContent["category"]): LoadingContent[] {
  return LOADING_CONTENT.filter((item) => item.category === category);
}

// Helper function to get sequential content (for rotation)
export function getContentAtIndex(index: number): LoadingContent {
  return LOADING_CONTENT[index % LOADING_CONTENT.length];
}
