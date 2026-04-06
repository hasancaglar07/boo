const fs = require('fs');

const filePath = 'web/src/lib/marketing-data.ts';
const content = fs.readFileSync(filePath, 'utf8');

const startNeedle = 'slug: "ilk-kitabimi-nasil-planlarim",';
const endNeedle = 'slug: "epub-ve-pdf-farki",';

const startIdx = content.indexOf(startNeedle);
const endIdx = content.indexOf(endNeedle, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('ERROR: Could not find markers!', { startIdx, endIdx });
  process.exit(1);
}

// Walk back to the opening brace "{"
let blockStart = startIdx;
while (blockStart > 0 && content[blockStart] !== '{') blockStart--;

// The old block ends right before the opening brace of the next entry
// Find the "\n  {" pattern before endIdx
let blockEnd = endIdx;
while (blockEnd > 0 && content[blockEnd] !== '{') blockEnd--;

const oldBlock = content.substring(blockStart, blockEnd);
console.log('Old block length:', oldBlock.length);
console.log('Old block starts:', JSON.stringify(oldBlock.substring(0, 80)));
console.log('Old block ends:', JSON.stringify(oldBlock.substring(oldBlock.length - 80)));

const newBlock = `{
    slug: "ilk-kitabimi-nasil-planlarim",
    title: "How Do I Plan My First Book?",
    summary: "Provides the shortest planning logic for someone producing a book for the first time.",
    category: "Getting Started",
    readTime: "7 min",
    datePublished: "2024-11-01",
    dateModified: "2025-02-10",
    intro: "With a first book, the problem is usually not writing — it is starting scattered. The topic is broad, the chapters are vague, and it is unclear where to begin. Many people go in circles for months saying 'I am planning' — because the real issue is not a lack of information, but a lack of structure. Yet a good plan is more than half the book. Someone who knows what they will write almost always finishes; someone who does not know usually leaves it half-done. This article does not take you through long methodologies, heavy writing craft books, or monthly planning processes — it takes you to a short, actionable planning logic that genuinely helps you complete your first book. A few clear decisions carry far more value than dozens of vague ideas.",
    sections: [
      ["Why a plan saves the book", "Books that start without a plan usually remain unfinished — because it is not the inability to write that wears people down, but not knowing what to write. The first few pages flow easily, then it becomes unclear what to write in which chapter, the topic scatters, and motivation drops. A plan gives you clear answers to three fundamental questions: What question are you answering? Who are you writing for? What will have changed in the reader's life when the book is finished? If you can answer these three questions honestly, the remaining content fits within this framework. The plan does not have to be long and detailed — being clear enough to fit on a single A4 page is sufficient. Even professional writers usually start a 300-page book from a one-page summary. You can do the same: one sentence for the topic, one sentence for the target reader, one sentence for the book's promise. Starting here prevents the endless draft loop."],
      ["Choose a single outcome", "A good book offers the reader a single meaningful transformation. What will someone who finishes the book be able to do, know, or feel? If you can answer this question in one clear sentence, your book has focus. For example: 'Someone who reads this book will learn step by step how to use social media to find freelance clients.' This clarity directly determines the chapter structure, example selection, and tone. Books that try to explain everything at once unfortunately cannot fully explain anything — because each topic takes up some space, but none are covered in sufficient depth. If you are writing your first book, keep the scope narrow; this is not a weakness, it is discipline. Instead of trying to cover freelancing, entrepreneurship, and digital marketing in the same book, focus on just one topic. Narrowing down does not lose you anything — on the contrary, it makes the book finishable and helps you build a stronger connection with the reader."],
      ["Define a single reader type", "Who are you writing for? The more specific the answer, the stronger the book. Books written 'for everyone' in practice do not fully resonate with anyone; content that touches each reader a little truly speaks to no one. Think of your target reader as a concrete person: how old are they, what industry do they work in, what do they know, what do they not know, what problem are they trying to solve, and what resources are they currently using? For example, instead of 'working parents,' 'someone expecting their first child, working remotely, and struggling with productivity' is a much stronger target reader description. The more precisely you define them, the more accurate your tone, word choice, example selection, and even chapter ordering become. Books written for a vague audience quickly become generic, loaded with jargon or an inexplicably plain language, and finding concrete examples becomes difficult. Writing for a single reader type does not restrict you — on the contrary, it sets you free."],
      ["Build a small outline", "For a first draft, 5 to 7 main chapters are sufficient for most guide or expert books. Each chapter should answer a separate question and build on the knowledge of the previous one. You do not need to write perfect chapter titles at this stage — just check whether the flow is logical. A simple test for yourself: Can Chapter 3 be understood without reading Chapter 1? If yes, there is no real connection between these chapters. Once the outline is in place, content production becomes much easier and faster. Because you already know what you will cover in each chapter — topic selection, structure building, and content production stages do not mix. The Book Generator wizard starts this process automatically: based on topic and target reader information, the system suggests an outline, and you edit and approve it. Starting with a ready-made skeleton instead of a blank page keeps the momentum going from the very beginning."],
      ["Set a realistic scope", "You do not have to cover everything in your first book — in fact, trying to do so is one of the most common reasons for not finishing it. Covering less but in depth is far more valuable than covering a lot superficially, both for the reader and the writer. A dense, concrete 60-page guide leaves a much stronger impact and is completed much faster than a repetitive, loose 200-page book. When defining scope, use this elimination question for yourself: 'If I remove this chapter, what would my target reader genuinely lose?' If the answer is not clear, that chapter is probably not essential. Write only the indispensable content; leave the rest for a next book, a blog, or a course. Once the scope decision is made, production flows much more smoothly."],
      ["How does the tool speed up this process?", "The Book Generator wizard flow is designed precisely to accelerate this planning stage. After entering topic, target reader, tone, and language information through a few short questions, the system suggests a concrete outline — complete with chapter titles, ordering, and overall structure. You can approve this suggestion directly, edit the titles one by one, or write them entirely from scratch. The biggest advantage is this: instead of starting with a blank page, you start with a structure you can work on. In your first book, the biggest obstacle is usually not a lack of information, but being unable to answer the question 'where do I start?' The wizard removes this question from your plate and moves you straight into the content decision stage. Even experienced writers use similar outlining processes — the difference is that the tool reduces this time to seconds."],
    ],
  },
  {`;

// Do the replacement
const newContent = content.substring(0, blockStart) + newBlock + content.substring(blockEnd);

// Write the file
fs.writeFileSync(filePath, newContent, 'utf8');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('\n--- VERIFICATION ---');
console.log('Has new title "How Do I Plan My First Book?":', verify.includes('How Do I Plan My First Book?'));
console.log('Has new category "Getting Started":', verify.includes('Getting Started'));
console.log('Has new readTime "7 min":', verify.includes('"7 min"'));
console.log('Still has old title:', verify.includes('İlk Kitabımı Nasıl Planlarım?'));
console.log('Still has old category "Başlangıç":', verify.includes('Başlangıç'));
console.log('Still has old readTime "7 dk":', verify.includes('"7 dk"'));
console.log('File size:', verify.length);
console.log('\nDONE');
