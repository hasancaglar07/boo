const fs = require('fs');
const path = 'C:\\Users\\ihsan\\Desktop\\BOOK\\web\\src\\lib\\marketing-data.ts';
let text = fs.readFileSync(path, 'utf-8');

// howItWorksPageSteps step 3
text = text.replace(
  `    title: "EPUB ve PDF'ini al",\n    text: "\u00D6nizlemeyi g\u00F6r, be\u011Fenirsen tam kitab\u0131 a\u00E7. \u00C7\u0131kt\u0131 dosyalar\u0131 KDP'ye y\u00FCklemeye haz\u0131r gelir.",`,
  `    title: "Get your EPUB and PDF",\n    text: "Preview your book, unlock the full version if you like it. Output files are ready for KDP upload.",`
);

// premiumPlan
text = text.replace('  name: "Tek Kitap",', '  name: "One Book",');
text = text.replace('  interval: "tek seferlik",', '  interval: "one-time",');
text = text.replace('  label: "1 kitap \u2014 abonelik yok, sonsuza sahip ol",', '  label: "1 book \u2014 no subscription, yours forever",');
text = text.replace(`  description: "Bir kez \u00F6de, kitab\u0131n senin \u2014 taslaktan EPUB'a kadar her \u015Fey dahil, abonelik yok.",`, `  description: "Pay once, the book is yours \u2014 from draft to EPUB, everything included, no subscription.",`);
text = text.replace('  badge: "Dene ve karar ver",', '  badge: "Try and decide",');
text = text.replace('    "1 tam kitap \u2014 t\u00FCm b\u00F6l\u00FCmler kilitsiz",', '    "1 complete book \u2014 all chapters unlocked",');
text = text.replace('    "AI kapak \u00FCretimi \u2014 3 stil, \u00F6zel renk paleti",', '    "AI cover generation \u2014 3 styles, custom color palette",');
text = text.replace(`    "EPUB + PDF \u00E7\u0131kt\u0131s\u0131 \u2014 KDP'ye y\u00FCklemeye haz\u0131r",`, `    "EPUB + PDF output \u2014 ready for KDP upload",`);
text = text.replace('    "\u00C7ok dilli \u00FCretim (T\u00FCrk\u00E7e, \u0130ngilizce ve daha fazlas\u0131)",', '    "Multilingual production (Turkish, English, and more)",');
text = text.replace('    "Ton ve hedef kitle ayar\u0131 (sihirbazdan)",', '    "Tone and target audience settings (from wizard)",');

// Starter plan
text = text.replace('    name: "Temel",', '    name: "Basic",');
text = text.replace(/    interval: "ayl\u0131k",/g, '    interval: "monthly",');
text = text.replace('    label: "Ayda 10 kitap",', '    label: "10 books per month",');
text = text.replace('    perUnit: "kitap ba\u015F\u0131na $1.90",', '    perUnit: "$1.90 per book",');
text = text.replace(`    description: "Ayda 10 kitapla ritim kur \u2014 kitap ba\u015F\u0131na $1.90, KDP'ye haz\u0131r \u00E7\u0131kt\u0131.",`, `    description: "Build your rhythm with 10 books per month \u2014 $1.90 per book, KDP-ready output.",`);
text = text.replace('      "Ayda 10 kitap \u00FCretimi",', '      "10 books per month generation",');
text = text.replace('      "Ayda 20 kapak hakk\u0131 \u2014 AI stilli, \u00F6zelle\u015Ftirilebilir",', '      "20 covers per month \u2014 AI styles, customizable",');
text = text.replace('      "EPUB + PDF \u00E7\u0131kt\u0131s\u0131 \u2014 her kitap i\u00E7in",', '      "EPUB + PDF output \u2014 for each book",');
text = text.replace('      "Sihirbaz ile h\u0131zl\u0131 taslak: konu \u2192 yap\u0131 \u2192 b\u00F6l\u00FCmler",', '      "Quick draft with wizard: topic \u2192 structure \u2192 chapters",');
text = text.replace('      "B\u00F6l\u00FCm edit\u00F6r\u00FC \u2014 d\u00FCzenle, yeniden \u00FCret, de\u011Fi\u015Ftir",', '      "Chapter editor \u2014 edit, regenerate, modify",');
text = text.replace('      "\u00C7ok dilli kitap deste\u011Fi",', '      "Multilingual book support",');
text = text.replace('      "Kitap \u00E7al\u0131\u015Fma alan\u0131 \u2014 t\u00FCm projeler tek yerde",', '      "Book workspace \u2014 all projects in one place",');
text = text.replace('      "Standart email destek",', '      "Standard email support",');

// Creator plan
text = text.replace('    name: "Yazar",', '    name: "Writer",');
text = text.replace('    label: "Ayda 30 kitap",', '    label: "30 books per month",');
text = text.replace('    badge: "En Pop\u00FCler",', '    badge: "Most Popular",');
text = text.replace('    perUnit: "kitap ba\u015F\u0131na $1.30",', '    perUnit: "$1.30 per book",');
text = text.replace(`    decoyNote: "St\u00FCdyo'nun %37'si kadar kitap, fiyat\u0131n\u0131n %49'u",`, `    decoyNote: "37% of Studio's books at 49% of the price",`);
text = text.replace(`    description: "Hangi konu satar? Ara\u015Ft\u0131r, 30 kitap \u00FCret, KDP'de b\u00FCy\u00FC \u2014 kitap ba\u015F\u0131na $1.30.",`, `    description: "Which topic sells? Research, produce 30 books, grow on KDP \u2014 $1.30 per book.",`);
text = text.replace('      "Ayda 30 kitap \u00FCretimi",', '      "30 books per month generation",');
text = text.replace('      "Ayda 60 kapak hakk\u0131 \u2014 tam \u00F6zelle\u015Ftirme",', '      "60 covers per month \u2014 full customization",');
text = text.replace('      "Ara\u015Ft\u0131rma merkezi \u2014 KDP trend ve anahtar kelime analizi",', '      "Research center \u2014 KDP trend and keyword analysis",');
text = text.replace('      "Pazar bo\u015Flu\u011Fu analizi \u2014 rakip kitap taramas\u0131",', '      "Market gap analysis \u2014 competitor book scanning",');
text = text.replace('      "EPUB, PDF ve HTML \u00E7\u0131kt\u0131lar\u0131",', '      "EPUB, PDF and HTML outputs",');
text = text.replace('      "B\u00F6l\u00FCm ba\u015F\u0131na yeniden \u00FCretim ve tone ayar\u0131",', '      "Per-chapter regeneration and tone adjustment",');
text = text.replace('      "\u00C7ok dilli seri \u00FCretim (ayn\u0131 konuyu farkl\u0131 dilde yay\u0131nla)",', '      "Multilingual series production (publish same topic in different languages)",');
text = text.replace('      "\u00D6ncelikli destek",', '      "Priority support",');

// Pro plan
text = text.replace('    name: "St\u00FCdyo",', '    name: "Studio",');
text = text.replace('    label: "Ayda 80 kitap",', '    label: "80 books per month",');
text = text.replace('    perUnit: "kitap ba\u015F\u0131na $0.99",', '    perUnit: "$0.99 per book",');
text = text.replace('    description: "80 kitap/ay, API eri\u015Fimi, otomasyon \u2014 kitap ba\u015F\u0131na $0.99, ek fatura yok.",', '    description: "80 books/month, API access, automation \u2014 $0.99 per book, no extra billing.",');
text = text.replace('      "Ayda 80 kitap \u00FCretimi \u2014 tam kapasite",', '      "80 books per month generation \u2014 full capacity",');
text = text.replace('      "Ayda 200 kapak hakk\u0131",', '      "200 covers per month",');
text = text.replace('      "T\u00FCm \u00E7\u0131kt\u0131 formatlar\u0131: EPUB, PDF, HTML, Markdown",', '      "All output formats: EPUB, PDF, HTML, Markdown",');
text = text.replace('      "Ara\u015Ft\u0131rma merkezi + geli\u015Fmi\u015F KDP pazar analizi",', '      "Research center + advanced KDP market analysis",');
text = text.replace('      "Seri ve tema bazl\u0131 toplu \u00FCretim",', '      "Series and theme-based bulk production",');
text = text.replace('      "B\u00F6l\u00FCm \u015Fablonlar\u0131 ve \u00F6zelle\u015Ftirilmi\u015F ton profilleri",', '      "Chapter templates and customized tone profiles",');
text = text.replace('      "API ve otomasyon eri\u015Fimi \u2014 kendi sistemlerine ba\u011Fla",', '      "API and automation access \u2014 connect to your systems",');
text = text.replace('      "\u00D6ncelikli destek + \u00F6zel ba\u015Flang\u0131\u00E7 rehberli\u011Fi",', '      "Priority support + custom onboarding guidance",');

fs.writeFileSync(path, text, 'utf-8');
console.log('Translation complete.');
