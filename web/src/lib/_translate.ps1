$content = [System.IO.File]::ReadAllText('web\src\lib\marketing-data.ts', [System.Text.Encoding]::UTF8)
$slugIdx = $content.IndexOf('how-to-validate-a-nonfiction-book-idea')
$secIdx = $content.IndexOf('sections: [', $slugIdx)
$depth = 0; $started = $false; $endIdx = 0
for ($i = $secIdx + 'sections: '.Length; $i -lt $content.Length; $i++) {
    if ($content[$i] -eq '[') { $depth++; $started = $true }
    if ($content[$i] -eq ']') { $depth-- }
    if ($started -and $depth -eq 0) { $endIdx = $i; break }
}
$oldSections = $content.Substring($secIdx, $endIdx - $secIdx + 2)

$newSections = @"
    sections: [
      ["Reader clarity comes before topic", "In a nonfiction idea, the first check is not the topic title; it is the reader definition. 'A marketing book' is weak; 'a client acquisition system for B2B SaaS founders to land their first 10 customers' is strong. Because the second statement directly says who it is written for and in what context it produces value. If the reader cannot be described in a single sentence, the title, the promise, and the chapter structure all become blurry. Good idea validation always starts with reader clarity."],
      ["No outcome sentence means an incomplete idea", "What will the reader be able to do after finishing the book? Make decisions faster, acquire clients, build a cleaner system, launch a publication? If there is no outcome sentence, the book turns into a mere pile of information. Strong nonfiction ideas do not just explain topics; they carry the reader from one state to another. If you cannot state the transformation in one sentence, the idea is still raw."],
      ["If the scope is not narrow, credibility weakens", "The most common mistake beginners make is starting with too broad a topic. Fields like 'leadership', 'personal development', 'digital marketing' are category names, not book ideas. What turns a category into an idea is narrowing: segment, problem, method, time horizon, or use case. Narrow scope does not shrink the book; it makes it completable, readable, and defensible."],
      ["Material gives the depth signal", "If you have notes, workshop content, client questions, blog posts, or your own framework, the idea is stronger. Because nonfiction books are most often packaged expertise. Having no material does not mean the idea is bad; but a short guide or lead magnet might be a more appropriate starting point than a book. Depth comes not just from topic selection but from the existence of a content inventory."],
      ["Ideas must not only be readable but useful", "Whether authority book, lead magnet, or paid guide, good nonfiction ideas produce value beyond the book itself. They facilitate a sales conversation, strengthen expert image, collect emails, or create a KDP opportunity. Ideas that produce no function carry only writing motivation; but a sustainable publishing system also requires function."],
      ["The best test: can you pull out a mini outline?", "The fastest way to validate an idea is to write a 6-8 item mini outline for it. If sections like introduction, core problem, main framework, mistakes, implementation plan, and case study emerge naturally, the idea carries a spine. If the outline comes out forced, the problem is usually not in the content but in positioning. Fix the angle first, then return to the outline."],
    ],
"@

$newContent = $content.Substring(0, $secIdx) + $newSections + $content.Substring($endIdx + 2)
[System.IO.File]::WriteAllText('web\src\lib\marketing-data.ts', $newContent, [System.Text.Encoding]::UTF8)
Write-Output "Done. Sections replaced successfully."
