$ErrorActionPreference = 'Stop'
$path = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
$total = $lines.Length
Write-Host "Total lines: $total"

# Verify we're replacing the right block
Write-Host "OLD line 562: $($lines[561])"
Write-Host "OLD line 579: $($lines[578])"

$newLines = @()
$newLines += '    slug: "kapak-secerken-en-onemli-5-sey",'
$newLines += '    title: "5 Most Important Things When Choosing a Cover",'
$newLines += '    summary: "Helps you make cover decisions based on function rather than aesthetics.",'
$newLines += '    category: "Cover",'
$newLines += '    readTime: "7 min",'
$newLines += '    datePublished: "2025-03-01",'
$newLines += '    dateModified: "2025-03-28",'
$newLines += '    intro: "Choosing a cover often seems like an aesthetic decision \u2014 but it is actually a strategic one. A good cover communicates the book''s genre, attracts the right reader, and signals professionalism. A bad cover can drive readers away no matter how good the content is. This article explains the five key points to focus on to make your cover decision functional rather than just pretty.",'
$newLines += '    sections: ['
$newLines += '      ["A cover is a marketing tool", "Your cover''s only job is not to look beautiful \u2014 it is to sell. On Amazon listings, social media posts, or a website, the one thing your cover needs to do is this: stop the right reader and make them click. To achieve that, it must answer functional questions before aesthetic preferences: Was this cover designed for my target reader? Does it communicate the book''s genre at first glance? Does it speak the same visual language as competing books? If you can say ''yes'' to these questions, your cover is doing its job. Why is this so important? Because a book''s click decision on Amazon is typically made within 2-3 seconds \u2014 the title and cover either pull the reader in or let them scroll past in that window. No matter how good the content is, if the reader doesn''t click through to the page, none of it matters. In this sense, the cover is the book''s most important marketing investment."],'
$newLines += '      ["The book''s genre must be immediately clear", "Different book genres have different visual languages, and readers decode them subconsciously at remarkable speed. Business and career books typically use clean, minimalist, typography-heavy covers \u2014 plain background, large and bold text, abstract or minimal imagery if any. Personal development books work with warmer colors, inspirational visuals, and sometimes the author''s photo. Technical guides prefer a clear and simple layout \u2014 icons, diagrams, or screenshots are commonly used. When a reader looks at a cover, they unconsciously read these signals and answer the question ''is this book in my genre?'' If the cover''s visual language doesn''t match the book''s genre, the reader experiences confusion and moves on. Looking at the covers of the top 10 bestsellers in your target category is the fastest way to learn that category''s visual language."],'
$newLines += '      ["The title must be readable even at small sizes", "Don''t forget that on Amazon listings your book appears as a thumbnail \u2014 usually a small rectangle between 80x110 and 150x200 pixels. At that size, the only thing your cover needs to do is make the title readable. Large, high-contrast typography is therefore essential. ''Elegant'' thin, decorative, or script fonts become illegible at small sizes. Don''t try to fit too many words \u2014 the main title should be the largest text on the cover, and the subtitle, if there is one, should be smaller but still readable. Before producing the cover, shrink it to 150x200 pixels and check: can you read the title in 5 seconds? If not, the cover will fail on platform listings no matter how beautiful it looks at full size."],'
$newLines += '      ["Color and contrast are functional", "Color choice is both an aesthetic and a practical decision \u2014 but the practical dimension is far more decisive. High color contrast improves readability: dark text on a light background or vice versa is the safest choice. Low-saturation or very similar tones blend together at small sizes, causing the title to merge into the background. Also consider the industry-specific color language: navy, dark gray, and gold tones signal trust and professionalism for finance and business books. Green and white are common for health and wellness books. Orange, yellow, and vibrant colors carry associations of energy and motivation in personal development books. Instead of choosing colors randomly, study successful books in the category and observe which color palette works there. Then differentiate starting from that palette \u2014 not completely disconnected, but familiar yet distinctive."],'
$newLines += '      ["Simplicity usually wins", "The most common mistake in cover design is cramming in too many elements. Multiple main images, excessive text, complex background patterns, too many colors, multiple fonts \u2014 using all of these together does not convey ''professionalism''; on the contrary, it conveys clutter. The most effective covers usually consist of a single strong concept, a clear title, and a minimal layout. Don''t leave the reader unsure of where to look \u2014 design where their eye lands first. Have one focal point on the cover and let all other elements support that focus. Sometimes just strong typography and a solid background color works far better than a complex illustrated cover. Did complexity come at a high price? Did a good designer cost a lot? A simple but effective cover is always more valuable than an expensive but cluttered one."],'
$newLines += '      ["Meet KDP technical requirements", "For digital books, KDP requires a minimum of 1000 pixels width, ideally 2560x1600 pixels resolution, and a 1.6:1 aspect ratio. Covers that don''t meet these requirements are either rejected during upload or appear pixelated and blurry on the platform \u2014 both outcomes instantly damage the perception of professionalism. For print books, the front cover, spine, and back cover must be prepared as a single combined PDF; spine width varies based on page count, and KDP provides its own free template calculator tool. The color space should be RGB, not CMYK (for digital), and the file format should preferably be JPEG or TIFF. Book Generator produces cover outputs that comply with these requirements \u2014 but if you are using your own design or receiving one from an external designer, share these technical requirements at the first meeting."],'
$newLines += '      ["Final test: thumbnail and competitor comparison", "After completing the cover, do two quick tests. First test: shrink the cover to 150x200 pixels and check whether the title is still readable. This simulation shows you the real appearance on Amazon listings. Second test: place the cover images of 10-15 books in your target category side by side and insert your own cover among them. Does it stand out? Does it look appropriate for the category but sufficiently different? Speaking the category''s language and being distinctive at the same time is possible \u2014 but a cover that completely rejects the category''s visual language creates distrust in the reader. These two tests take a total of 10 minutes and help you catch major issues before publishing. Rather than endlessly prolonging the cover decision with perfectionism, pass these two tests and publish."],'
$newLines += '    ],'

Write-Host "New lines count: $($newLines.Count)"

# Replace lines 562-579 (1-indexed) = indices 561-578
$newContent = @()
$newContent += $lines[0..560]
$newContent += $newLines
$newContent += $lines[579..($total-1)]

Write-Host "Original total: $total"
Write-Host "New total: $($newContent.Count)"

# Verify the join points
Write-Host "NEW line 562: $($newContent[561])"
Write-Host "NEW line 563: $($newContent[562])"
Write-Host "Last new line: $($newContent[561 + $newLines.Count - 1])"
Write-Host "After replacement: $($newContent[561 + $newLines.Count])"

# Write back with UTF-8 no BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($path, $newContent, $utf8NoBom)
Write-Host "FILE WRITTEN SUCCESSFULLY"
