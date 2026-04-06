import { PUBLIC_BILLING_EMAIL, PUBLIC_SUPPORT_EMAIL } from "@/lib/contact-shared";
import {
  KDP_GUARANTEE_CLAIM,
  KDP_LIVE_BOOKS_CLAIM,
  NO_API_COST_CLAIM,
  REFUND_GUARANTEE_CLAIM,
} from "@/lib/site-claims";

export const audienceGroups = [
  {
    title: "Those who want to turn expertise into a book",
    text: "For coaches, consultants, instructors, and professionals who have accumulated knowledge in a niche.",
  },
  {
    title: "Those who want to publish their first guide book",
    text: "For those who want to produce a reliable, structured, and publishable book around a single topic.",
  },
  {
    title: "Those who want to produce English content",
    text: "So you can structure and produce your book in English even though the interface stays in Turkish.",
  },
] as const;

export const deliverables = [
  "Title, subtitle, and book description",
  "Chapter-by-chapter outline and working skeleton",
  "Editable chapter content",
  "Cover workflow and output files",
  "EPUB, PDF, and additional formats on eligible plans",
  "Research outputs, topic and keyword suggestions",
] as const;

export const howItWorksSteps = [
  {
    step: "1",
    title: "Define your book topic and genre",
    text: "Enter your book genre, topic, and target reader with short answers. No blank page — the AI wizard guides you.",
  },
  {
    step: "2",
    title: "Approve the outline and chapter plan",
    text: "AI suggests title, subtitle, and chapter flow. You edit, approve — or write from scratch.",
  },
  {
    step: "3",
    title: "Generate your book with AI",
    text: "Select writing style and cover direction, then start generation. First preview ready in 10–30 seconds.",
  },
  {
    step: "4",
    title: "Review the free preview",
    text: "See the cover, chapter list, and first 20% of content. Go back and change if you don’t like it.",
  },
  {
    step: "5",
    title: "Download KDP-ready EPUB and PDF",
    text: "Unlock full access, download your book. Upload to Amazon KDP or your own publishing channel.",
  },
] as const;

export const howItWorksPageSteps = [
  {
    step: "1",
    title: "Describe your topic",
    text: "Enter your book topic, target reader, and language into the wizard. 5 short questions, zero blank pages.",
    output: "Clear book direction and title suggestion",
  },
  {
    step: "2",
    title: "Approve the outline, start generation",
    text: "AI suggests title, chapter flow, and topic summary. You edit and approve. Then generate the entire book with one click.",
    output: "Visible chapter plan and book structure",
  },
  {
    step: "3",
    title: "EPUB ve PDF'ini al",
    text: "Önizlemeyi gör, beğenirsen tam kitabı aç. Çıktı dosyaları KDP'ye yüklemeye hazır gelir.",
    output: "Preview, EPUB, and PDF output files",
  },
] as const;

export const premiumPlan = {
  id: "premium",
  name: "One Book",
  price: "$4",
  interval: "one-time",
  label: "1 book — no subscription, yours forever",
  description: "Pay once, the book is yours — from draft to EPUB, everything included, no subscription.",
  badge: "Try and decide",
  perUnit: null,
  features: [
    "1 complete book — all chapters unlocked",
    "AI cover generation — 3 styles, custom color palette",
    "EPUB + PDF output — ready for KDP upload",
    "Multilingual production (Turkish, English, and more)",
    "Tone and target audience settings (from wizard)",
    `${KDP_GUARANTEE_CLAIM} + ${REFUND_GUARANTEE_CLAIM}`,
  ],
} as const;

export const plans = [
  {
    id: "starter",
    name: "Basic",
    price: "$19",
    interval: "monthly",
    label: "10 books per month",
    badge: null,
    perUnit: "$1.90 per book",
    annualMonthlyPrice: "$15",
    description: "Build your rhythm with 10 books per month — $1.90 per book, KDP-ready output.",
    features: [
      "10 books per month generation",
      "20 covers per month — AI styles, customizable",
      "EPUB + PDF output — for each book",
      "Quick draft with wizard: topic → structure → chapters",
      "Chapter editor — edit, regenerate, modify",
      "Multilingual book support",
      "Book workspace — all projects in one place",
      "Standard email support",
    ],
  },
  {
    id: "creator",
    name: "Writer",
    price: "$39",
    interval: "monthly",
    label: "30 books per month",
    badge: "Most Popular",
    perUnit: "$1.30 per book",
    annualMonthlyPrice: "$31",
    decoyNote: "37% of Studio's books at 49% of the price",
    description: "Which topic sells? Research, produce 30 books, grow on KDP — $1.30 per book.",
    features: [
      "30 books per month generation",
      "60 covers per month — full customization",
      "Research center — KDP trend and keyword analysis",
      "Market gap analysis — competitor book scanning",
      "EPUB, PDF and HTML outputs",
      "Per-chapter regeneration and tone adjustment",
      "Multilingual series production (publish same topic in different languages)",
      "Priority support",
    ],
  },
  {
    id: "pro",
    name: "Studio",
    price: "$79",
    interval: "monthly",
    label: "80 books per month",
    badge: null,
    perUnit: "$0.99 per book",
    annualMonthlyPrice: "$63",
    description: "80 books/month, API access, automation — $0.99 per book, no extra billing.",
    features: [
      "80 books per month generation — full capacity",
      "200 covers per month",
      "All output formats: EPUB, PDF, HTML, Markdown",
      "Research center + advanced KDP market analysis",
      "Series and theme-based bulk production",
      "Chapter templates and customized tone profiles",
      "API and automation access — connect to your systems",
      NO_API_COST_CLAIM,
      "Priority support + custom onboarding guidance",
    ],
  },
] as const;

export const faqSections = [
  {
    title: "General",
    items: [
      [
        "What does this product do?",
        "It takes your idea, generates an outline, produces chapters, and converts your book into publishable output files.",
      ],
      [
        "Can I generate content in English?",
        "Yes. The interface stays in Turkish, but book content can be produced in English or any other language you choose.",
      ],
      [
        "Can a first-time user understand this?",
        "Yes. The main workflow consists of a 5-question wizard and 3 basic steps: idea, outline, publish.",
      ],
      [
        "Is the preview really free? Do I need card details?",
        "Yes, completely free. You can complete the wizard, see your cover and chapter plan without registration or card details. The first 20% content preview is also included. Payment is only required when you want the full book and output files.",
      ],
      [
        "Is AI-generated content really usable quality?",
        `The output is a structured outline — not like a professional editor, but a ready-to-edit skeleton instead of starting from a blank page. You can modify, regenerate, or replace any chapter with your own text. ${KDP_LIVE_BOOKS_CLAIM} and our books are prepared with ${KDP_GUARANTEE_CLAIM}.`,
      ],
      [
        "Who is this product NOT suitable for?",
        "It is not designed for novel or fiction writers, those seeking academic formatting (footnotes, bibliography), or technical documentation needs. It's the right tool for guides, expertise books, info products, or KDP non-fiction.",
      ],
    ],
  },
  {
    title: "Book Production",
    items: [
      [
        "How do I create a book?",
        "Enter brief information such as topic, target reader, tone, and language. The system builds an outline and chapter flow based on that.",
      ],
      [
        "Do I have to generate chapters before approving the outline?",
        "No. It is recommended to decide on the outline first, then proceed to chapter generation.",
      ],
      [
        "Can I edit the book later?",
        "Yes. Chapter contents and book metadata can be updated in the workspace.",
      ],
      [
        "Can I generate just a single piece like an introduction or summary?",
        "The main workflow is focused on full book production. In advanced workflows, you can also work on specific chapters.",
      ],
      [
        "Can I write in Turkish and produce an English book?",
        "Yes. You can fill out the wizard entirely in Turkish; the system produces content in your chosen language — including English. No translation tool needed. Converting your Turkish knowledge into an English KDP book is one of the strongest use cases for this product.",
      ],
      [
        "How many chapters are generated? Can I control the length?",
        "You approve the number of chapters and their titles during the outline stage; the system typically suggests a 7–12 chapter outline. You can add, remove, or reorder chapters. Chapter length is also an adjustable parameter.",
      ],
    ],
  },
  {
    title: "Cover and Design",
    items: [
      [
        "Can I add a cover?",
        "Yes. Local cover generation, manual upload, and AI-assisted cover options are available in supported workflows.",
      ],
      [
        "Are back cover and additional images supported?",
        "Yes. Front and back cover files can be managed in the publishing and asset workflows within the workspace.",
      ],
      [
        "Are covers generated automatically?",
        "If you want, an automatic workflow is used; or you can proceed entirely with your own uploaded images.",
      ],
    ],
  },
  {
    title: "Delivery and Outputs",
    items: [
      [
        "What files do I receive?",
        "Depending on your plan and selection, you receive EPUB, PDF, HTML, Markdown, and additional e-book formats where applicable.",
      ],
      [
        "Which output is recommended first?",
        "It is recommended to get EPUB first. After checking the structure, you can move on to PDF and other formats.",
      ],
      [
        "Where are the outputs stored?",
        "Each book is stored in its own folder with timestamped output folders.",
      ],
      [
        "Can I upload the EPUB file directly to Amazon KDP?",
        `Yes. The generated EPUB is compatible with Amazon KDP's standard upload workflow. Including cover and metadata, ${KDP_LIVE_BOOKS_CLAIM}. Our books are prepared with ${KDP_GUARANTEE_CLAIM}; for a pre-publish checklist, you can also check the KDP guide in the blog section.`,
      ],
    ],
  },
  {
    title: "Rights and Publishing",
    items: [
      [
        "Do I own the content?",
        "Since you provide the topic, direction, edits, and final approval, control of the resulting book belongs to the user.",
      ],
      [
        "Can I publish on KDP or other platforms?",
        "Yes. The product produces digital outputs; the publishing decision and compliance with platform rules are the user's responsibility.",
      ],
      [
        "Do you provide ISBNs?",
        "No. Metadata management is available, but ISBN procurement must be handled by the user or publisher.",
      ],
    ],
  },
  {
    title: "Subscription and Payment",
    items: [
      [
        "Can I change my plan?",
        "Yes. Package upgrade, downgrade, or cancellation can be managed from the billing area.",
      ],
      [
        "Do unused credits roll over?",
        "No. Monthly credits do not carry over to the next period.",
      ],
      [
        "What if I chose the wrong plan?",
        "Submit a change or refund request through support; we evaluate and respond as quickly as possible.",
      ],
      [
        "What does the $4 one-time payment include?",
        "The $4 Single Book plan provides full access for one book without a monthly subscription: all chapters, cover, EPUB, and PDF output. No time limit. Those who want to produce multiple books can opt for monthly plans, but this is the lowest entry point for trying your first book.",
      ],
    ],
  },
  {
    title: "Support",
    items: [
      [
        "How do I get support?",
        "You can get technical, delivery, or billing support through the support channels on the contact page.",
      ],
      [
        "How long does it take to get a response?",
        "The standard target is to respond within the first business day. Critical payment issues are handled faster.",
      ],
      [
        "What should I do if the result is not what I expected?",
        "First, review the topic summary and outline. If needed, correct the workflow with rewriting, expanding, or support redirection.",
      ],
    ],
  },
] as const;



export const supportChannels = [
  {
    title: "General support",
    text: "Main support channel for usage questions, account access, and delivery flow.",
    value: PUBLIC_SUPPORT_EMAIL,
  },
  {
    title: "Billing",
    text: "Billing-focused support for plan, cancellation, and payment issues.",
    value: PUBLIC_BILLING_EMAIL,
  },
  {
    title: "Response target",
    text: "Within the first business day for standard requests, faster for critical payment issues.",
    value: "1 business day",
  },
] as const;

export const blogPosts = [
  {
    slug: "how-to-validate-a-nonfiction-book-idea",
    title: "How to Validate a Nonfiction Book Idea",
    summary: "A framework for quickly testing whether a nonfiction book idea is worth publishing and turning into a product.",
    category: "Research",
    readTime: "6 min",
    datePublished: "2026-04-02",
    dateModified: "2026-04-02",
    intro: "A book idea can sound appealing but still be weak. Especially on the nonfiction side, the real question is not: is the topic interesting? The real question is: does this topic promise a clear outcome for a specific reader, is it narrow enough, does it generate commercial or authority value, and can it carry a solid 6-10 chapter spine? This article covers the practical path to validating a book idea — not through fiction instincts, but from the perspective of authority books, lead magnets, and KDP nonfiction.",
        sections: [
      ["Reader clarity comes before topic", "In a nonfiction idea, the first check is not the topic title; it is the reader definition. 'A marketing book' is weak; 'a client acquisition system for B2B SaaS founders to land their first 10 customers' is strong. Because the second statement directly says who it is written for and in what context it produces value. If the reader cannot be described in a single sentence, the title, the promise, and the chapter structure all become blurry. Good idea validation always starts with reader clarity."],
      ["No outcome sentence means an incomplete idea", "What will the reader be able to do after finishing the book? Make decisions faster, acquire clients, build a cleaner system, launch a publication? If there is no outcome sentence, the book turns into a mere pile of information. Strong nonfiction ideas do not just explain topics; they carry the reader from one state to another. If you cannot state the transformation in one sentence, the idea is still raw."],
      ["If the scope is not narrow, credibility weakens", "The most common mistake beginners make is starting with too broad a topic. Fields like 'leadership', 'personal development', 'digital marketing' are category names, not book ideas. What turns a category into an idea is narrowing: segment, problem, method, time horizon, or use case. Narrow scope does not shrink the book; it makes it completable, readable, and defensible."],
      ["Material gives the depth signal", "If you have notes, workshop content, client questions, blog posts, or your own framework, the idea is stronger. Because nonfiction books are most often packaged expertise. Having no material does not mean the idea is bad; but a short guide or lead magnet might be a more appropriate starting point than a book. Depth comes not just from topic selection but from the existence of a content inventory."],
      ["Ideas must not only be readable but useful", "Whether authority book, lead magnet, or paid guide, good nonfiction ideas produce value beyond the book itself. They facilitate a sales conversation, strengthen expert image, collect emails, or create a KDP opportunity. Ideas that produce no function carry only writing motivation; but a sustainable publishing system also requires function."],
      ["The best test: can you pull out a mini outline?", "The fastest way to validate an idea is to write a 6-8 item mini outline for it. If sections like introduction, core problem, main framework, mistakes, implementation plan, and case study emerge naturally, the idea carries a spine. If the outline comes out forced, the problem is usually not in the content but in positioning. Fix the angle first, then return to the outline."],
    ],
  },
  {
    slug: "authority-book-mu-lead-magnet-book-mu",
    title: "Authority Book or Lead Magnet Book?",
    summary: "Clarifies when the same topic works better as an authority book and when it works better as a lead magnet.",
    category: "Getting Started",
    readTime: "6 min",
    datePublished: "2026-04-02",
    dateModified: "2026-04-02",
    intro: "Many experts get stuck on the same question: should my topic become a full book, or a short but high-converting lead magnet? The issue is usually not a lack of content; it is the format decision. An authority book builds trust, a lead magnet collects demand. The same raw material can transform into two different structures. This article separates when each approach is the right choice.",
    sections: [
      ["When is an authority book the right choice?", "If your goal is trust, expertise perception, and premium positioning, an authority book is the better choice. This format builds broader context, presenting you not merely as a tactic provider but as a thought leader. If you offer speaking, consulting, workshops, or higher-priced services, an authority book functions as a long-term asset."],
      ["When does a lead magnet book work better?", "If you want to collect emails faster, solve a single problem clearly, and move the user to a specific next step, the lead magnet format is more effective. In this structure, scope is kept narrow, section count is limited, and the CTA stays visible. The goal is not to deliver a full book experience; it is to collect demand in exchange for a quick win."],
      ["How can the same topic become two different structures?", "For example, a topic like 'client acquisition system for coaches' as an authority book develops positioning, trust, and system logic at length. As a lead magnet, it narrows down to a single sub-problem: setting up the first discovery call system. The difference is not the topic but the scope and CTA architecture. That is why the format decision usually stems from business objectives rather than the title."],
      ["Decision criterion: depth or speed?", "An authority book requires more editorial effort but creates a more lasting impact. A lead magnet is produced faster and measured more clearly. If you have a deep framework with multiple sub-topics, an authority book makes sense. If you have a single problem you want to test quickly, a lead magnet is more efficient."],
      ["What is the sign of choosing the wrong format?", "If you constantly feel the need to squeeze in CTAs while writing an authority book, you probably should be writing a lead magnet instead. If you keep adding new sections and expanding scope while preparing a lead magnet, it likely has authority book potential. A feeling of forcing is often the first sign of format mismatch."],
      ["Practical decision rule", "When the reader finishes the book, do you want them to take you more seriously, or to leave you their contact information? In the first case, an authority book carries more weight; in the second, a lead magnet. If unsure, create a mini outline and place the CTA at the end. If the outline keeps expanding, you are heading toward the authority side; if it tightens around a single outcome, you are heading toward the lead magnet side."],
    ],
  },
  {
    slug: "ai-ile-yazilan-kitap-kime-aittir",
    title: "Who Owns an AI-Written Book?",
    summary: "Explains content control, ownership, and user responsibility in simple terms.",
    category: "Rights",
    readTime: "7 min",
    datePublished: "2024-10-15",
    dateModified: "2025-02-01",
    intro: "As AI book-writing tools become widespread, the most frequently asked question remains the same: Am I truly the owner of this book? As long as the topic, direction, and final decision are yours, the answer is largely clear — but understanding the legal and practical dimensions builds a real foundation of confidence before publishing. There is not yet a fully established legal framework for AI-generated content worldwide; it varies from country to country and platform to platform. This article is not legal advice — it summarizes the essential framework and practical steps you need to know before publishing your book, in simple terms. A few minutes are enough to understand that the more decisions you made, the more that work belongs to you.",
    sections: [
      ["How does copyright arise?", "Traditional copyright law begins with the human mind that creates a work. When creativity, originality, and freedom of expression come together, a right is born. As of today, the AI model is not recognized as a legal subject in most countries — including the US, the EU, and Turkey. Therefore, no copyright claim arises on behalf of the model itself. The real question is: how much creative contribution did the person using the AI tool make? If you chose the topic, defined the target audience, approved the chapter structure, read and edited the text, and added personal examples or perspectives — your mental effort played the decisive role in the resulting work. This situation is fundamentally no different from an author who hires a ghostwriter: they produce the content, but the book's owner determines the topic, tone, and direction. To keep your ownership claim strong, it is sufficient to play an active and documentable role in the process. Users who remain passive, take random content without providing a brief, and publish directly may be in a weaker position — but for conscious, step-by-step users, the picture is much clearer."],
      ["What does using an AI tool change?", "Using an AI tool affects how the product is created, not whether it belongs to you. Just as an author using a word processor is the undisputed owner of their writing, a user who builds an outline with an AI assistant, generates and edits chapters keeps full control of their book. A photographer did not invent the camera, but the photo they took belongs to them — because they chose the framing, the lighting, the moment, and the intent. The same logic applies to book authorship. What matters is not the tool but the decision chain: which topic did you choose, which chapter titles did you accept, which did you change or remove, what examples and personal experiences did you add to the text? Book Generator places you at the center at every stage of this process — the system proposes a draft, but you are the one who approves and shapes every decision. Every moment you edit, rewrite chapters, or add a personal perspective, you are concretizing your creative effort on that content. This structure documents your active role in the production process both practically and legally."],
      ["What do KDP and publishing platforms ask?", "Major digital publishing platforms, including Amazon KDP, require you to explicitly declare that you own the rights to the content you upload. This declaration is necessary to prevent copyright infringement or copied content from being uploaded. Platforms do not currently ban AI-generated content outright — but they do require the content to be original, not copied from another source, and non-misleading. AI-generated content generally passes this originality test as long as it is not directly copied from the model's training data. However, some platforms have started requiring disclosure for content that is prominently AI-assisted. Amazon's publisher guidelines are also being updated in this area. The practical recommendation is: check the current platform policy before uploading, specifically whether there is a disclosure or statement requirement regarding AI generation. This small step keeps the likelihood of future platform issues close to zero."],
      ["Ways to keep practical control in your hands", "A few concrete steps help keep your ownership strong in practice, and none of them are time-consuming. First step: write or actively edit the brief and outline yourself. Instead of blindly approving the system's suggested chapter titles, changing at least a few of them documents your decision trail. Second step: read every generated chapter and rewrite at least a few sentences yourself or add a personal example. Third step: let the book's topic draw from your own expertise, experience, or research — generating a completely generic draft on a completely generic topic is the weakest position. Fourth step: export the final file from your own account and publish from your own publisher account. These four steps together make the question of who owns the published book practically indisputable. Additionally, keeping notes from the production process, editing records, or brief history after publishing the book serves as supporting documentation in case of a dispute."],
      ["Honest answers to common concerns", "The most frequently heard concern is: what if the AI company uses the generated content for its own purposes? This is a legitimate and well-placed question about the transparency of the service agreement. Book Generator's policy is clear: the generated content belongs to the user, and the platform does not share user content with third parties or use it in model training. It is always a wise practice to read the privacy policy and terms of use before choosing any tool. The second common concern: if two users enter similar briefs, will similar content be produced? On generic topics, structural similarity can occur — just as two different authors might write 'a beginner's guide to freelancing.' But a unique voice, personal examples, audience-specific tone, and editing layer meaningfully eliminate this structural similarity. The more personal imprint you leave on the output, the more distinctive and uniquely yours the book becomes. Third concern: is AI-generated content obvious, will readers notice? When personal examples, concrete context, and an editing layer are added, this issue is largely resolved."],
      ["Conclusion: whose book is it?", "If you chose the topic, defined the reader, approved the draft, read and shaped the chapters, and made the final decision — this is your book. AI is a speed and structure tool; you are the architect, editor, and publisher of the book. Using the tool does not eliminate ownership — just as a photographer using a camera, an architect using design software, or a journalist using a voice recorder does not make the work any less theirs. What matters is not the tool but the human mind and decision process behind it. The effort you put into your book, every editing step you take, and every unique perspective you offer — all of these make you the true owner of that book."],
    ],
  },
  {
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
  {
    slug: "epub-ve-pdf-farki",
    title: "EPUB ve PDF Farkı Nedir?",
    summary: "İlk kullanıcı için hangi formatın ne zaman doğru olduğunu açıklar.",
    category: "Yayın",
    readTime: "6 min",
    datePublished: "2024-11-15",
    dateModified: "2025-02-15",
    intro: "Kitabını bitirdin, export zamanı geldi — ama hangi format? EPUB mi, PDF mi, ikisi birden mi? Bu soru görünürde basit, ama yanlış format seçmek gereksiz teknik sorunlara, platform red bildirimlerine veya okuyucu deneyimini bozan görüntü bozukluklarına yol açabilir. Çoğu kullanıcı her iki formatı da almak istiyor, haklı olarak — ama hangisinden başlaması gerektiğini ve ikisi arasındaki farkın tam olarak ne anlama geldiğini bilmiyor. Bu yazı uzun teknik açıklamalar yerine doğrudan sonuca götürüyor: doğru formatı, doğru amaç için, doğru zamanda seç.",
    sections: [
      ["EPUB nedir, nasıl çalışır?", "EPUB, elektronik yayıncılık için geliştirilmiş açık bir standarttır ve adı 'electronic publication' kelimelerinden gelir. En temel özelliği akışkan yapısıdır: metin, okuyucunun ekran boyutuna, çözünürlüğüne ve font tercihine göre otomatik olarak yeniden şekillenir. Telefonda okurken satırlar daralır ve uyum sağlar, tablette genişler, e-kitap okuyucuda kullanıcı font boyutunu büyütüp küçültebilir — içerik her koşulda okunabilir kalır. Bu esneklik, EPUB'u dijital dağıtım için standart haline getirir. Amazon Kindle, Apple Books, Kobo, Google Play Books ve neredeyse tüm büyük e-kitap platformları EPUB 3 formatını destekler. Amazon, eskiden .mobi formatını öneriyordu; ancak 2022'den itibaren EPUB'u birincil format olarak benimsedi. Kısacası dijital olarak dağıtmayı, KDP'ye yüklemeyi veya okuyucuya doğrudan göndermeyi planlıyorsan EPUB senin birincil çıktın olmalı."],
      ["PDF nedir, ne zaman tercih edilir?", "PDF, 'Portable Document Format' kelimelerinin kısaltmasıdır ve Adobe tarafından 1990'ların başında geliştirilmiştir. Temel özelliği sabit düzendir: sayfalar tam olarak tasarlandığı gibi görünür — font boyutu, satır aralığı, görsellerin yeri, sayfa boşlukları hiçbir zaman değişmez. Hangi cihazda, hangi yazılımda açılırsa açılsın görünüm aynıdır. Bu özellik baskı için idealdir: matbaaya gönderilecek dosyalar, fiziksel kitap üretimi, tam sayfa tasarımlı kılavuzlar veya sertifikalar PDF gerektirir. Amazon KDP'de paperback veya hardcover kitap yayınlamak istiyorsan iç metin ve kapak ayrı PDF dosyaları olarak hazırlanmalıdır. Öte yandan dijital okuma için PDF birçok açıdan zahmetlidir: telefon ekranında okunması yorucu, satırları sığdırmak için sürekli yakınlaştırıp uzaklaştırmak gerekir, font boyutu kullanıcı tarafından ayarlanamaz. Bu yüzden e-kitap platformlarına yükleme için PDF yerine EPUB tercih edilir."],
      ["KDP hangi formatı istiyor?", "Amazon KDP iki farklı yayın türü için iki farklı format bekler. Dijital kitap (Kindle eBook) yayınlamak için EPUB 3 formatı gereklidir ve KDP bu formatı doğrudan kabul eder. 2022 öncesinde .mobi formatı da yaygın olarak kullanılıyordu, ancak Amazon artık EPUB'u resmi olarak öneriyor ve yeni yüklemelerde EPUB tercih ediliyor. KDP'nin kendi önizleme aracı Kindle Previewer, EPUB dosyanı yükleyip Kindle ekranında nasıl görüneceğini simüle etmenizi sağlar — yükleme öncesinde bu kontrolü yapmak iyi bir alışkanlıktır. Baskılı kitap (paperback veya hardcover) yayınlamak için ise PDF gereklidir. İç metin tek bir PDF, kapak ise ayrı bir PDF olarak hazırlanır. Kapak PDF'inin boyutu sayfa sayısına göre belirlenir çünkü sırt kalınlığı sayfa sayısına göre değişir. KDP bu hesaplamayı kolaylaştırmak için ücretsiz bir kapak şablonu aracı sunuyor. Özetle: dijital için EPUB, baskı için PDF — ikisini de yapmayı düşünüyorsan her iki formatı da hazır bulundurman gerekir."],
      ["Önce hangisini almalısın?", "Pratik öneri nettir: önce EPUB al, PDF'i sonraya bırak. EPUB aldığında kitabın yapısını, bölüm sıralamasını, başlık hiyerarşisini ve genel akışını bir e-kitap okuyucuda, Kindle Previewer'da veya tarayıcı tabanlı araçlarla kolayca kontrol edebilirsin. Hangi bölüm başlığı yanlış hiyerarşide görünüyor, içindekiler tablosu doğru linkleri mi gösteriyor, akış mantıklı mı — bunları EPUB'da görmek çok daha kolaydır. Yapısal sorunları burada yakalayıp düzelttikten sonra PDF almak hem zaman kazandırır hem de PDF'te gereksiz düzeltme döngüsünün önüne geçer. Sadece dijital dağıtım yapacaksan PDF'e hiç gerek olmayabilir. Baskı düşünüyorsan sıraya göre: önce EPUB ile içerik ve yapıyı doğrula, ardından PDF ile baskı düzenini kontrol et. İkisini aynı anda almak da mümkün; ancak kontrol mantığı açısından EPUB her zaman ilk adım olmalı."],
      ["Dönüşüm sürecinde dikkat edilmesi gerekenler", "EPUB üretirken en kritik nokta başlık hiyerarşisidir. H1 kitap başlığı, H2 bölüm başlıkları, H3 alt bölüm başlıkları olarak doğru işaretlenmezse içindekiler tablosu yanlış oluşur ve bazı okuyucu uygulamalarında gezinme bozulur. Görsellerin EPUB içine gömülü olup olmadığını kontrol et — bağlantılı görseller bazı platformlarda görünmeyebilir. Ayrıca EPUB dosyanı yayınlamadan önce epubcheck gibi bir doğrulama aracıyla test etmek, KDP'nin olası red bildirimlerinin önüne geçer. PDF üretirken ise kenar boşlukları, font gömme ve sayfa boyutu kritik öneme sahiptir. KDP baskılı kitaplar için genel trim size seçenekleri sunar; en yaygını 6x9 inçtir. Bleed alanı olan görseller için ek ayar gerekir. Book Generator bu teknik detayları büyük ölçüde sizin adınıza yönetir ve çıktıları platform uyumlu üretir; yine de son kontrol adımını atlamak iyi bir alışkanlık değil."],
      ["Özet: formatı amacına göre seç", "EPUB: dijital okuma, e-kitap platformları, Amazon Kindle, Apple Books, Kobo, mobil cihazlar. Kullanıcı font boyutunu ayarlayabilir, metin ekran boyutuna uyum sağlar, dosya boyutu küçüktür. PDF: baskı, sabit düzen, matbaa dosyası, KDP paperback iç metin ve kapak. Tasarım piksel mükemmelliğinde korunur, platform bağımsız görünür. Her iki format da farklı amaçlar için gerekli olabilir ve biri diğerinin yerine geçemez. Başlangıç noktası her zaman EPUB olsun: yapıyı orada doğrula, içeriği kontrol et, onayladıktan sonra PDF'e geç. Book Generator her iki formatı da export seçenekleri olarak sunar; ikisini aynı anda almak için ekstra çaba gerekmez."],
    ],
  },
  {
    slug: "kdpye-yuklemeden-once-ne-kontrol-etmeli",
    title: "KDP’ye Yüklemeden Önce Ne Kontrol Etmeli?",
    summary: "Yayın öncesi kısa ama pratik bir kontrol mantığı sunar.",
    category: "KDP",
    readTime: "7 min",
    datePublished: "2024-12-01",
    dateModified: "2025-03-01",
    intro: "Your book is ready, it's time to upload. Ama KDP yükleme ekranına geçmeden önce birkaç dakika harcayıp temel kontrolleri yapmak, ilerleyen günlerde düzeltme döngüsünden seni kurtarır. Reddedilen başvurular ve düşük dönüşüm oranları çoğunlukla önlenebilir hatalardan kaynaklanır — başlık yanlış kategoride, kapak boyutu hatalı, açıklama ilk cümlede okuru kaybediyor. Bu yazı uzun bir kontrol listesi değil; yükleme öncesi yapman gereken en kritik beş kontrolü, her birinin neden önemli olduğunu ve nasıl düzeltileceğini pratik örneklerle anlatıyor. Bu kontrolleri yapan yayıncılar, yayın sonrası 'neden satış yok?' sorusunu çok daha az soruyor.",
    sections: [
      ["Metadata net mi?", "KDP’de başlık, alt başlık ve kitap açıklaması en kritik alandır çünkü Amazon algoritması bu alanlardaki kelimelere bakarak kitabı sınıflandırıyor ve potansiyel okurlarına gösteriyor. Başlık kitabın ne hakkında olduğunu tek cümlede anlatmalı — belirsiz ya da sadece yaratıcı başlıklar arama trafiğini öldürür. Örneğin ‘Dijital Özgürlük’ yerine ‘Freelance Hayata Geçiş: 90 Günde Kurumsal İşten Bağımsız Kariyere’ çok daha güçlü bir başlıktır. Alt başlık varsa hedef kitleyi veya vaadi netleştirmeli; okura ‘bu kitap senin için mi?’ sorusunu yanıtlatmalı. Açıklamanın ilk iki cümlesi en kritik alan: birçok platformda açıklamanın tamamı görünmez, yalnızca ilk kırk-elli kelime ekranda yer alır. ‘Bu kitapta X öğreneceksin’ ile başlamak yerine okurda bir tanıma anı yaratan bir cümle dene: ‘Her sabah işe gitmeye zorlanıyorsan, bu kitap tam senin için.’ Kullandığın anahtar kelimelerin başlık ve açıklamada doğal biçimde geçmesi hem arama sıralamasına hem de okur güvenine katkı sağlar."],
      ["Kategori ve anahtar kelimeler seçildi mi?", "KDP iki kategori ve yedi anahtar kelime seçmenize izin veriyor — bu alanları boş bırakmak ya da rastgele doldurmak ciddi bir keşfedilirlik kaybıdır. Kategori seçimi hem organik arama görünürlüğünü hem de 'En Çok Satanlar' rozet olasılığını doğrudan etkiliyor. Ana kategoride yüzlerce kitabın arasında kaybolmak yerine, daha küçük ama ilgili bir alt kategoride yer almak çok daha değerlidir. Örneğin 'İş ve Kariyer' gibi geniş bir kategori yerine 'Serbest Çalışma ve Fiyatlandırma Stratejileri' gibi niş bir alt kategori, ilk aylarda rakiplerinden sıyrılmana yardımcı olur. Anahtar kelimeler için jargon değil, gerçek okur aramaları düşün: bir kişi Amazon arama kutusuna ne yazar? Bu soruyu yanıtlamak için Amazon'un otomatik tamamlama önerilerini kullan — ücretsiz ve doğrudan gerçek kullanıcı davranışından besleniyor. Bu alanda on dakika harcamak, kitabın aylarca organik erişim farkı yaratabilir."],
      ["İçerik akışı temiz mi?", "Yükleme öncesi içerik kontrolü kelime kelime düzeltme anlamına gelmiyor — asıl hedef yapısal sorunları yakalamak. Önce bölüm başlıklarına bak: sırayla okuyunca bir mantık akışı görüyor musun? Her bölüm bir öncekinin üzerine inşa ediyor mu, yoksa birbirinden bağımsız parçalar mı sıralanmış? Sonra her bölümün yalnızca ilk cümlesini oku: bölüm ne hakkında olduğunu ilk cümlede net söylüyor mu? Bu hızlı tarama, bağlamdan kopuk bölümleri ve gereksiz tekrarları çoğu zaman saniyeler içinde ortaya çıkarır. Özellikle AI taslağından üretilen içeriklerde aynı fikrin farklı bölümlerde farklı kelimelerle yinelendiği sık görülür. Bir de 'bunu çıkarırsam okur ne kaybeder?' testini uygula: eğer bir bölümü çıkardığında kitap daha akıcı okunuyorsa o bölüm muhtemelen gereksizdir. Temiz bir akış iade oranını düşürür ve olumlu yorum alma ihtimalini artırır."],
      ["Kapak KDP gereksinimlerini karşılıyor mu?", "KDP dijital kitap kapağı için minimum 1000 piksel genişlik, ideal 2560x1600 piksel çözünürlük ve 1.6:1 en boy oranı gerektiriyor. Bu şartları karşılamayan kapaklar ya yükleme sırasında reddediliyor ya da platformda bulanık ve pikselleşmiş görünüyor — her iki durum da profesyonellik algısını anında zedeliyor. Baskılı kitap için ön kapak, arka kapak ve sırt birleşik tek PDF olarak hazırlanmalı; sırt genişliği sayfa sayısına göre değişiyor ve KDP'nin şablon hesap aracını kullanmak zorunlu. Kapağı yüklemeden önce küçük thumbnail boyutuna indirip başlığın hâlâ okunabilir olup olmadığını test et. Kindle mağazasında kitaplar liste görünümünde küçücük bir kare olarak görünüyor; bu boyutta başlık seçilemeyen kapaklar tıklanma almıyor. Kapak türle de uyuşmalı: rehber ve iş kitabı görünümü — temiz zemin, tipografi ağırlıklı, minimal ikon — güven sinyali verirken kurgu kapağı gibi tasarlanmış bir non-fiction kapak okuru şaşırtır ve dönüşümü düşürür."],
      ["Dosya teknik olarak sorunsuz mu?", "EPUB dosyasını KDP’ye yüklemeden önce Kindle Previewer uygulamasıyla ya da tarayıcı tabanlı KDP önizleme aracıyla test etmek ciddi sorunları erkenden yakalamanı sağlar. Kontrol edilmesi gereken başlıca noktalar: İçindekiler tablosu doğru bölümlere link veriyor mu? Her bölüm başlığı gerçekten yeni bir sayfada başlıyor mu? Görseller varsa tüm cihazlarda düzgün görünüyor mu? Fontlar EPUB dosyasına gömülü mü? Bu son nokta özellikle önemli: gömülü olmayan fontlar farklı cihazlarda öngörülemeyen görünümler üretiyor ve okuma deneyimini bozuyor. Eğer baskılı kitap için PDF yüklüyorsan kenar boşluklarının, trim size ayarının ve bleed değerlerinin KDP şartname sayfasındaki ölçülerle uyuştuğundan emin ol. Book Generator çıktıları platform uyumlu üretir ama son doğrulamayı yapmak iyi pratik — bu beş dakikalık kontrol, ilerleyen dönemde saatlik düzeltme turlarının önüne geçer."],
      ["Yayın öncesi son tur", "Beş kontrol tamamlandıktan sonra bir adım daha: kitabı KDP'nin Kindle Previewer aracında baştan sona gözden geçir. Bu araç üç farklı cihaz görünümü sunuyor — telefon, tablet ve e-ink okuyucu. Kitabın üç görünümde de okunabilir ve tutarlı görünmesi yayın kalitesinin temel ölçütü. Sayfa geçişlerinde garip atlama oluyor mu? Bölüm başları her zaman yeni sayfada mı açılıyor? Özel karakterler ya da liste maddeleri doğru görünüyor mu? Bu turda gördüğün küçük sorunları düzeltmek için kitabı tekrar yüklemene gerek yok — dosyayı düzeltip yeni sürümü yükleyebilirsin, yayınlanmış kitabı da sonradan güncelleyebilirsin. Ama büyük yapısal sorunları yayın sonrası fark etmek hem erken alınan olumsuz yorumlar hem de ilk izlenim kaybı açısından maliyetlidir. Bu son tura on dakika ayır; mükemmel olmak zorunda değil, yayınlanmaya hazır olmak yeterli."],
    ],
  },
  {
    slug: "yazmayi-bilmeden-kitap-cikarabilir-miyim",
    title: "Can I Publish a Book Without Knowing How to Write?",
    summary: "Provides the simplest answer to the first-time user's fear.",
    category: "Başlangıç",
    readTime: "6 min",
    datePublished: "2024-12-15",
    dateModified: "2025-03-05",
    intro: "Bu soruyu soran herkes aynı noktada takılır: yazmak zor bir beceri gibi görünür, aylarca pratik gerektirir, belki de herkese göre değildir. Oysa rehber kitap ve bilgi kitabı yazmak, edebi roman yazmaktan bambayla farklı bir iştir. Burada güzel cümleler değil, net bilgi ve doğru yapı önemlidir. Gerçekte çoğu insan yazarlıktan değil, başlamaktan korkuyor — ve başlamak için mükemmel bir yazar olmana hiç gerek yok. Doğru bir araç ve net bir konu, seni beklediğinden çok daha hızlı bir kitap sahibi yapabilir.",
    sections: [
      ["Yazarlık korkusu gerçek mi?", "Evet, gerçek — ama çoğu zaman yanlış kaynaktan geliyor. İnsanlar 'iyi bir yazar olmam lazım' diye düşünür; bu düşünce başlamalarını engelleyen en büyük mentol bloğa dönüşür. Oysa bilgi kitabı yazarlığı edebi bir roman yazmaktan tamamen farklıdır. Bir romanda üslup, dil zenginliği ve kurgusal yaratıcılık merkezde yer alır. Rehber kitapta ise okur senden güzel cümleler değil, net bilgi ve pratik yönlendirme bekler. Zaten bildiğin bir konuda birikimini aktarıyorsun — bu bir arkadaşına bir şeyi anlatmaktan pek farklı değil. Bir koç, danışman ya da deneyimli bir uygulayıcı olarak zaten sahip olduğun bilgiyi kağıda dökmek yazarlık değil, aktarım becerisidir. Farklılık sadece yapıda: kitap, konuşmayı belirli bir sıraya sokar ve okura adım adım ilerler. Bu yapıyı kurmak için de çok güçlü bir yazar olmak gerekmez."],
      ["Yazmak ile yönlendirmek farkı", "Geleneksel kitap yazımında her kelimeyi sen üretirsin — boş sayfayla başlarsın, her cümle senden çıkar, her paragraf senin emeğindir. AI destekli kitap üretiminde ise rolün köklü biçimde değişiyor: sen yönlendiriyorsun, sistem taslak üretiyor, sen düzenliyorsun. Bu süreçte yazarlık becerisi değil, içerik kararları alabilmek önemli. Konu ne olacak? Hangi bölümler olacak? Hangi örnekler verilecek? Hangi ton kullanılacak? Bu soruları cevaplayabiliyorsan kitap üretebilirsin. Cümleleri mükemmel kurmak zorunda değilsin — taslağı görüp 'bu doğru mu, eksik mi, değişmeli mi?' diyebilmek yeterli. Bu rol bir editöre ya da proje yöneticisine benziyor: nihai kararlar sende, üretim ağırlığı araçta. Yazarlık korkusunu bu zihinsel çerçeve ile ele almak, çoğu insanın ilk adımı atmasını kolaylaştırıyor."],
      ["AI aracın rolü nedir?", "Book Generator gibi araçlar seni boş sayfayla başa başa bırakmaz. Konu, hedef okur ve ton bilgilerini girdiğinde sistem bir outline önerir — bölüm başlıkları, önerilen sıralama ve genel yapıyla birlikte. Outline'ı onayladığında bölüm içeriklerini üretir; her bölümü ayrı ayrı gözden geçirip düzenleyebilirsin. Her aşamada sana düzenleme, yeniden üretim veya elle yazma seçeneği sunar. Araç bir taslak makinesidir — heykel kaba halde seni bekliyor, sen son şekli veriyorsun. Bu süreçte 'yazarlık' değil, içerik editörlüğü yapıyorsun: hangi bölüm kalacak, hangi cümle değişecek, hangi örnek daha somut hale getirilecek? Bu kararlar senin uzmanlığını yansıtıyor. Araç sadece taslağı hızlı kuruyor; kitabın kalitesi senin düzenleme gözüne ve konu bilgine bağlı."],
      ["Sihirbaz akışı neden fark yaratıyor?", "İlk kullanıcının en büyük engeli boş ekrandır. 'Nereden başlayayım?' sorusu cevapsız kaldığında insanlar ya mükemmeliyetçilikle felç oluyor ya da süreci sonsuza erteliyor. Neyi soracağını bilmeden, nereden başlayacağını bilmeden geçen her dakika motivasyonu düşürür. Wizard akışı bu engeli ortadan kaldırır: sana sırayla yönlendirilmiş sorular sorar, cevaplarına göre ilerler. Konu ne? Hedef okur kim? Kitap kaç bölüm olsun? Ton nasıl olsun? Bu soruları cevapladığında sistemin elinde bir brief var — ve kısa sürede sana bir taslak sunuyor. Boş ekranda sıfırdan başlamak yerine hazır bir yapıyla başlamak, özellikle ilk kitabında devasa bir fark yaratır. Düzeltmek, sıfırdan kurmaktan her zaman daha kolaydır. Wizard seni bu noktaya taşıyor."],
      ["Net amaç mükemmel prompttan üstündür", "AI araçlarıyla çalışırken en sık duyulan tavsiye daha iyi prompt yazmak olur — 'doğru prompt yazmasını bilmiyorum' kaygısı, başlamayı engelleyen bir başka duvar haline gelir. Ama gerçekte asıl fark yaratan şey teknik prompt becerisi değil, içerik netliğidir. Şu üç soruya cevap verebildiğinde sistem zaten çok daha iyi çalışır: Ne anlatmak istiyorum? Kime yazıyorum? Kitabı bitiren okur ne yapabilecek ya da ne bilecek? Bu sorulara net cevabın varsa, sistem bunu işlevsel bir kitap yapısına dönüştürebilir. Teknik prompt becerisine ihtiyaç duymadan, sadece konunu ve amacını samimi biçimde ifade ederek çok iyi sonuçlar alabilirsin. Prompt mühendisliği değil, içerik sahibi olmak asıl güç kaynağı."],
      ["İlk adımı atmak için ne lazım?", "Sadece bir konu. Ve o konuda başkasına anlatabilecek bir şeyin olması — yıllar içinde öğrendiğin bir beceri, defalarca yaşadığın bir süreç, sürekli soru aldığın bir alan. Yazarlık deneyimine, akıcı bir İngilizceye ya da yayıncılık sektörü hakkında uzmanlığa ihtiyacın yok. Book Generator Türkçe arayüzle çalışır ve kitabı istediğin dilde üretir — Türkçe brief gir, İngilizce kitap çıkar. Kayıt olmadan başlayabilirsin: konu girişi yap, 30 saniyede outline ve kapak önizlemeni gör. Beğenmediysen geri dön, konuyu değiştir, farklı bir yön dene. Risk yok, boş sayfa yok, ön bilgi şartı yok. Yazarlık korkusunu aşmanın en iyi yolu tartışmak değil, bir taslak görmektir — ve bunu görmek için sadece bir konu girmen yeterli."],
    ],
  },
  {
    slug: "kitap-fikri-nasil-secilir",
    title: "How to Choose a Book Idea?",
    summary: "Ties topic selection not just to inspiration, but to reader and need alignment.",
    category: "Research",
    readTime: "8 min",
    datePublished: "2025-01-10",
    dateModified: "2025-03-10",
    intro: "Finding a book idea often feels like waiting for inspiration — one day the right topic will just come. This waiting usually results in the book never being written. Yet the best book ideas are born not from inspiration, but from genuine expertise that aligns with a clear reader need. Topic selection is not an aesthetic decision but a strategic one: the author who chooses the right topic struggles less with writing and more with selling their book. This article moves topic selection from intuition to a systematic decision process grounded in concrete data.",
    sections: [
      ["Why is topic selection so important?", "Starting with the wrong topic makes every stage of the book harder. Content becomes scattered because structuring a topic with unclear boundaries is difficult; the reader base becomes vague because a book that tries to appeal to everyone truly appeals to no one; the marketing message becomes inconsistent because what the book promises is unclear. On the other hand, choosing the right topic makes everything easier: the chapter structure falls into place naturally, examples come to mind faster, addressing the reader becomes easier, and the motivation to finish the book stays high. Two fundamental questions should be asked in topic selection: Do you genuinely have in-depth knowledge on this topic? And is there a real audience searching for this topic and willing to spend money on it? If you can say yes to both, you are at a solid starting point."],
      ["Choose what you know", "Topics without a foundation of expertise or experience quickly reduce content depth. A book composed of general knowledge that repeats information already available on the internet adds no value to the reader. Why should the reader spend their money and time? But a book filtered through your own experience, supported by real examples, providing genuine answers to problems encountered repeatedly in a field is far more powerful. For example, someone who has run an e-commerce business for years can write not 'What Is Dropshipping?' but '7 Supplier Tests You Must Do Before Your First Order' — a specific, experience-based book whose value is far greater than information someone merely researched and compiled. Choose an area where you can teach others, where people consult you, and where you produce real results. This area is your unbeatable advantage."],
      ["Think problem-first", "When people buy books, they are usually paying for one of two things: to solve a problem or to reach a goal. That is why the best-selling non-fiction books are mostly ones that address a clear problem. 'A book on photography' is broad and vague — but 'Shooting in Low Light: Professional Results Without Extra Gear' is a much stronger and more targeted topic. The more specific the topic and the more concrete the problem it solves, the faster it connects with the target reader. When defining your topic, ask these two questions: 'Who will read this book?' and 'After reading it, what will they be able to do or know?' When you can give clear answers to both, the topic becomes much stronger both for content production and marketing. A vague topic means a vague reader and vague sales."],
      ["How do you measure market demand?", "Spending two or three hours making sure a good idea finds real demand prevents months of sales disappointment later. Look at books close to your topic on Amazon: how many titles are there, when were they published, and what do readers praise and criticize in reviews of the best sellers? Reviews are an extremely valuable data source: the shortcomings readers dislike are the opportunity for your book. Check the search volume and trend direction on Google Trends — is it rising, falling, or seasonal? Look at what questions people ask on Reddit and Quora about the topic: questions people ask without hesitation reveal real knowledge gaps. Deciding on your topic without this research is like starting a venture blindfolded."],
      ["KDP keyword araştırması", "Amazon KDP'de yayın yapmayı düşünüyorsan keyword araştırması, konu seçimi sürecinin ayrılmaz bir parçası olmalı. KDP'de anahtar kelimeler hem arama sonuçlarında görünürlüğü hem de kategori sıralamasını doğrudan etkiler. Ücretsiz ve etkili bir başlangıç için Amazon'un kendi arama çubuğunu kullan: konuyla ilgili bir kelime girdiğinde çıkan otomatik tamamlama önerileri, gerçek kullanıcıların ne aradığını yansıtır. Bu öneriler hem popüler aramaları hem de henüz kitapların az olduğu niş alıları gösterebilir. Daha derinlemesine araştırma için Publisher Rocket, Book Bolt veya Helium 10 gibi araçlar aylık arama hacmi ve rekabet yoğunluğu verisi sunar. Hedef şudur: yeterince aranıyor ama yeterince rakip kitap yok. Bu kesişim noktası, yeni bir kitabın en hızlı ivme kazanabileceği alandır. Keyword araştırmasını konu seçiminin önüne koymak yerine seçimin teyidi olarak kullanmak en sağlıklı yaklaşımdır."],
      ["Rekabeti doğru değerlendirmek", "Yüzlerce kitabın olduğu bir niş kötü işaret değildir — aksine talebin güçlü kanıtıdır. İnsanlar o konuya para harcıyor demektir. Ama bu nişte sıyrılmak için farklı bir açı sunman gerekir. Rakip kitaplardaki bir yıldız ve iki yıldız yorumlarına özellikle dikkat et: okurlar ne eksik buluyor, hangi sorular cevaplanmamış kalıyor, hangi bölümler çok teorik ya da çok yüzeysel bulunuyor? Bu şikayetler senin kitabının vaat cümlesi haline gelir: 'Rakiplerin üç yıldız aldığı sorunu ben çözüyorum.' Örneğin, muhasebe yazılımları hakkında çok kitap var ama hepsi teorik kalıyorsa, sen 'Serbest Çalışanlar İçin Pratik Muhasebe: Yazılım Adım Adım' başlığıyla o boşluğu doldurabilirsin. Hiç rakibin olmayan niş ise gerçekten tehlikeli olabilir — ya talep yok ya da kimse o konuya para harcamak istemiyor. İkisi de iyi senaryo değil."],
      ["Son karar: sezgi mi, veri mi?", "İkisi birden — ama ikisi de tek başına yeterli değil. Veri talep olduğunu kanıtlar ve hangi konunun daha fazla potansiyel taşıdığını gösterir. Sezgi ise o konuyu yazarken gerçekten katma değer üretip üretemeyeceğini, süreçte motivasyonu koruyup koruyamayacağını ortaya koyar. Verisi güçlü ama hiç ilgini çekmeyen bir konuyu seçersen içerik üretimi sıkıcı ve zorlayıcı bir hal alır — çoğunlukla yarım kalır. İlgini çeken ama talebini doğrulayamadığın bir konuyu seçersen aylarca emek ver, satış hayal kırıklığıyla karşılaşırsın. İkisinin kesiştiği nokta, hem bilgi ve deneyim sahibi olduğun hem de gerçek bir okur kitlesinin arayıp para harcadığı konudur. Bu kesişimi bulmak için zaman harcamak, her şeyin geri kalanını kolaylaştırır. Book Generator araştırma merkezi bu süreçte konu belirleme ve keyword analizinde somut veri sunarak karar sürecini destekler."],
    ],
  },
  {
    slug: "ingilizce-kitap-icin-nasil-brief-verilir",
    title: "How to Write a Brief for an English Book?",
    summary: "Shows the shortcut to getting better results when producing an English book from a Turkish interface.",
    category: "Prompting",
    readTime: "7 min",
    datePublished: "2025-01-20",
    dateModified: "2025-03-15",
    intro: "As a Turkish speaker, producing an English book is now possible - but when the language changes, the rules of writing a brief change too. The target audience is different, the tone expectations are different, the word choices are different. A good brief ensures the AI system captures the right language, the right tone, and the right content depth. This article teaches you not what to write, but how to write a brief.",
    sections: [
      ["Why is the brief so decisive?", "The AI system does not know your intent, your background, or your goal - it produces based only on the information you provide. The clearer the brief, the closer the output is to the target. A vague brief produces a 'general' book: one that seems written for everyone, truly speaks to no one, and has inconsistent tone. A specific brief, on the other hand, produces a book that solves a particular problem for a particular reader, has a consistent voice, and delivers real value. This difference becomes even more critical in English content because tone, register, and reader expectations diverge significantly from Turkish content. English book readers generally expect direct, action-oriented, jargon-free language. To meet this expectation, the system needs to understand it - and the only thing that communicates this to the system is your brief. The more care you put in, the higher the output quality and the shorter your revision time."],
      ["Define the target reader in English and be specific", "The most critical and most neglected part of the brief is the target reader description. Saying 'Professionals' or 'beginners' is not enough - these descriptions give the system almost no useful information. What industry do they work in? What experience level? What geography? What problem are they struggling with? For example, the difference is enormous: instead of 'business owners,' write 'solo e-commerce founders in the US, running Shopify stores, 1-3 years in business, struggling with customer retention after first purchase.' A description this specific directly affects the system's tone selection, word level, example type, and even chapter ordering. The more detailed your reader description, the more accurate the output - giving the reader a feeling of 'this book was written for me.' Writing a target reader description takes 5 minutes but multiplies output quality."],
      ["Add a tone and style sentence", "Setting the tone is a critical step in English content, and most users skip it. Academic, conversational, authoritative, or friendly? This difference can determine whether the reader finishes the book or not. A short style sentence gives the system a very clear signal. Example: 'Clear, concise, actionable - like a smart friend who knows the subject deeply and does not waste your time.' Or: 'Professional but approachable, no jargon, real-world examples from small business owners.' Or: 'Direct and data-driven, like a Harvard Business Review article but shorter and more practical.' This single sentence ensures the system maintains a consistent voice across all chapters. When tone is not specified, the system usually chooses a neutral and somewhat formal language - which is not right for most guide books and can push the reader away from the very first page."],
      ["Define chapter depth and scope upfront", "Do you want a short quick guide, or a comprehensive playbook? 50 pages or 150 pages? How many subtopics should each chapter cover? Do you want chapters to include practical exercises or checklists? Stating these decisions in the brief upfront both increases production quality and prevents wasting time with unexpected outputs. Example depth instruction: 'Each chapter should cover one focused concept, have 3-4 subsections, include at least one real-world example and one actionable takeaway. Chapters should be 800-1200 words each.' With this instruction, the system produces a 10-chapter content with consistent length and practical value in each. Another benefit of specifying scope: it prevents the system from unnecessarily broadening the topic. An exclusion list in the form of 'do not cover this topic' is also very valuable - knowing what will not be included keeps the system focused."],
      ["Brief template you can use", "Here is a template you can copy and fill in directly: Book title: [title]. Target reader: [very specific description - industry, experience, problem]. Book goal: [what the reader will be able to do after finishing the book - one sentence]. Tone: [style description]. Scope: [how many chapters, how many words per chapter]. Exclude: [topics that will not be in this book]. Language notes: [American English or British? Is jargon acceptable?]. These last two fields are often forgotten but very important. The 'Exclude' list prevents the system from going out of scope. 'Language notes' especially ensures American English usage when targeting the US market on KDP - British English in an American book can receive negative reviews. Filling out the template takes 10 minutes; the time and quality difference it delivers is worth it."],
      ["Common mistakes and how to avoid them", "The most common mistake: giving the brief in Turkish. Even if the system understands the language, writing the target reader description, tone decision, and scope boundaries in English increases consistency. A Turkish brief can put the system into a translation mode bouncing between two languages and cause drift in the output. Second mistake: the topic is too broad. Instead of 'Digital marketing for beginners,' 'Instagram Reels strategy for personal trainers with under 5,000 followers' produces much stronger and far more targeted content. The narrower the niche, the stronger the book. Third mistake: not specifying tone. Fourth mistake: leaving the reader description vague. Fifth mistake: not limiting scope - when you do not set boundaries, the system can add chapters that go off-topic. Fixing even one of these mistakes noticeably increases output quality."],
      ["From brief to output: what to expect", "Even with a good brief, the first draft may not be 100 percent perfect - this is normal and expected. AI production is a starting point, not a finished product. When you receive the output, ask these questions: Is the tone appropriate for the target reader? Are the examples realistic and culturally accurate? Is the chapter flow logical? Is the language level appropriate for the reader - too technical or too simple? Do this evaluation chapter by chapter and regenerate or manually edit problematic areas. The better the brief, the shorter this revision round. The goal: write the brief so clearly that 80 percent usable content comes in the first round, and complete the remaining 20 percent with your personal voice, original examples, and fine-tuning. When this ratio is achieved, English book production truly becomes an efficient process."],
    ],
  },
  {
    slug: "ilk-kitabim-kac-bolum-olmali",
    title: "İlk Kitabım Kaç Bölüm Olmalı?",
    summary: "İlk kitapta fazla bölüm açmanın neden çoğu zaman hata olduğunu açıklar.",
    category: "Yapı",
    readTime: "6 min",
    datePublished: "2025-02-01",
    dateModified: "2025-03-20",
    intro: "İlk kitabını planlarken kaç bölüm olacağına karar vermek düşündüğünden daha önemli. Çok az bölüm yüzeysel görünür, çok fazla bölüm ise odak kaybettirir. Ama sayı aslında ikincil bir soru — önce her bölümün ne yapması gerektiğini anlamak lazım.",
    sections: [
      ["Bölüm sayısı kaliteyi belirlemez", "20 bölümlük bir kitap 7 bölümlük kitaptan daha değerli değildir. Aksine, çok bölümlü kitaplarda her bölüm daha ince kalır, içerik tekrar eder ve okur odağını kaybeder. Bölüm sayısı bir prestij göstergesi değil, bir yapı kararıdır. Asıl soru şu: kitabında kaç tane farklı, birbirini destekleyen ana fikir var? O sayı bölüm sayını belirlemeli. Çok fazla bölüm açmanın yaygın sebebi şudur: konu 'büyük' hissettiriyor ve her alt konuyu ayrı bir bölüm olarak planlamak mantıklı geliyor. Ama çoğu zaman bu alt konular tek bir bölümün içindeki alt başlıklar olarak çok daha iyi çalışır. Bölüm = bağımsız, tamamlanmış bir fikir. Alt başlık = o fikrin bir boyutu. Bu ayrımı netleştirmek kafa karışıklığını bir anda gideriyor."],
      ["Başlangıç için ideal aralık nedir?", "Çoğu pratik rehber ve bilgi kitabı için 5 ila 8 bölüm sağlam bir başlangıç noktasıdır. Bu aralık yeterince derinlik sunar ama okuru bunaltmaz. Her bölüm bir ana fikri veya bir adımı kapsıyor, kitap boyunca bir dönüşüm ya da öğrenme süreci ilerliyor — bu yapı hem okunması hem yazılması kolay bir kitap ortaya koyar. Peki bu sayı nereden geliyor? Pratik rehberlerin okur psikolojisiyle ilgili bir gerçeği var: okur, kitabı eline aldığında içindekiler tablosuna bakıyor ve bölüm sayısına göre 'bu kitabı bitirebilir miyim?' sorusunu soruyor. 5-8 bölüm hem yeterince kapsamlı görünüyor hem de ulaşılabilir. 15-20 bölüm ise çoğu okurda 'bunu tamamlayamam' hissini tetikliyor. İlk kitabın daha kısa çıkması sorun değil — asıl önemli olan tamamlamaktır."],
      ["Ne zaman daha fazla bölüm gerekir?", "Bazı kitap türleri gerçekten daha fazla bölüm gerektiriyor. Adım adım ilerleyen teknik rehberler, her adımın ayrı bir bölüm olmasını zorunlu kılabilir. Birden fazla farklı konuyu ele alan antoloji tarzı kitaplar ya da her bölümün bağımsız okunabildiği referans kitaplar da daha yüksek bölüm sayısına gidebilir. Bu durumlarda 10-15 bölüm makul. Ama 15'in üzeri çoğu rehber kitap için tehlike bölgesidir — içerik seyrelmesi, tekrar ve odak kaybı kaçınılmaz hale gelir. Eğer 15 bölüm planlamış ama içerik ince kalıyorsa, bölümleri birleştirip derinleştirmek her zaman daha iyi sonuç verir. Hacim hedefi için bölüm sayısını artırmak yanlış bir stratejidir."],
      ["Her bölümün uzunluğu ne olmalı?", "Pratik rehberlerde bölüm başına 1500-3000 kelime — yaklaşık 6-12 sayfa — çoğu bölüm için doğru aralıktır. Bu kadar kelimeyle bir fikri derinlemesine işleyebilir, somut örnek verebilir ve okura aksiyon adımları bırakabilirsin. 500 kelimenin altındaki bölümler genellikle yüzeysel hissettiriyor; okur 'bu kadar mı?' sorusunu soruyor. 5000 kelimenin üzerindeki bölümler ise okuru yoruyor ve konuya hakim olmayan birisinin dağınık yazısı izlenimini yaratıyor. Tutarlı uzunluk da önemli — bölümler arasında 3 kat uzunluk farkı kitabın dengesiz görünmesine neden oluyor. Hedef: her bölüm benzer bir ağırlık taşısın, okur ritmi tutarlı kalsın."],
      ["Bölüm başlıklarını nasıl planlamalı?", "İyi bir bölüm başlığı okura ne öğreneceğini söyler — merak uyandırır ama yanıltmaz. 'Giriş', 'Temel Kavramlar' ya da 'Özet' gibi belirsiz başlıklar yerine 'İlk 30 Günde Müşteri Tabanını Nasıl Kurarsın?' veya 'Fiyatlandırmada 3 Hata ve Nasıl Önlenir?' gibi somut başlıklar okuru sayfaya çeker. Bölüm başlıklarını yan yana koyduğunda bir mantık akışı görünmeli — içindekiler tablosuna bakan okur kitabın öğretme sırasını hissedebilmeli. Başlıklar aynı zamanda SEO açısından da önemlidir: e-kitap platformlarında bölüm başlıkları arama algoritmalarına sinyal verir. Book Generator wizard'ı başlık önerileri sunar, sen istersen tek tek değiştirebilirsin."],
      ["Küçük başlamanın avantajları", "5-7 bölümle başlamak hem üretimi hem de düzenlemeyi kolaylaştırır, hem de kitabı bitirebilme ihtimalini ciddi ölçüde artırır. Daha az bölüm = daha hızlı tamamlama = daha erken yayın = daha erken geri bildirim. Tamamlanan bir kitap, yarım kalan ama 'çok daha kapsamlı ve mükemmel' olmak üzere planlanan bir kitaptan her zaman daha değerlidir. Kitabını yayına girdiğinde okurlardan gerçek geri bildirim alırsın; ikinci baskıda ya da sıradaki kitapta kapsamı genişletebilirsin. Bu iteratif yaklaşım hem riski azaltır hem de içeriğini gerçek taleple şekillendirmeni sağlar. Küçük başlamak disiplindir — büyük planlar yapmak ise çoğu zaman ertelemenin kibar bir adıdır."],
    ],
  },
  {
    slug: "ai-taslagi-nasil-duzeltilir",
    title: "How to Edit an AI Draft?",
    summary: "A quick editing method to make your raw draft more trustworthy and more human.",
    category: "Editing",
    readTime: "7 min",
    datePublished: "2025-02-15",
    dateModified: "2025-03-25",
    intro: "You got your AI draft â€” but it's not quite what you wanted. Some chapters are too general, some sentences feel too mechanical, and the same idea repeats in places. This is normal. AI generation saves you from starting from scratch, but treating the draft as a finished product is usually the wrong call. This article walks you through the quick editing process you need to transform a raw draft into truly your own book.",
    sections: [
      ["Why the raw draft needs editing", "The AI system knows the topic but it doesn't know you. It can't carry over your personal experiences, your specific examples, your voice, or the unique connection you have with your target audience. Even when the generated content is accurate and consistent, it typically uses language that 'anyone could write' â€” it's not original, not personal, and indistinguishable from your competitor's book in the same field. Editing exists precisely to add this originality. Additionally, the system sometimes repeats itself; it restates the same idea in different words across different chapters. It produces sentences disconnected from context. It picks a level that's either too technical or conversely too basic for the target reader. Noticing and fixing these is your job â€” and this ability to notice comes from your mastery of the subject. Presenting the draft as a finished product is a big mistake; a draft presented after editing transforms into a real book."],
      ["Check the structure first", "Before correcting word by word, look at the big picture. Is the chapter order logical? Does each chapter build on the previous one? As the book progresses from start to finish, is the reader genuinely learning something or undergoing a transformation â€” or are unrelated pieces of information simply listed? Fixing structural issues before editing sentences is essential. Because editing sentences inside a chapter that will be deleted or moved is pure time waste. To check the structure, read the table of contents â€” can the flow be understood just by looking at headings? Read the first sentence of each chapter â€” can the question 'what is this chapter about?' be answered in that first sentence? These two checks reveal the vast majority of structural issues within minutes."],
      ["Clean up repetitions", "AI systems sometimes repeat the same idea in different chapters using different words. This is especially common in intro and summary paragraphs â€” each chapter starts and ends independently, so the system may not fully carry over what was said in previous chapters as context. As you scan each chapter, ask yourself: 'Have I covered this idea before? Has the reader already learned this?' If the answer is yes, either delete that section or merge it with another chapter. Repetition is a very serious problem because it simultaneously sends two messages: the content is insufficient and has been padded with filler; and the author can't keep track of what they've said. Both of these messages cause the reader to lose trust. Eliminating repetition shortens the book but strengthens it."],
      ["Add your own voice", "This is the most important and most valuable step of editing. Think of the AI-written text as a skeleton â€” the bones are in place but you'll add the flesh, the blood, the character. Add a personal experience: something you lived through, heard from a client, saw in a project. Write a sentence as if speaking â€” instead of 'This is important,' write 'The first time I saw this, it took me ten minutes to understand it, but once I noticed, everything changed.' In a chapter, address the reader directly: 'If you too...'. Add a real number or concrete data. Each of these small touches is what separates the book from an ordinary AI output and builds a genuine connection with the reader. Without them, the book informs; with them, the book builds trust."],
      ["Real examples and concrete details", "AI drafts mostly use abstract or generic examples: 'a company applied this strategy and succeeded.' These kinds of examples tell the reader nothing â€” who is this company, what did they do, how did they succeed, how long did it take? Replace abstract examples with concrete and familiar ones. A real company name, a real number, a scenario from your own experience, or a very specific situation: 'One of their clients tried it for 3 months, changed this, got that result.' Readers connect with concrete examples because they can see themselves in them. Abstract explanations inform but don't create credibility. This change dramatically improves reliability, readability, and the lasting impression."],
      ["When to regenerate vs. when to edit?", "The practical answer to this question is: look at the scale of the change. If you're changing a few sentences in a chapter, rewriting a paragraph or two â€” edit. Manual editing is faster at this scale. But if the chapter has gone completely in the wrong direction, if it's entirely unsuitable for the target reader, if the tone is inconsistent from chapter to chapter, or if it has gone out of scope â€” regenerate. Book Generator allows chapter-based regeneration: select a single chapter, provide a different brief or tone instruction, regenerate. This is much faster than regenerating the entire book. Practical rule: if minor editing suffices, edit; if a major change is needed, regenerate and build on top."],
      ["The final read-through ritual", "After editing is done, read the book cover to cover once more â€” but this time with different eyes: imagine your target reader, read from their perspective. How does this person feel when reading the book? Is there anything unclear? Is there a boring, repetitive, or overly heavy chapter? Has the book's promise â€” the implicit pledge it made â€” been fulfilled in the final chapter? This final read makes small improvements and overlooked issues visible. It also gives you the most important signal: is the book done or not? It doesn't have to be perfect â€” it has to be ready to publish. Recognizing this distinction is what gets most books completed."],
    ],
  },
  {
    slug: "kapak-secerken-en-onemli-5-sey",
    title: "5 Most Important Things When Choosing a Cover",
    summary: "Helps you make cover decisions based on function rather than aesthetics.",
    category: "Cover",
    readTime: "7 min",
    datePublished: "2025-03-01",
    dateModified: "2025-03-28",
    intro: "Choosing a cover often seems like an aesthetic decision \u2014 but it is actually a strategic one. A good cover communicates the book's genre, attracts the right reader, and signals professionalism. A bad cover can drive readers away no matter how good the content is. This article explains the five key points to focus on to make your cover decision functional rather than just pretty.",
    sections: [
      ["A cover is a marketing tool", "Your cover's only job is not to look beautiful \u2014 it is to sell. On Amazon listings, social media posts, or a website, the one thing your cover needs to do is this: stop the right reader and make them click. To achieve that, it must answer functional questions before aesthetic preferences: Was this cover designed for my target reader? Does it communicate the book's genre at first glance? Does it speak the same visual language as competing books? If you can say 'yes' to these questions, your cover is doing its job. Why is this so important? Because a book's click decision on Amazon is typically made within 2-3 seconds \u2014 the title and cover either pull the reader in or let them scroll past in that window. No matter how good the content is, if the reader doesn't click through to the page, none of it matters. In this sense, the cover is the book's most important marketing investment."],
      ["The book's genre must be immediately clear", "Different book genres have different visual languages, and readers decode them subconsciously at remarkable speed. Business and career books typically use clean, minimalist, typography-heavy covers \u2014 plain background, large and bold text, abstract or minimal imagery if any. Personal development books work with warmer colors, inspirational visuals, and sometimes the author's photo. Technical guides prefer a clear and simple layout \u2014 icons, diagrams, or screenshots are commonly used. When a reader looks at a cover, they unconsciously read these signals and answer the question 'is this book in my genre?' If the cover's visual language doesn't match the book's genre, the reader experiences confusion and moves on. Looking at the covers of the top 10 bestsellers in your target category is the fastest way to learn that category's visual language."],
      ["The title must be readable even at small sizes", "Don't forget that on Amazon listings your book appears as a thumbnail \u2014 usually a small rectangle between 80x110 and 150x200 pixels. At that size, the only thing your cover needs to do is make the title readable. Large, high-contrast typography is therefore essential. 'Elegant' thin, decorative, or script fonts become illegible at small sizes. Don't try to fit too many words \u2014 the main title should be the largest text on the cover, and the subtitle, if there is one, should be smaller but still readable. Before producing the cover, shrink it to 150x200 pixels and check: can you read the title in 5 seconds? If not, the cover will fail on platform listings no matter how beautiful it looks at full size."],
      ["Color and contrast are functional", "Color choice is both an aesthetic and a practical decision \u2014 but the practical dimension is far more decisive. High color contrast improves readability: dark text on a light background or vice versa is the safest choice. Low-saturation or very similar tones blend together at small sizes, causing the title to merge into the background. Also consider the industry-specific color language: navy, dark gray, and gold tones signal trust and professionalism for finance and business books. Green and white are common for health and wellness books. Orange, yellow, and vibrant colors carry associations of energy and motivation in personal development books. Instead of choosing colors randomly, study successful books in the category and observe which color palette works there. Then differentiate starting from that palette \u2014 not completely disconnected, but familiar yet distinctive."],
      ["Simplicity usually wins", "The most common mistake in cover design is cramming in too many elements. Multiple main images, excessive text, complex background patterns, too many colors, multiple fonts \u2014 using all of these together does not convey 'professionalism'; on the contrary, it conveys clutter. The most effective covers usually consist of a single strong concept, a clear title, and a minimal layout. Don't leave the reader unsure of where to look \u2014 design where their eye lands first. Have one focal point on the cover and let all other elements support that focus. Sometimes just strong typography and a solid background color works far better than a complex illustrated cover. Did complexity come at a high price? Did a good designer cost a lot? A simple but effective cover is always more valuable than an expensive but cluttered one."],
      ["Meet KDP technical requirements", "For digital books, KDP requires a minimum of 1000 pixels width, ideally 2560x1600 pixels resolution, and a 1.6:1 aspect ratio. Covers that don't meet these requirements are either rejected during upload or appear pixelated and blurry on the platform \u2014 both outcomes instantly damage the perception of professionalism. For print books, the front cover, spine, and back cover must be prepared as a single combined PDF; spine width varies based on page count, and KDP provides its own free template calculator tool. The color space should be RGB, not CMYK (for digital), and the file format should preferably be JPEG or TIFF. Book Generator produces cover outputs that comply with these requirements \u2014 but if you are using your own design or receiving one from an external designer, share these technical requirements at the first meeting."],
      ["Final test: thumbnail and competitor comparison", "After completing the cover, do two quick tests. First test: shrink the cover to 150x200 pixels and check whether the title is still readable. This simulation shows you the real appearance on Amazon listings. Second test: place the cover images of 10-15 books in your target category side by side and insert your own cover among them. Does it stand out? Does it look appropriate for the category but sufficiently different? Speaking the category's language and being distinctive at the same time is possible \u2014 but a cover that completely rejects the category's visual language creates distrust in the reader. These two tests take a total of 10 minutes and help you catch major issues before publishing. Rather than endlessly prolonging the cover decision with perfectionism, pass these two tests and publish."],
    ],
  },
  {
    slug: "chatgpt-ile-outline-cikiyor-ama-kitap-neden-bitmiyor",
    title: "ChatGPT Generates Outlines But Why Doesn't the Book Get Finished?",
    summary: "The real reason book projects that start with ChatGPT but never get finished is not model quality — it's workflow fragmentation and context loss.",
    category: "Başlangıç",
    readTime: "7 min",
    datePublished: "2026-04-03",
    dateModified: "2026-04-03",
    intro: "ChatGPT ile bir outline oluşturmak kolaydır. Birkaç bölüm başlığı çıkarmak da kolaydır. Ama aynı konuşmada 8 bölümü tutarlı üretmek, tonu korumak, kapsam kaymasını önlemek ve sonunda yayına hazır bir dosya çıkarmak — bunlar ayrı bir iş. Bu yazı, ChatGPT ile kitap projesinin neden sık sık yarıda kaldığını analiz ediyor ve hangi noktadan sonra özel bir kitap akışının fark yarattığını açıklıyor.",
    sections: [
      ["Outline üretmek kitap yazmak değil", "ChatGPT'ye 'X konusunda 10 bölümlük outline çıkar' dediğinde birkaç saniyede kullanılabilir bir yapı gelir. Bu hızlı başlangıç güçlüdür ama aldatıcıdır. Çünkü outline üretmek ile o outline'ı tutarlı biçimde kitaba dönüştürmek tamamen farklı operasyonlar gerektirir. Outline tek bir konuşmada çıkar; kitap ise her bölüm için ayrı bağlam, referans ve ton tutarlılığı ister. ChatGPT bu ikinci aşamada seni desteklemeye devam eder ama seni yönlendirmez."],
      ["Bağlam kaybı her bölümde birikir", "ChatGPT'de uzun kitap projelerinin önündeki en büyük engel bağlam uzunluğu değil bağlam yönetimidir. 3. bölümü yazarken 1. bölümde söylediklerin hatırlatılmadıkça model sürüklenir: ton değişir, örnekler çakışır, terminoloji tutarsızlaşır. Bu problemi çözmek için sürekli 'yukarıda yazdıklarımı hatırla ve buna göre devam et' yazmak zorunda kalırsın. Her bölüm için bu döngüyü tekrar başlatmak özellikle 6-10 bölümlük kitaplarda zaman alıcı ve dağıtıcı hale gelir."],
      ["Her bölüm yeni bir komut demek", "ChatGPT ile kitap yazan çoğu kişi şunu fark eder: 4. veya 5. bölümde her şeyi sıfırdan açıklamak zorunda kalmak üretim motivasyonunu düşürüyor. 'Senden şunu istiyorum, bu kitabın hedef kitlesi şu, tonu şöyle, bir önceki bölümde şunu söyledik, şimdi...' — bu giriş cümleleri her seferinde daha uzun hale geliyor. Kitap yazmanın keyfi giderek teknik operasyona dönüşüyor. Bu ChatGPT'nin kötü olduğu anlamına gelmiyor; kitap üretimi için tasarlanmamış bir araçla kitap yazmaya çalışmanın doğal sonucu."],
      ["EPUB ve PDF çıkarmak ayrı bir operasyon", "ChatGPT metin üretir. Ama üretilen metin doğrudan KDP'ye yüklenebilir bir EPUB dosyasına dönüşmez. Calibre, Sigil, Vellum veya başka araçlarla export işlemini manuel yapman gerekir. Her araç ayrı öğrenme eğrisi ve zaman ister. Kapak ayrı; metadata düzenlemesi ayrı; bölüm formatlaması ayrı. Bu araç zinciri tek başına saatler alabilir ve çoğu zaman 'üretilmiş ama tamamlanmamış kitap' sorununa yol açar: metin hazır ama yayın dosyası yok."],
      ["Workflow kopukluğu motivasyonu tüketir", "Bir kitap projesinin yarıda kalmasının en sık sebebi vakit yokluğu değil motivasyon düşüşüdür. Motivasyon çoğunlukla işin karmaşıklaşmasından düşer: her bölüm için prompt yeniden kurmak, ton tutarlılığını elle kontrol etmek, export zincirini ayrıca çözmek ve hangi aşamada ne kalındığını takip etmek. Bu sürtünmeler birikerek bir kitap projesini aylar içinde pasif nota döndürür."],
      ["Fark sistem tasarımında", "ChatGPT'nin gücü ve kitap üretim sisteminin farkı model kalitesinde değildir. Fark iş akışı mimarisindedir: konu özetinden bölüm planına, bölüm planından tüm bölümlere, kapaktan EPUB çıktısına tek ve tutarlı bir akış. Bu akışta bağlam bir bölümden diğerine taşınır; ton profili tüm üretimi boyunca korunur; kapak ve export süreci ayrı operasyon gerektirmez. Sistem her adımda ne yapılacağını söyler — kullanıcı yön verir, ama operasyonu yönetmek zorunda kalmaz."],
      ["ChatGPT iyi bir başlangıç noktası, ama bitiş noktası değil", "ChatGPT ile outline çıkarmak, fikir test etmek veya kısa içerik denemesi yapmak hâlâ mantıklı. Ama 6-12 bölümlük bir non-fiction kitabı baştan sona üretmek, tonu korumak, export zincirine hazır hale getirmek ve bunu düzenli tekrar edebilmek istiyorsan özel bir kitap üretim akışına geçiş noktasına geldin demektir. Outline çıkıyor ama kitap bitmiyor — bu şikayetin cevabı daha iyi prompt değil, daha iyi sistem."],
    ],
  },
] as const;
