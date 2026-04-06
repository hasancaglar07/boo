$filePath = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Find the exact section boundaries
$slugMarker = 'slug: "chatgpt-generates-outlines-but-why-doesnt-the-book-get-finished"'
$slugIdx = $content.IndexOf($slugMarker)
$sectionStart = $content.LastIndexOf('{', $slugIdx)
$sectionEnd = $content.IndexOf('] as const', $slugIdx) + '] as const'.Length

$oldSection = $content.Substring($sectionStart, $sectionEnd - $sectionStart)

$newSection = @'
{
    slug: "chatgpt-generates-outlines-but-why-doesnt-the-book-get-finished",
    title: "ChatGPT Generates Outlines But Why Doesn't the Book Get Finished?",
    summary: "The real reason book projects that start with ChatGPT but never get finished is not model quality - it's workflow fragmentation and context loss.",
    category: "Getting Started",
    readTime: "7 min",
    datePublished: "2026-04-03",
    dateModified: "2026-04-03",
    intro: "Creating an outline with ChatGPT is easy. Generating a few chapter titles is also easy. But producing 8 chapters consistently within the same conversation, maintaining tone, preventing scope drift, and ultimately outputting a publication-ready file — these are entirely different tasks. This article analyzes why book projects started with ChatGPT so often stall halfway, and explains at what point a dedicated book production workflow makes the difference.",
    sections: [
      ["Generating an outline is not writing a book", "When you tell ChatGPT 'generate a 10-chapter outline on topic X,' you get a usable structure in seconds. This quick start is powerful but deceptive. Because generating an outline and consistently converting that outline into a book are completely different operations. The outline emerges in a single conversation; the book requires separate context, references, and tonal consistency for each chapter. ChatGPT continues to support you in this second phase, but it doesn't guide you."],
      ["Context loss accumulates with each chapter", "The biggest obstacle for long book projects in ChatGPT is not context length — it's context management. When writing chapter 3, unless what was said in chapter 1 is reminded, the model drifts: tone shifts, examples overlap, terminology becomes inconsistent. To solve this problem, you constantly have to write 'remember what I wrote above and continue accordingly.' Restarting this cycle for each chapter becomes time-consuming and distracting, especially for 6-10 chapter books."],
      ["Each chapter means a new prompt", "Most people who write books with ChatGPT realize this: having to explain everything from scratch by the 4th or 5th chapter kills production motivation. 'I want you to do this, the target audience of this book is that, the tone should be like this, in the previous chapter we said this, now...' — these opening sentences get longer each time. The joy of writing a book gradually turns into a technical operation. This doesn't mean ChatGPT is bad; it's the natural consequence of trying to write a book with a tool not designed for book production."],
      ["EPUB and PDF export is a separate operation", "ChatGPT generates text. But the generated text doesn't directly convert into a KDP-uploadable EPUB file. You need to manually handle the export process with Calibre, Sigil, Vellum, or other tools. Each tool has its own learning curve and time requirements. Cover is separate; metadata editing is separate; chapter formatting is separate. This tool chain alone can take hours and often leads to the 'generated but unfinished book' problem: the text is ready, but there's no publication file."],
      ["Workflow fragmentation kills motivation", "The most common reason a book project stalls is not lack of time — it's loss of motivation. Motivation usually drops because the process becomes overly complicated: rebuilding the prompt for each chapter, manually checking tonal consistency, separately solving the export chain, and tracking what's left at each stage. These frictions accumulate, turning a book project into a passive note over months."],
      ["The difference is in system design", "The difference between ChatGPT's power and a book production system is not in model quality. The difference is in the internal workflow architecture: from topic summary to chapter plan, from chapter plan to full chapters, from cover to EPUB output — a single, consistent flow. In this flow, context is carried from one chapter to the next; the tone profile is maintained throughout the entire production; the cover and export process doesn't require separate operations. The system tells you what to do at each step — you provide direction, but you don't have to manage the operation."],
      ["ChatGPT is a good starting point, not a finishing point", "Using ChatGPT to generate outlines, test ideas, or experiment with short content still makes sense. But if you want to produce a 6-12 chapter non-fiction book from start to finish, maintain tone, prepare it for the export chain, and be able to repeat this regularly — you've reached the transition point to a dedicated book production workflow. The outline comes out but the book doesn't get finished — the answer to this complaint is not better prompts, but a better system."],
    ],
  },
] as const;
'@

$newContent = $content.Substring(0, $sectionStart) + $newSection + $content.Substring($sectionEnd)
$utf8BOM = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($filePath, $newContent, $utf8BOM)

Write-Host "Done! Old section length: $($oldSection.Length), New section length: $($newSection.Length)"
Write-Host "File updated successfully."
