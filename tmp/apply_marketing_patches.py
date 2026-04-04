from pathlib import Path

# Fix pricing mojibake lines and copy
pricing = Path('web/src/app/pricing/page.tsx')
lines = pricing.read_text(encoding='utf-8', errors='replace').splitlines()
for idx, line in enumerate(lines):
    if 'Ek export se' in line and 'planlarda' in line:
        lines[idx] = '              text: "EPUB ve PDF her planda dahil. Ek export seçenekleri üst planlarda açılır. Teslim dosyaları yayın öncesi kontrol etmeyi kolaylaştıracak şekilde hazırlanır.",' 
    if 'Outline ve kapak' in line and 'Tam kitap' in line:
        lines[idx] = '            Outline ve kapak önizlemesi ücretsiz. Tam kitap + EPUB/PDF için $4 — bir kez öde, senindir.'
    if 'Aylık planlarda checkout' in line:
        lines[idx] = '            Aylık planlarda uygun paketi seçip ödemeyi doğrudan başlatabilirsin.'
    if 'checkout&apos;u direkt aç' in line:
        lines[idx] = '              ödemeyi direkt başlat →'
pricing.write_text('\n'.join(lines) + '\n', encoding='utf-8')

# Home page: add preview vs full access section and soften final CTA trust copy
home = Path('web/src/app/page.tsx')
text = home.read_text(encoding='utf-8')
needle = '      <HomeHowItWorksSection />\n'
insert = '''      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="Preview nasıl çalışır?"
            title="Önce preview görürsün, tam kitaba sonra geçersin."
            description="Ücretsiz kısım karar vermek içindir; tam erişim ise düzenleme ve teslim dosyalarını açar. Kullanıcı neyi ücretsiz gördüğünü, neyi ödeme sonrası açtığını ilk bakışta anlar."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-[28px] border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))]">
              <CardContent className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Ücretsiz preview</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Karar vermek için yeterli görünürlük</h3>
                <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                  <li>• Konu özeti ve kitap yönü</li>
                  <li>• Bölüm planı ve ilk yapı</li>
                  <li>• Kapak yönü / önizleme</li>
                  <li>• İlk içerik örneğini görme</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="rounded-[28px]">
              <CardContent className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Tam erişim</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Kitabı tamamlama ve dışa aktarma</h3>
                <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                  <li>• Tüm bölümleri açma ve düzenleme</li>
                  <li>• Kapak ve kitap bilgilerini netleştirme</li>
                  <li>• EPUB + PDF teslim dosyaları</li>
                  <li>• Aynı kitap üzerinde çalışmaya devam etme</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <HomeHowItWorksSection />
'''
if needle in text:
    text = text.replace(needle, insert, 1)
text = text.replace(
    '        description={`Konunu gir, bölüm planını gör, önizlemeyi aç — aynı akışta kapağın ve yayın dosyan hazır olur. ${NO_API_COST_CLAIM}, kredi kartı gerekmez ve kitaplar ${KDP_GUARANTEE_CLAIM} ile hazırlanır.`}',
    '        description={`Konunu gir, bölüm planını gör, önizlemeyi aç — aynı akışta kapağın ve yayın dosyan hazır olur. ${NO_API_COST_CLAIM}, kredi kartı gerekmez ve teslim paketi ${KDP_GUARANTEE_CLAIM} odağında hazırlanır.`}'
)
home.write_text(text, encoding='utf-8')

# Start page: stronger hierarchy/microcopy
start = Path('web/src/app/start/page.tsx')
text = start.read_text(encoding='utf-8')
text = text.replace('          En doğru ilk adım sihirbaz. Konunu gir, sistem seni yönlendirsin; kısa sürede bölüm planın, kapak yönün ve ilk önizlemen hazır olsun.', '          En doğru ilk adım sihirbaz. 5 kısa soruyla başlarsın; sistem seni yönlendirir, bölüm planın ve ilk preview hızlıca görünür olur.')
text = text.replace('          Kayıt şartsız başla', '          5 soruda başla')
insert2 = '''
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="rounded-full border border-border/80 bg-card px-3 py-1">Önerilen yol: sihirbaz</span>
        <span className="rounded-full border border-border/80 bg-card px-3 py-1">Yaklaşık 2 dakika</span>
        <span className="rounded-full border border-border/80 bg-card px-3 py-1">Önce preview, sonra karar</span>
      </div>
'''
text = text.replace('      {/* 3-Option Cards */}\n      <StartOptionCards />\n', insert2 + '      {/* 3-Option Cards */}\n      <StartOptionCards />\n')
start.write_text(text, encoding='utf-8')

# Start cards copy
cards = Path('web/src/components/site/start-option-cards.tsx')
text = cards.read_text(encoding='utf-8')
text = text.replace('    label: "Önerilen başlangıç: sihirbaz",', '    label: "Önerilen başlangıç: 5 soruluk sihirbaz",')
text = text.replace('    description: "Konunu gir, sistem seni adım adım yönlendirsin. Önce bölüm planını ve önizlemeyi gör, sonra tam kitabı açmaya karar ver.",', '    description: "Konunu gir, sistem seni adım adım yönlendirsin. Yaklaşık 5 kısa soruda bölüm planını ve preview’yi gör; tam kitabı açma kararını sonra ver.",')
text = text.replace('    cta: "Sihirbazı Başlat",', '    cta: "Şimdi Sihirbazı Başlat",')
cards.write_text(text, encoding='utf-8')

# Premium hero microcopy
hero = Path('web/src/components/site/premium-book-hero.tsx')
text = hero.read_text(encoding='utf-8')
text = text.replace('    subtitle = "Konunu yaz, wizard seni yönlendirsin. Outline, kapak ve ilk preview aynı akışta oluşsun. ChatGPT, Canva ve export araçları arasında dağılma.",', '    subtitle = "Konunu yaz, wizard seni yönlendirsin. 5 kısa soruda outline, kapak yönü ve ilk preview aynı akışta oluşsun; farklı araçlar arasında dağılma.",')
text = text.replace('    ctaText = "Ücretsiz Preview Başlat",', '    ctaText = "5 Soruda Ücretsiz Preview",')
text = text.replace('    trustNote = `Önce ücretsiz preview gör. Beğenirsen tam kitabı aç. · ${FULL_TRUST_CLAIM}`', '    trustNote = `Önce ücretsiz preview gör. Kredi kartı gerekmez; beğenirsen tam kitabı aç. · ${FULL_TRUST_CLAIM}`')
text = text.replace('        {/* Trust Microcopy */}\n', '        <motion.div\n          initial={{ opacity: 0, y: 12 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ delay: 0.72, duration: 0.5 }}\n          className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted-foreground"\n        >\n          {["5 kısa soru", "Önce preview", "Kredi kartı gerekmez"].map((item) => (\n            <span key={item} className="rounded-full border border-border/80 bg-card/70 px-3 py-1 backdrop-blur-sm">\n              {item}\n            </span>\n          ))}\n        </motion.div>\n\n        {/* Trust Microcopy */}\n')
hero.write_text(text, encoding='utf-8')

# Examples page trust block
examples = Path('web/src/app/examples/page.tsx')
text = examples.read_text(encoding='utf-8')
text = text.replace('      <ExamplesShowcase items={items} categories={categories} languages={languages} />\n', '''      <section className="border-b border-border/80 py-12">
        <div className="shell grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Sadece kapak değil",
              text: "Her örnekte bölüm planı, ilk bölüm önizlemesi ve export durumu birlikte görünür.",
            },
            {
              title: "Gerçek içerik preview",
              text: "Hızlı bak modunda içindekiler ve ilk bölüm metni yer alır; kaliteyi sadece görselden değil metinden de değerlendirirsin.",
            },
            {
              title: "Aynı akış sana da açık",
              text: "Beğendiğin örneğe benzer bir kitabı aynı start akışında kendi konunla başlatabilirsin.",
            },
          ].map(({ title, text }) => (
            <div key={title} className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <ExamplesShowcase items={items} categories={categories} languages={languages} />
''')
examples.write_text(text, encoding='utf-8')

# Contact page trust strip
contact = Path('web/src/app/contact/page.tsx')
text = contact.read_text(encoding='utf-8')
text = text.replace('      <section className="shell py-12">\n', '      <section className="shell py-12">\n        <div className="mb-8 grid gap-4 md:grid-cols-3">\n          {[\n            { title: "Genel yanıt süresi", text: "Çoğu mesajı aynı iş günü içinde yanıtlamayı hedefliyoruz." },\n            { title: "En hızlı çözüm için", text: "Kitap slug’ı, preview linki veya ekran görüntüsü paylaş." },\n            { title: "Konu seçimi önemli", text: "Faturalama, erişim ve teknik destek için doğru konu başlığı seçimi süreci hızlandırır." },\n          ].map(({ title, text }) => (\n            <Card key={title}>\n              <CardContent className="space-y-2">\n                <h3 className="text-sm font-semibold text-foreground">{title}</h3>\n                <p className="text-xs leading-6 text-muted-foreground">{text}</p>\n              </CardContent>\n            </Card>\n          ))}\n        </div>\n')
contact.write_text(text, encoding='utf-8')

# Contact form notes
form = Path('web/src/components/site/contact-form.tsx')
text = form.read_text(encoding='utf-8')
text = text.replace('              <h4 className="font-semibold text-foreground">Yanıt süresi</h4>\n              <p className="mt-1 text-sm text-muted-foreground">Genelde 2 saat içinde yanıt</p>', '              <h4 className="font-semibold text-foreground">Yanıt süresi</h4>\n              <p className="mt-1 text-sm text-muted-foreground">Çoğu mesaj aynı iş günü içinde yanıtlanır</p>')
text = text.replace('              <li>• Konu başlığı net olsun</li>\n              <li>• Kitap slug\'ını veya preview linkini ekleyin</li>\n              <li>• Gerekirse ekran görüntüsü paylaşın</li>', '              <li>• Konu başlığı net olsun</li>\n              <li>• Faturalama / erişim / teknik desteği doğru seçin</li>\n              <li>• Kitap slug\'ını veya preview linkini ekleyin</li>\n              <li>• Gerekirse ekran görüntüsü paylaşın</li>')
form.write_text(text, encoding='utf-8')

# Auth pages copy
login = Path('web/src/app/login/page.tsx')
text = login.read_text(encoding='utf-8')
text = text.replace('          Önizleme, kütüphane ve ödeme akışı aynı hesapta kalır. Giriş yap, kitabın kaldığı yerden devam etsin.', '          Bu ekran ödeme duvarı değildir. Preview, kütüphane ve ödeme akışı aynı hesapta kalır; giriş yapınca kitabın kaldığı yerden devam eder.')
text = text.replace('        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">', '        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-muted-foreground">\n          Preview hazır olduğunda aynı hesapta saklanır.\n        </div>\n        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">', 1)
login.write_text(text, encoding='utf-8')

signup = Path('web/src/app/signup/page.tsx')
text = signup.read_text(encoding='utf-8')
text = text.replace('          Bu adım ödeme için değil. Hazırlanan kitabını hesabına kaydetmek ve önizleme hazır olduğunda aynı yerden devam etmek için.', '          Bu adım ödeme için değil. Hazırlanan kitabını hesabına kaydetmek, preview’yi saklamak ve aynı yerden devam etmek için.')
text = text.replace('        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">', '        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-muted-foreground">\n          Hesabı açtıktan sonra preview ve satın alma akışı aynı yerde kalır.\n        </div>\n        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">', 1)
signup.write_text(text, encoding='utf-8')

print('all patches applied')
