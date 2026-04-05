$env:ANTHROPIC_API_KEY = 'sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98'
$headers = @{
    'x-api-key' = $env:ANTHROPIC_API_KEY
    'anthropic-version' = '2023-06-01'
    'content-type' = 'application/json'
}

$chapters = @(
    @{num=1; title='Gurultunun Cagi ve Sessizligin Iktidari'; summary='Modern dunyada surekli bir bilgi akisi ve dissal uyaricilar arasinda kaybolusumuzun bedelleri.'},
    @{num=2; title='Dijital Minimalizm: Zihinsel Alani Temizlemek'; summary='Teknoloji ve sosyal medya kullanimini bilincli bir sekilde sinirlandirarak zihinsel berrakliga ulasmanin yollari.'},
    @{num=3; title='Gorulmez Aliskanliklar: Kimseye Gostermeden Buyumek'; summary='Disaridan gelen takdir ve onay beklentisini birakarak, icsel motivasyona dayali aliskanliklar insaa etmek.'},
    @{num=4; title='Derin Calisma ve Odaklanma Sanati'; summary='Dikkat dagiticanlardan arindirilmis, kesintisiz bir calisma ortami yaratarak zirve performansa ulasmak.'},
    @{num=5; title='Sinirlar Cizmek: Hayir Demenin Zarafeti'; summary='Gereksiz sosyal yukumluluklerden kurtularak kendi hayatinizin kontrolunu ele gecirmek.'},
    @{num=6; title='Sessiz Bir Sabah ve Huzurlu Bir Aksam'; summary='Gunun baslangicinda ve bitiminde huzur verici rutinlerle sessiz bir yasam cercevesi olusturmak.'}
)

$bookDir = 'book_outputs\test-sessiz-disiplin'
if (-not (Test-Path $bookDir)) { New-Item -ItemType Directory -Path $bookDir -Force | Out-Null }

$allMarkdown = @()
$allMarkdown += '# Sessiz Disiplin'
$allMarkdown += '## Gurultusuz Bir Hayat Nasil Kurulur'
$allMarkdown += '**Yazar:** GLM AI'
$allMarkdown += ''
$allMarkdown += '---'
$allMarkdown += ''
$allMarkdown += '## Icindekiler'
$allMarkdown += ''
foreach ($ch in $chapters) {
    $allMarkdown += "- Bolum $($ch.num): $($ch.title)"
}
$allMarkdown += ''
$allMarkdown += '---'
$allMarkdown += ''

$total = $chapters.Count
$successCount = 0

foreach ($ch in $chapters) {
    Write-Host ">>> Bolum $($ch.num)/$total uretiliyor: $($ch.title)" -ForegroundColor Cyan

    $promptText = "`"$($ch.title)`" baslikli bir kitap bolumu yaz. Bu bolumun ozeti: $($ch.summary). Kitabin konusu: Sessiz Disiplin - Gurultusuz Bir Hayat Nasil Kurulur. Kurallar: 800-1200 kelime arasi yaz. Akici ve etkileyici bir Turkce uslub kullan. Gercek hayattan ornekler ver. Pratik oneriler ve eyleme gecirilebilir tavsiyeler ekle. Okuyucuyu motive eden bir ton kullan. Markdown formatinda yaz."

    $body = @{
        model = 'GLM-5.1'
        max_tokens = 4000
        temperature = 0.8
        system = 'Sen profesyonel bir Turkce kitap yazarisin. Akici, etkileyici ve derinlikli yaziyorsun.'
        messages = @(
            @{
                role = 'user'
                content = $promptText
            }
        )
    } | ConvertTo-Json -Depth 10

    $maxRetries = 3
    $retryCount = 0
    $success = $false

    while ($retryCount -lt $maxRetries -and -not $success) {
        try {
            $response = Invoke-RestMethod -Uri 'https://claudecode2.codefast.app/v1/messages' -Method POST -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 180
            $chapterText = $response.content[0].text
            
            $allMarkdown += "## Bolum $($ch.num): $($ch.title)"
            $allMarkdown += ''
            $allMarkdown += $chapterText
            $allMarkdown += ''
            $allMarkdown += '---'
            $allMarkdown += ''
            
            $chapterText | Out-File -FilePath "$bookDir\bolum_$($ch.num).md" -Encoding UTF8
            
            $wordCount = ($chapterText -split '\s+').Count
            Write-Host "    Tamamlandi! ($wordCount kelime)" -ForegroundColor Green
            $success = $true
            $successCount++
        }
        catch {
            $retryCount++
            if ($_.Exception.Message -match '429') {
                $waitSec = 15 * $retryCount
                Write-Host "    Rate limit! Bekleniyor: ${waitSec}s... (Deneme $retryCount/$maxRetries)" -ForegroundColor Yellow
                Start-Sleep -Seconds $waitSec
            } else {
                Write-Host "    HATA: $($_.Exception.Message)" -ForegroundColor Red
                break
            }
        }
    }

    if (-not $success) {
        Write-Host "    Bolum $($ch.num) atlaniyor (rate limit)" -ForegroundColor Red
    }

    # Her basarili istek sonrasi bekleme
    if ($success -and $ch.num -lt $total) {
        Write-Host "    Bir sonraki bolum icin bekleniyor: 10s..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 10
    }
}

$fullBook = $allMarkdown -join "`n"
$fullBook | Out-File -FilePath "$bookDir\kitap_tam.md" -Encoding UTF8

Write-Host ''
Write-Host '========================================' -ForegroundColor Yellow
Write-Host "  KITAP TAMAMLANDI! ($successCount/$total bolum basarili)" -ForegroundColor Green
Write-Host "  Dosya: $bookDir\kitap_tam.md" -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Yellow
