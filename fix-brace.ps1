$ErrorActionPreference = 'Stop'
$path = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
$total = $lines.Length
Write-Host "Total lines: $total"

# Find the line that has "    ]," followed by "  {" (missing closing brace)
# This is the bug: after sections array close, we need "  }," before the next object "  {"
for ($i = 0; $i -lt $total - 1; $i++) {
    if ($lines[$i] -match '^\s{4}\],\s*$' -and $lines[$i+1] -match '^\s{2}\{\s*$' -and $lines[$i+1] -match '\{') {
        # Check if this is in the cover blog section by looking for nearby English text
        $context = $lines[Math.Max(0,$i-5)..$i] -join ' '
        if ($context -match 'competitor comparison|thumbnail|cover') {
            Write-Host "FOUND BUG at line $($i+1): '$($lines[$i])' followed by '$($lines[$i+1])'"
            
            # Insert "  }," after the "    ]," line
            $newLines = @()
            $newLines += $lines[0..$i]
            $newLines += '  },'
            $newLines += $lines[($i+1)..($total-1)]
            
            Write-Host "New total: $($newLines.Count)"
            Write-Host "Fixed line $($i+2): '  },'"
            Write-Host "After fix line $($i+3): '$($newLines[$i+2])'"
            
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllLines($path, $newLines, $utf8NoBom)
            Write-Host "FILE FIXED SUCCESSFULLY"
            exit 0
        }
    }
}
Write-Host "BUG NOT FOUND - checking manually"
# Show lines around 576-580
for ($i = 574; $i -lt 580; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}
