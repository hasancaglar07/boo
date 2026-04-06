$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$enc = [System.Text.Encoding]::UTF8
$c = [System.IO.File]::ReadAllText($f, $enc)
$lines = $c -split "`n"

# Replace line 424 (index 423) - intro
$newIntro = '    intro: "You finished your book — it''s time to export. But which format? EPUB, PDF, or both? This question sounds simple, but choosing the wrong format can lead to unnecessary technical issues, platform rejection notices, or display problems that ruin the reader experience. Most users want both formats, rightfully — but they don''t know which to start with or what the difference really means in practice. This article skips long technical explanations and goes straight to the conclusion: choose the right format, for the right purpose, at the right time.",'
$lines[423] = $newIntro

$c = $lines -join "`n"
[System.IO.File]::WriteAllText($f, $c, $enc)
Write-Host "Intro replaced OK"
