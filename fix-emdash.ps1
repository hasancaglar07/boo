$filePath = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Build the corrupted pattern: Euro sign (U+20AC) + Right double quote (U+201D)
$badPattern = [string][char]0x20AC + [string][char]0x201D
$goodPattern = [string][char]0x2014

Write-Host "Replacing pattern. Occurrences: $($content.Split(@($badPattern), [System.StringSplitOptions]::None).Count - 1)"

$content = $content.Replace($badPattern, $goodPattern)

$utf8BOM = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($filePath, $content, $utf8BOM)

# Verify
$v = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
$idx = $v.IndexOf('chatgpt-generates-outlines-but-why')
$start = $v.LastIndexOf('{', $idx)
$end = $v.IndexOf('] as const', $idx) + 10
$section = $v.Substring($start, $end - $start)
$euro = 0
for($i=0; $i -lt $section.Length; $i++){
    if([int]$section[$i] -eq 0x20AC){ $euro++ }
}
$emdash = 0
for($i=0; $i -lt $section.Length; $i++){
    if([int]$section[$i] -eq 0x2014){ $emdash++ }
}
Write-Host "Remaining Euro signs: $euro"
Write-Host "Em-dash count: $emdash"
Write-Host "DONE"
