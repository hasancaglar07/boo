$filePath = "C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-tools.ts"
$content = [IO.File]::ReadAllText($filePath, [Text.Encoding]::UTF8)

# Turkish -> English replacements (user-facing strings only)
$content = $content.Replace('"Kitle sinyali"', '"Audience signal"')
$content = $content.Replace('"Doğru okuru çağırıp çağırmadığını hızlıca okursun."', '"Quickly check if your title attracts the right reader."')
$content = $content.Replace('label: "Başlık"', 'label: "Title"')
$content = $content.Replace('"Örn. Silent Offers"', '"e.g. Silent Offers"')
$content = $content.Replace('label: "Hedef okur"', 'label: "Target reader"')
$content = $content.Replace('"Örn. danışmanlar, creator''lar, KDP okurları"', '"e.g. consultants, creators, KDP readers"')
$content = $content.Replace('"Başlık hangi sonucu satmalı?"', '"What result should the title sell?"')
$content = $content.Replace('"Örn. lead, authority, satış veya net bir dönüşüm"', '"e.g. lead, authority, sales, or clear conversion"')
$content = $content.Replace('label: "Kitap tipi"', 'label: "Book type"')

[IO.File]::WriteAllText($filePath, $content, [Text.Encoding]::UTF8)
Write-Host "Translation complete."

# Verify
$after = [IO.File]::ReadAllText($filePath, [Text.Encoding]::UTF8)
$matches = [regex]::Matches($after, '[şçğıüöİŞÇĞÜÖ]')
Write-Host "Remaining Turkish characters: $($matches.Count)"
