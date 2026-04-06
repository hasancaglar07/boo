[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$bytes = [System.IO.File]::ReadAllBytes('web/src/lib/marketing-data.ts')
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $text -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match 'zayif-bir-kitap-fikri') {
    Write-Host "Found slug at line $($i+1)"
    for ($j = $i-1; $j -lt [Math]::Min($i+22, $lines.Count); $j++) {
      Write-Host "$($j+1): $($lines[$j].TrimEnd())"
    }
    break
  }
}