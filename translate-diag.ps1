# Read file with UTF-8
$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# Check what we're working with - just diagnostic
$hasTitle1 = $c.Contains('Get your EPUB and PDF')
$hasTitle2 = $c.Contains("EPUB ve PDF'ini al")
Write-Host "Has English title already: $hasTitle1"
Write-Host "Has Turkish title still: $hasTitle2"

# Check for specific Turkish chars
$hasOz = $c.Contains([char]0x00F6)  # ö
$hasOu = $c.Contains([char]0x00FC)  # ü
Write-Host "Has ö: $hasOz"
Write-Host "Has ü: $hasOu"

# Show a sample around line 77
$lines = $c -split "`n"
Write-Host "Line 77: $($lines[76])"
Write-Host "Line 418: $($lines[417])"
Write-Host "Line 419: $($lines[418])"
Write-Host "Line 420: $($lines[419])"
