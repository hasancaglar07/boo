$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$bytes = [System.IO.File]::ReadAllBytes($f)
$c = [System.Text.Encoding]::UTF8.GetString($bytes)

# Find the exact block boundaries
$marker = 'slug: "can-i-publish-a-book-without-knowing-how-to-write"'
$idx = $c.IndexOf($marker)
$endMarker = 'slug: "kitap-fikri'
$endIdx = $c.IndexOf($endMarker, $idx)

$oldBlock = $c.Substring($idx, $endIdx - $idx)

$newBlock = @'
slug: "can-i-publish-a-book-without-knowing-how-to-write",
    title: "Can I Publish a Book Without Knowing How to Write?",
    summary: "Provides the simplest answer to the first-time user's fear.",
    category: "Getting Started",
    readTime: "6 min",
    datePublished: "2024-12-15",
    dateModified: "2025-03-05",
    intro: "Everyone who asks this question gets stuck at the same point: writing seems like a difficult skill, one that requires months of practice, and perhaps it is not for everyone. But writing a guide book or an informational book is a completely different endeavor from writing a literary novel. What matters here is not beautiful sentences, but clear information and proper structure. In reality, most people are not afraid of writing — they are afraid of starting. And to start, you do not need to be a perfect writer at all. The right tool and a clear topic can make you a book author much faster than you expect.",
    sections: [
      ["Is the fear of writing real?", "Yes, it is real — but most of the time it comes from the wrong source. People think 'I need to be a good writer'; this thought becomes the biggest mental block that prevents them from starting. But informational book writing is completely different from writing a literary novel. In a novel, style, linguistic richness, and fictional creativity take center stage. In a guide book, the reader expects not beautiful sentences from you, but clear information and practical guidance. You are already transferring your accumulated knowledge on a topic you know — this is not much different from explaining something to a friend. Putting down on paper the knowledge you already possess as a coach, consultant, or experienced practitioner is not writing — it is a transfer skill. The difference is only in the structure: the book organizes the conversation into a certain order and progresses step by step for the reader. You do not need to be a very powerful writer to build this structure."],
      ["The difference between writing and directing", "In traditional book writing, you produce every word yourself — you start with a blank page, every sentence comes from you, every paragraph is your labor. In AI-supported book production, your role changes fundamentally: you direct, the system generates the draft, you edit. In this process, what matters is not writing skill but the ability to make content decisions. What will the topic be? Which chapters will there be? Which examples will be given? What tone will be used? If you can answer these questions, you can produce a book. You do not have to construct perfect sentences — being able to look at the draft and say 'is this correct, is anything missing, should it be changed?' is enough. This role is similar to an editor or a project manager: the final decisions are yours, the production weight is on the tool. Approaching the fear of writing with this mental framework makes it easier for most people to take the first step."],
      ["What is the AI tool's role?", "Tools like Book Generator do not leave you alone with a blank page. When you enter the topic, target reader, and tone information, the system suggests an outline — complete with chapter titles, proposed ordering, and overall structure. When you approve the outline, it generates chapter content; you can review and edit each chapter individually. At every stage, it offers you the option to edit, regenerate, or write manually. The tool is a draft machine — the sculpture awaits you in rough form, and you give it its final shape. In this process, you are not 'writing' but doing content editing: which chapter stays, which sentence changes, which example should be made more concrete? These decisions reflect your expertise. The tool only builds the draft quickly; the quality of your book depends on your editing eye and subject knowledge."],
      ["Why does the wizard flow make a difference?", "The biggest obstacle for a first-time user is the blank screen. When the question 'Where do I start?' goes unanswered, people either become paralyzed by perfectionism or postpone the process indefinitely. Every minute spent without knowing what to ask or where to begin drains motivation. The wizard flow eliminates this obstacle: it asks you guided questions in sequence and progresses based on your answers. What is the topic? Who is the target reader? How many chapters should the book have? What should the tone be? When you answer these questions, the system has a brief — and shortly presents you with a draft. Starting with a ready-made structure instead of starting from scratch on a blank screen makes an enormous difference, especially for your first book. Correcting is always easier than building from zero. The wizard carries you to that point."],
      ["Clear purpose beats perfect prompts", "When working with AI tools, the most common advice is to write better prompts — the anxiety of 'I don't know how to write the right prompt' becomes yet another wall that prevents starting. But in reality, what truly makes a difference is not technical prompt skill but content clarity. When you can answer these three questions, the system already works much better: What do I want to explain? Who am I writing for? What will the reader be able to do or know after finishing the book? If you have clear answers to these questions, the system can transform this into a functional book structure. Without needing technical prompt skills, you can get very good results simply by expressing your topic and purpose sincerely. Being the content owner, not prompt engineering, is the real source of power."],
      ["What do you need to take the first step?", "Just a topic. And having something you can explain to someone else about that topic — a skill you have learned over the years, a process you have experienced repeatedly, an area where you constantly get questions. You do not need writing experience, fluent English, or expertise in the publishing industry. Book Generator works with a Turkish interface and produces the book in whichever language you want — enter a Turkish brief, get an English book. You can start without registering: enter your topic, see your outline and cover preview in 30 seconds. If you don't like it, go back, change the topic, try a different direction. No risk, no blank page, no prerequisite knowledge required. The best way to overcome the fear of writing is not to debate it but to see a draft — and to see one, all you need is to enter a topic."],
    ],
  },
'@

# Replace the old block with the new one
$c = $c.Substring(0, $idx) + $newBlock + $c.Substring($endIdx)

# Write back with UTF-8 BOM
$utf8BOM = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($f, $c, $utf8BOM)

Write-Host "DONE - File updated successfully"
Write-Host "Verifying..."

# Verify
$verify = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$vIdx = $verify.IndexOf('slug: "can-i-publish-a-book-without-knowing-how-to-write"')
$vEnd = $verify.IndexOf('slug: "kitap-fikri', $vIdx)
$vBlock = $verify.Substring($vIdx, $vEnd - $vIdx)
Write-Host "Block starts with: $($vBlock.Substring(0, 80))"
Write-Host "Contains 'Getting Started': $($vBlock.Contains('Getting Started'))"
Write-Host "Contains 'Is the fear of writing real': $($vBlock.Contains('Is the fear of writing real'))"
Write-Host "Contains 'The difference between writing and directing': $($vBlock.Contains('The difference between writing and directing'))"
Write-Host "Contains 'What is the AI tool': $($vBlock.Contains("What is the AI tool's role"))"
Write-Host "Contains 'Why does the wizard flow': $($vBlock.Contains('Why does the wizard flow'))"
Write-Host "Contains 'Clear purpose beats': $($vBlock.Contains('Clear purpose beats'))"
Write-Host "Contains 'What do you need to take': $($vBlock.Contains('What do you need to take'))"
Write-Host "Contains Turkish 'Başlangıç': $($vBlock.Contains([char]0x015F))"
Write-Host "Contains Turkish 'Yazarlık': $($vBlock.Contains('Yazarlk'))"
