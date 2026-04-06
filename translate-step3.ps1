$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$enc = [System.Text.Encoding]::UTF8
$c = [System.IO.File]::ReadAllText($f, $enc)
$lines = $c -split "`n"

# Line 77 is index 76 - extract just the text content between quotes
$line77 = $lines[76]
# Find the quoted string
$startQuote = $line77.IndexOf('"') + 1
$endQuote = $line77.LastIndexOf('"')
$turkishText = $line77.Substring($startQuote, $endQuote - $startQuote)
Write-Host "Found Turkish text, length: $($turkishText.Length)"

$englishText = 'See the preview, unlock the full book if you like it. Output files are ready to upload to KDP.'
$newLine77 = '    text: "' + $englishText + '",'
Write-Host "New line 77: $newLine77"

$lines[76] = $newLine77
$c = $lines -join "`n"

[System.IO.File]::WriteAllText($f, $c, $enc)
Write-Host "Line 77 replaced OK"
