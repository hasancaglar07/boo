$env:ANTHROPIC_API_KEY = 'sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98'
$headers = @{
    'x-api-key' = $env:ANTHROPIC_API_KEY
    'anthropic-version' = '2023-06-01'
    'content-type' = 'application/json'
}

# Adim 1: Kitap outline (iskelet) olustur
$body = @{
    model = 'GLM-5.1'
    max_tokens = 4000
    temperature = 0.7
    system = 'Sen profesyonel bir kitap yazarisin. Turkce kitap outline olusturuyorsun. JSON formatinda cevap ver.'
    messages = @(
        @{
            role = 'user'
            content = @'
Turkce bir kitap olustur. Konu: "Sessiz Disiplin: Gurultusuz Bir Hayat Nasıl Kurulur"

Bana su JSON formatinda bir outline ver:
{
  "title": "kitap basligi",
  "subtitle": "alt baslik",
  "author": "GLM AI",
  "chapters": [
    {"number": 1, "title": "bolum basligi", "summary": "2-3 cumlelik ozet"},
    {"number": 2, "title": "bolum basligi", "summary": "2-3 cumlelik ozet"}
  ]
}

Toplam 6 bolum olsun. Her bolum icerik uretmeye hazir olsun.
'@
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host '>>> GLM-5.1 Outline uretiliyor...' -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri 'https://claudecode2.codefast.app/v1/messages' -Method POST -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 120
$text = $response.content[0].text
Write-Host $text

# JSON'u dosyaya kaydet
$text | Out-File -FilePath 'book_outputs\test_book_outline.json' -Encoding UTF8
Write-Host ''
Write-Host '>>> Outline kaydedildi: book_outputs\test_book_outline.json' -ForegroundColor Green
