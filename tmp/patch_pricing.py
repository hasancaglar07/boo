from pathlib import Path
path = Path('web/src/app/pricing/page.tsx')
text = path.read_text(encoding='utf-8')
replacements = {
    '              text: "EPUB ve PDF her planda dahil. HTML ve Markdown Yazar planından itibaren. Tüm formatlar KDP ve e-kitap platformlarına uyumlu.",': '              text: "EPUB ve PDF her planda dahil. Ek export seçenekleri üst planlarda açılır. Teslim dosyaları yayın öncesi kontrol etmeyi kolaylaştıracak şekilde hazırlanır.",',
    '            Outline ve kapak önizlemesi ücretsiz. Tam kitap + EPUB/PDF için $4 — bir kez öde, senindir.\n            Aylık planlarda checkout\u0026apos;u doğrudan açıp hemen satın alabilirsin.': '            Outline ve kapak önizlemesi ücretsiz. Tam kitap + EPUB/PDF için $4 — bir kez öde, senindir.\n            Aylık planlarda uygun paketi seçip ödemeyi doğrudan başlatabilirsin.',
    '              checkout\u0026apos;u direkt aç →': '              ödemeyi direkt başlat →',
}
for before, after in replacements.items():
    if before not in text:
        print('MISSING:', before)
    else:
        text = text.replace(before, after)
path.write_text(text, encoding='utf-8')
print('patched')
