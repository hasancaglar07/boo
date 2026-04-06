$f = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# Step 3 text replacement (line 77)
$c = $c.Replace(
    "Önizlemeyi gör, beğenirsen tam kitabı aç. Çıktı dosyaları KDP'ye yüklemeye hazır gelir.",
    "See the preview, unlock the full book if you like it. Output files are ready to upload to KDP."
)

# Blog post slug
$c = $c.Replace('slug: "epub-ve-pdf-farki"', 'slug: "epub-vs-pdf-difference"')

# Blog post title
$c = $c.Replace('title: "EPUB ve PDF Farkı Nedir?"', 'title: "What Is the Difference Between EPUB and PDF?"')

# Blog post summary
$c = $c.Replace(
    'summary: "İlk kullanıcı için hangi formatın ne zaman doğru olduğunu açıklar."',
    'summary: "Explains which format is right for the first-time user and when."'
)

# Blog post category
# Need to be careful - only change in epub section, not other blog posts
# This category appears at line 420 within the epub blog post
$c = $c.Replace('category: "Yayın"', 'category: "Publishing"')

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "Step 1 replacements done successfully"
