# Read with UTF-8, replace using Unicode literals, write back UTF-8
$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$enc = [System.Text.Encoding]::UTF8
$c = [System.IO.File]::ReadAllText($f, $enc)

# --- Line 77: step 3 text ---
$old77 = [char]0x00D6 + 'nizlemeyi g' + [char]0x00F6 + 'r, be' + [char]0x011F + 'enirsen tam kitab' + [char]0x0131 + ' a' + [char]0x00E7 + '. ' + [char]0x00C7 + [char]0x0131 + 'kt' + [char]0x0131 + ' dosyalar' + [char]0x0131 + ' KDP' + [char]0x2019 + 'ye y' + [char]0x00FC + 'klemeye haz' + [char]0x0131 + 'r gelir.'
$new77 = 'See the preview, unlock the full book if you like it. Output files are ready to upload to KDP.'
if ($c.Contains($old77)) {
    $c = $c.Replace($old77, $new77)
    Write-Host "Replaced line 77 text OK"
} else {
    Write-Host "WARNING: Could not find line 77 old text"
    # Try to find what's actually there
    $idx = $c.IndexOf('text: "')
    Write-Host "First text: at index $idx"
}

# --- Line 418: blog title ---
$old418 = 'EPUB ve PDF Fark' + [char]0x0131 + ' Nedir?'
$new418 = 'What Is the Difference Between EPUB and PDF?'
if ($c.Contains($old418)) {
    $c = $c.Replace($old418, $new418)
    Write-Host "Replaced line 418 title OK"
} else {
    Write-Host "WARNING: Could not find line 418 old text"
}

# --- Line 419: summary ---
$old419 = [char]0x0130 + 'lk kullan' + [char]0x0131 + 'c' + [char]0x0131 + ' i' + [char]0x00E7 + 'in hangi format' + [char]0x0131 + 'n ne zaman do' + [char]0x011F + 'ru oldu' + [char]0x011F + 'unu a' + [char]0x00E7 + [char]0x0131 + 'klar.'
$new419 = 'Explains which format is right for the first-time user and when.'
if ($c.Contains($old419)) {
    $c = $c.Replace($old419, $new419)
    Write-Host "Replaced line 419 summary OK"
} else {
    Write-Host "WARNING: Could not find line 419 old text"
}

# --- Line 420: category ---
$old420 = 'Yay' + [char]0x0131 + 'n'
$new420 = 'Publishing'
if ($c.Contains($old420)) {
    $c = $c.Replace($old420, $new420)
    Write-Host "Replaced line 420 category OK"
} else {
    Write-Host "WARNING: Could not find line 420 old text"
}

[System.IO.File]::WriteAllText($f, $c, $enc)
Write-Host "Saved file OK"
