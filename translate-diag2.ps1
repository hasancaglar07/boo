$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$enc = [System.Text.Encoding]::UTF8
$c = [System.IO.File]::ReadAllText($f, $enc)
$lines = $c -split "`n"

# Show hex of line 77
$line77 = $lines[76]
Write-Host "Line 77 length: $($line77.Length)"
Write-Host "Line 77:"
Write-Host $line77
Write-Host ""

# Show hex values
$bytes = $enc.GetBytes($line77)
$hexStr = -join ($bytes | ForEach-Object { '{0:X2} ' -f $_ })
Write-Host "Hex (first 200 chars): $($hexStr.Substring(0, [Math]::Min(600, $hexStr.Length)))"
