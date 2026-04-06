[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$path = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)

# Line 417: title
$lines[417] = '    title: "What Is the Difference Between EPUB and PDF?",'

# Line 418: summary
$lines[418] = '    summary: "Explains which format is right and when for first-time users.",'

# Line 419: category
$lines[419] = '    category: "Publishing",'

# Line 423: intro
$lines[423] = "    intro: `"You finished your book, it's export time -- but which format? EPUB, PDF, or both? The question seems simple, but choosing the wrong format can lead to unnecessary technical issues, platform rejection notices, or display glitches that ruin the reader experience. Most users want both formats, understandably -- but they don't know which one to start with or what the difference between them really means in practice. This article skips lengthy technical explanations and goes straight to the conclusion: choose the right format, for the right purpose, at the right time.`","

# Line 425: Section 1
$lines[425] = "      [`"What is EPUB and how does it work?`", `"EPUB is an open standard developed for electronic publishing, and its name comes from 'electronic publication.' Its most fundamental feature is its reflowable structure: text automatically reshapes itself according to the reader's screen size, resolution, and font preference. When reading on a phone, lines narrow and adapt; on a tablet, they widen; on an e-reader, the user can increase or decrease the font size -- the content remains readable under all conditions. This flexibility has made EPUB the standard for digital distribution. Amazon Kindle, Apple Books, Kobo, Google Play Books, and nearly all major e-book platforms support the EPUB 3 format. Amazon used to recommend the .mobi format, but since 2022 it has adopted EPUB as its primary format. In short, if you plan to distribute digitally, upload to KDP, or send directly to readers, EPUB should be your primary output.`"],"

# Line 426: Section 2
$lines[426] = "      [`"What is PDF and when should you choose it?`", `"PDF stands for 'Portable Document Format' and was developed by Adobe in the early 1990s. Its defining feature is fixed layout: pages appear exactly as designed -- font size, line spacing, image placement, and page margins never change. No matter which device or software opens it, the appearance remains the same. This characteristic is ideal for print: files sent to a print shop, physical book production, full-page designed guides, or certificates all require PDF. If you want to publish a paperback or hardcover book on Amazon KDP, the interior text and cover must be prepared as separate PDF files. On the other hand, PDF is cumbersome for digital reading in many ways: reading on a phone screen is tiring, you constantly need to zoom in and out to fit lines, and the font size cannot be adjusted by the user. That is why EPUB is preferred over PDF for uploading to e-book platforms.`"],"

# Line 427: Section 3
$lines[427] = "      [`"Which format does KDP require?`", `"Amazon KDP expects two different formats for two different publication types. To publish a digital book (Kindle eBook), the EPUB 3 format is required, and KDP accepts it directly. Before 2022, the .mobi format was also widely used, but Amazon now officially recommends EPUB and prefers it for new uploads. KDP's own preview tool, Kindle Previewer, lets you upload your EPUB file and simulate how it will look on a Kindle screen -- running this check before uploading is a good habit. To publish a printed book (paperback or hardcover), PDF is required. The interior text is prepared as a single PDF, and the cover as a separate PDF. The cover PDF's dimensions are determined by the page count because the spine thickness varies with page count. KDP offers a free cover template tool to simplify this calculation. In summary: EPUB for digital, PDF for print -- if you plan to do both, keep both formats ready.`"],"

# Line 428: Section 4
$lines[428] = "      [`"Which one should you get first?`", `"The practical recommendation is clear: get EPUB first, leave PDF for later. When you get EPUB, you can easily check your book's structure, chapter order, heading hierarchy, and overall flow in an e-book reader, Kindle Previewer, or browser-based tools. Which chapter heading appears at the wrong hierarchy level, does the table of contents link to the right places, is the flow logical -- these are much easier to spot in EPUB. After catching and fixing structural issues here, generating the PDF saves time and prevents unnecessary revision cycles in the PDF. If you are only doing digital distribution, you may not need PDF at all. If you are considering print, follow this order: first verify content and structure with EPUB, then check the print layout with PDF. Getting both at the same time is also possible; however, from a quality-control perspective, EPUB should always be the first step.`"],"

# Line 429: Section 5
$lines[429] = "      [`"What to watch out for during conversion`", `"When producing EPUB, the most critical point is heading hierarchy. If H1 for the book title, H2 for chapter headings, and H3 for sub-section headings are not marked correctly, the table of contents will be generated incorrectly and navigation will break in some reader applications. Check whether images are embedded inside the EPUB -- linked images may not appear on some platforms. Also, testing your EPUB file with a validation tool like epubcheck before publishing prevents potential KDP rejection notices. When producing PDF, margins, font embedding, and page size are critically important. KDP offers common trim size options for printed books; the most popular is 6x9 inches. Images with bleed areas require additional settings. Book Generator handles these technical details largely on your behalf and produces platform-compatible outputs; still, skipping the final quality-control step is not a good habit.`"],"

# Line 430: Section 6
$lines[430] = "      [`"Summary: choose the format for its purpose`", `"EPUB: digital reading, e-book platforms, Amazon Kindle, Apple Books, Kobo, mobile devices. Users can adjust font size, text adapts to screen size, and the file size is small. PDF: print, fixed layout, print shop file, KDP paperback interior and cover. Design is preserved with pixel-perfect accuracy and appears the same across platforms. Both formats may be needed for different purposes, and neither can replace the other. Always start with EPUB: verify the structure there, check the content, and once approved, move on to PDF. Book Generator offers both formats as export options; getting both at the same time requires no extra effort.`"],"

# Write back with UTF-8 BOM
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllLines($path, $lines, $utf8Bom)

Write-Output "ALL 10 REPLACEMENTS DONE"
