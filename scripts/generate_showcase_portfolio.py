#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import math
import re
import shutil
import struct
import subprocess
import sys
import textwrap
import unicodedata
import zipfile
import zlib
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "showcase-portfolio.json"
BOOK_OUTPUTS_DIR = ROOT / "book_outputs"
COVER_RENDER_SCRIPT = ROOT / "scripts" / "render_showcase_cover.mjs"
AI_COVER_BATCH_SCRIPT = ROOT / "scripts" / "generate_showcase_ai_covers.py"
SUPPORTED_LANGUAGES = {
    "English",
    "Turkish",
    "Spanish",
    "German",
    "French",
    "Portuguese",
    "Italian",
    "Dutch",
    "Arabic",
    "Japanese",
}
RTL_LANGUAGES = {"Arabic"}
HERO_EXPORT_FORMATS = {"html", "epub", "pdf"}
PREVIEW_EXPORT_FORMATS = {"html"}
INTRODUCTION_HEADINGS = {
    "English": "Introduction",
    "Turkish": "Giriş",
    "Spanish": "Introducción",
    "German": "Einführung",
    "French": "Introduction",
    "Portuguese": "Introdução",
    "Italian": "Introduzione",
    "Dutch": "Inleiding",
    "Arabic": "مقدمة",
    "Japanese": "はじめに",
}
READER_OUTPUT_REFERENCES = {
    "English": "a framework, checklist, or decision rule",
    "Turkish": "bir çerçeve, kontrol listesi ya da karar cümlesi",
    "Spanish": "un marco, una lista o una regla de decisión",
    "German": "ein Gerüst, eine Checkliste oder eine Entscheidungsregel",
    "French": "un cadre, une liste ou une règle de décision",
    "Portuguese": "um quadro, uma lista ou uma regra de decisão",
    "Italian": "una struttura, una checklist o una regola decisionale",
    "Dutch": "een kader, checklist of beslisregel",
    "Arabic": "إطاراً عملياً أو قائمة تحقق أو قاعدة قرار",
    "Japanese": "フレーム、チェックリスト、または判断基準",
}
CHAPTER_BODY_STRUCTURES = {
    "English": [
        [
            "This chapter turns {primary_focus} into a working advantage inside a book about {topic}. For {audience}, trust usually grows when one move becomes easier to repeat. {tone_signal}",
            "The hidden risk here is neglecting {secondary_focus} while trying to sound complete. That creates pages that feel informed but do not move the reader closer to {promise}.",
            "The practical aim is simple: leave this section with {reader_output}. If the idea can be reused in a draft, workshop, or client conversation, the chapter is earning its place.",
            "{title} therefore works as leverage, not decoration. Once the logic is easier to explain and demonstrate, the rest of the manuscript feels tighter and more commercially convincing.",
        ],
        [
            "Readers rarely fail from lack of effort first; they fail from sequence. {title} matters because it organizes {primary_focus} before the draft gets heavier than it needs to be.",
            "In books about {topic}, clarity appears when {audience} stop polishing too early and inspect {secondary_focus} with more honesty. That is where weak explanation turns into durable authority.",
            "A strong pass through this chapter produces {reader_output} and a clearer sense of why the promise works. The reader should feel less noise, more control, and a more obvious next move.",
            "That is why this section keeps returning to transferability. If the method is teachable here, the book starts behaving like an asset that supports demand instead of merely describing expertise.",
        ],
    ],
    "Turkish": [
        [
            "Bu bölüm, {topic} bağlamında {primary_focus} etrafında gerçek bir avantaj kurar. {audience} için güven çoğu zaman tek bir hamlenin tekrar edilebilir hale gelmesiyle büyür. {tone_signal}",
            "Buradaki gizli risk, metni eksiksiz göstermek isterken {secondary_focus} geri plana itmektir. O zaman sayfalar bilgili görünür ama okuru {promise} hedefine yaklaştırmaz.",
            "Bu kısmın pratik hedefi nettir: okurun elinde {reader_output} kalmalıdır. Fikir taslağa, atölyeye ya da müşteri konuşmasına taşınabiliyorsa bölüm görevini yapıyor demektir.",
            "{title} bu yüzden süs değil kaldıraç görevi görür. Mantık daha kolay anlatılır ve gösterilir hale geldiğinde kitabın geri kalanı da daha sıkı ve daha ikna edici görünür.",
        ],
        [
            "Okur çoğu zaman emek eksikliğinden değil, sıra hatasından zorlanır. {title}, {primary_focus} unsurunu taslak gereksiz ağırlık kazanmadan yerli yerine koyduğu için önemlidir.",
            "{topic} gibi kitaplarda netlik, {audience} erken cilalamayı bırakıp {secondary_focus} katmanına daha dürüst baktığında belirginleşir. Zayıf anlatım burada kalıcı otoriteye dönüşür.",
            "Bu bölümden iyi bir geçiş, okurun elinde {reader_output} ve vaadin neden çalıştığına dair daha berrak bir kavrayış bırakır. Gürültü azalmalı, kontrol hissi artmalı, sonraki adım görünürleşmelidir.",
            "Bu nedenle bu kısım sürekli aktarılabilirliğe döner. Metot burada öğretilebilir hale gelirse kitap yalnızca uzmanlığı anlatan değil, talebi destekleyen bir varlığa dönüşmeye başlar.",
        ],
    ],
    "Spanish": [
        [
            "Este capítulo convierte {primary_focus} en una ventaja utilizable dentro de {topic}. Para {audience}, la confianza suele crecer cuando un movimiento se vuelve fácil de repetir. {tone_signal}",
            "El riesgo oculto aquí es descuidar {secondary_focus} por intentar sonar completo. Así nacen páginas informadas que no acercan al lector a {promise}.",
            "La meta práctica es simple: salir de esta sección con {reader_output}. Si la idea puede reutilizarse en un borrador, un taller o una conversación comercial, el capítulo está cumpliendo.",
            "{title} funciona entonces como palanca y no como adorno. Cuando la lógica se vuelve más fácil de explicar y demostrar, el resto del manuscrito gana tensión y credibilidad comercial.",
        ],
        [
            "Los lectores rara vez fallan primero por falta de esfuerzo; fallan por secuencia. {title} importa porque organiza {primary_focus} antes de que el borrador se vuelva más pesado de lo necesario.",
            "En libros sobre {topic}, la claridad aparece cuando {audience} deja de pulir demasiado pronto y examina {secondary_focus} con más honestidad. Ahí la explicación débil se vuelve autoridad duradera.",
            "Una buena pasada por este capítulo deja {reader_output} y una comprensión más clara de por qué funciona la promesa. El lector debería sentir menos ruido, más control y un siguiente paso más visible.",
            "Por eso esta sección vuelve una y otra vez a la transferibilidad. Si el método se puede enseñar aquí, el libro empieza a comportarse como un activo que impulsa demanda y no solo como una descripción de experiencia.",
        ],
    ],
    "German": [
        [
            "Dieses Kapitel verwandelt {primary_focus} innerhalb von {topic} in einen nutzbaren Vorteil. Für {audience} wächst Vertrauen oft dann, wenn ein Schritt leichter wiederholbar wird. {tone_signal}",
            "Das verdeckte Risiko besteht hier darin, {secondary_focus} zu vernachlässigen, nur um vollständig zu wirken. So entstehen Seiten, die informiert klingen, den Leser aber nicht näher an {promise} bringen.",
            "Das praktische Ziel ist klar: Am Ende dieses Abschnitts sollte {reader_output} vorliegen. Wenn die Idee in einem Entwurf, Workshop oder Kundengespräch weiterverwendet werden kann, erfüllt das Kapitel seine Aufgabe.",
            "{title} wirkt deshalb als Hebel und nicht als Schmuck. Sobald die Logik leichter zu erklären und zu zeigen ist, wirkt der Rest des Manuskripts straffer und geschäftlich überzeugender.",
        ],
        [
            "Leser scheitern selten zuerst an fehlendem Einsatz, sondern an der Reihenfolge. {title} ist wichtig, weil es {primary_focus} sortiert, bevor der Entwurf schwerer wird als nötig.",
            "In Büchern über {topic} entsteht Klarheit dann, wenn {audience} zu frühes Polieren stoppt und {secondary_focus} ehrlicher prüft. Genau dort wird schwache Erklärung zu belastbarer Autorität.",
            "Ein starker Durchgang durch dieses Kapitel hinterlässt {reader_output} und ein klareres Gefühl dafür, warum das Versprechen trägt. Weniger Rauschen, mehr Kontrolle und ein sichtbarer nächster Schritt sind das Ziel.",
            "Darum kehrt dieser Teil immer wieder zur Übertragbarkeit zurück. Wenn die Methode hier lehrbar wird, beginnt das Buch wie ein Asset zu wirken, das Nachfrage unterstützt, statt Erfahrung nur zu beschreiben.",
        ],
    ],
    "French": [
        [
            "Ce chapitre transforme {primary_focus} en avantage exploitable à l'intérieur de {topic}. Pour {audience}, la confiance grandit souvent lorsqu'un mouvement devient simple à répéter. {tone_signal}",
            "Le risque caché ici consiste à négliger {secondary_focus} au moment même où l'on veut paraître complet. On obtient alors des pages informées qui ne rapprochent pas vraiment le lecteur de {promise}.",
            "L'objectif pratique est net: quitter cette section avec {reader_output}. Si l'idée peut être réutilisée dans un brouillon, un atelier ou une conversation commerciale, le chapitre joue son rôle.",
            "{title} agit donc comme un levier et non comme un ornement. Quand la logique devient plus facile à expliquer et à démontrer, le reste du manuscrit gagne en tenue et en force commerciale.",
        ],
        [
            "Les lecteurs échouent rarement d'abord par manque d'effort; ils échouent par ordre. {title} compte parce qu'il organise {primary_focus} avant que le manuscrit ne devienne plus lourd que nécessaire.",
            "Dans les livres sur {topic}, la clarté apparaît quand {audience} cesse de polir trop tôt et observe {secondary_focus} avec davantage de franchise. C'est là qu'une explication faible devient une autorité durable.",
            "Une bonne traversée de ce chapitre laisse {reader_output} ainsi qu'une compréhension plus précise de la promesse. Le lecteur doit sentir moins de bruit, davantage de maîtrise et une prochaine action plus visible.",
            "C'est pour cela que cette partie revient sans cesse à la transférabilité. Si la méthode devient transmissible ici, le livre commence à agir comme un actif qui nourrit la demande au lieu de simplement raconter une expertise.",
        ],
    ],
    "Portuguese": [
        [
            "Este capítulo transforma {primary_focus} em uma vantagem utilizável dentro de {topic}. Para {audience}, a confiança costuma crescer quando um movimento fica fácil de repetir. {tone_signal}",
            "O risco escondido aqui é abandonar {secondary_focus} no momento em que se tenta soar completo. Assim surgem páginas que parecem informadas, mas não aproximam o leitor de {promise}.",
            "O objetivo prático é claro: sair desta seção com {reader_output}. Se a ideia puder ser reutilizada em um rascunho, workshop ou conversa comercial, o capítulo está cumprindo seu papel.",
            "{title} funciona, então, como alavanca e não como enfeite. Quando a lógica fica mais fácil de explicar e demonstrar, o restante do manuscrito ganha firmeza e força comercial.",
        ],
        [
            "O leitor raramente trava primeiro por falta de esforço; trava por sequência. {title} importa porque organiza {primary_focus} antes que o rascunho fique mais pesado do que deveria.",
            "Em livros sobre {topic}, a clareza aparece quando {audience} para de polir cedo demais e encara {secondary_focus} com mais honestidade. É aí que uma explicação fraca vira autoridade durável.",
            "Uma boa passagem por este capítulo deixa {reader_output} e uma percepção mais nítida de por que a promessa funciona. O leitor deve sentir menos ruído, mais controle e um próximo passo mais visível.",
            "Por isso esta seção volta sempre à ideia de transferência. Se o método se torna ensinável aqui, o livro começa a agir como um ativo que apoia demanda em vez de apenas descrever experiência.",
        ],
    ],
    "Italian": [
        [
            "Questo capitolo trasforma {primary_focus} in un vantaggio utilizzabile dentro {topic}. Per {audience}, la fiducia cresce spesso quando un passaggio diventa facile da ripetere. {tone_signal}",
            "Il rischio nascosto qui è trascurare {secondary_focus} proprio mentre si prova a sembrare completi. Così nascono pagine informate che però non avvicinano il lettore a {promise}.",
            "L'obiettivo pratico è chiaro: uscire da questa sezione con {reader_output}. Se l'idea può essere riutilizzata in una bozza, in un workshop o in una conversazione commerciale, il capitolo sta funzionando.",
            "{title} agisce quindi come leva e non come ornamento. Quando la logica diventa più facile da spiegare e dimostrare, il resto del manoscritto acquista compattezza e forza commerciale.",
        ],
        [
            "I lettori raramente falliscono prima per mancanza di impegno; falliscono per sequenza. {title} conta perché ordina {primary_focus} prima che la bozza diventi più pesante del necessario.",
            "Nei libri su {topic}, la chiarezza emerge quando {audience} smette di rifinire troppo presto e guarda {secondary_focus} con più onestà. È lì che una spiegazione debole diventa autorevolezza durevole.",
            "Una buona lettura di questo capitolo lascia {reader_output} e una comprensione più nitida del perché la promessa funzioni. Il lettore dovrebbe sentire meno rumore, più controllo e un passo successivo più evidente.",
            "Per questo la sezione torna continuamente alla trasferibilità. Se qui il metodo diventa insegnabile, il libro inizia a comportarsi come un asset che sostiene la domanda invece di limitarsi a descrivere competenza.",
        ],
    ],
    "Dutch": [
        [
            "Dit hoofdstuk maakt van {primary_focus} een bruikbaar voordeel binnen {topic}. Voor {audience} groeit vertrouwen vaak wanneer één beweging gemakkelijker te herhalen wordt. {tone_signal}",
            "Het verborgen risico hier is dat {secondary_focus} wordt verwaarloosd terwijl de tekst volledig probeert te klinken. Dan ontstaan pagina's die slim ogen, maar de lezer niet dichter bij {promise} brengen.",
            "Het praktische doel is helder: deze sectie verlaten met {reader_output}. Als het idee bruikbaar is in een concept, workshop of klantgesprek, doet het hoofdstuk zijn werk.",
            "{title} werkt daarom als hefboom en niet als versiering. Zodra de logica eenvoudiger uit te leggen en te tonen is, voelt de rest van het manuscript strakker en commercieel overtuigender.",
        ],
        [
            "Lezers lopen zelden eerst vast door gebrek aan inzet; ze lopen vast op volgorde. {title} is belangrijk omdat het {primary_focus} ordent voordat het concept zwaarder wordt dan nodig.",
            "In boeken over {topic} verschijnt helderheid wanneer {audience} te vroeg polijsten loslaat en {secondary_focus} eerlijker onderzoekt. Daar verandert zwakke uitleg in blijvend gezag.",
            "Een sterke doorgang door dit hoofdstuk laat {reader_output} achter en een scherper gevoel voor waarom de belofte werkt. Minder ruis, meer grip en een zichtbaarder volgende stap zijn het doel.",
            "Daarom keert dit deel steeds terug naar overdraagbaarheid. Als de methode hier leerbaar wordt, begint het boek zich te gedragen als een asset dat vraag ondersteunt in plaats van alleen expertise te beschrijven.",
        ],
    ],
    "Arabic": [
        [
            "يحوّل هذا الفصل {primary_focus} إلى أفضلية عملية داخل {topic}. بالنسبة إلى {audience}، تنمو الثقة غالباً حين يصبح أحد التحركات أسهل في التكرار. {tone_signal}",
            "الخطر الخفي هنا هو إهمال {secondary_focus} أثناء محاولة الظهور بصورة مكتملة. عندها تبدو الصفحات مثقفة، لكنها لا تقرّب القارئ من {promise}.",
            "الهدف العملي واضح: يجب أن يخرج القارئ من هذا الجزء ومعه {reader_output}. إذا أمكن إعادة استخدام الفكرة في المسودة أو الورشة أو محادثة بيع، فهذا يعني أن الفصل يؤدي وظيفته.",
            "لهذا يعمل {title} كنقطة رافعة لا كزينة. وعندما تصبح الفكرة أسهل في الشرح والإظهار، يبدو بقية المخطوط أكثر إحكاماً وأكثر إقناعاً من الناحية التجارية.",
        ],
        [
            "نادراً ما يتعثر القارئ أولاً بسبب نقص الجهد؛ بل يتعثر بسبب الترتيب. تبرز أهمية {title} لأنه ينظم {primary_focus} قبل أن تصبح المسودة أثقل مما ينبغي.",
            "في الكتب التي تدور حول {topic}، يظهر الوضوح عندما يتوقف {audience} عن التلميع المبكر وينظرون إلى {secondary_focus} بصدق أكبر. هنا بالذات تتحول الشروحات الضعيفة إلى سلطة قابلة للاستمرار.",
            "المرور الجيد على هذا الفصل يجب أن يترك لدى القارئ {reader_output} وفهماً أوضح لسبب نجاح الوعد. المطلوب ضجيج أقل، وتحكم أكبر، وخطوة تالية أكثر ظهوراً.",
            "ولهذا يعود هذا الجزء دائماً إلى قابلية النقل والتعليم. فإذا أصبحت الطريقة قابلة للتعليم هنا، بدأ الكتاب يتصرف كأصل يدعم الطلب بدلاً من مجرد وصف الخبرة.",
        ],
    ],
    "Japanese": [
        [
            "この章は、{primary_focus} を {topic} の中で使える強みに変えるための章です。{audience} にとって信頼は、一つの動きが繰り返しやすくなったときに大きく育ちます。{tone_signal}",
            "ここで見落とされやすいのは、全体を整えようとするあまり {secondary_focus} を後回しにすることです。すると情報量はあっても、読者を {promise} に近づけないページになります。",
            "実務的な目標は明快です。この節を読み終える頃には、読者の手元に {reader_output} が残っていること。草稿、ワークショップ、商談で再利用できるなら、この章は役割を果たしています。",
            "だからこそ {title} は飾りではなくレバレッジとして機能します。論理が説明しやすく、見せやすくなるほど、原稿全体は引き締まり、商業的な説得力も高まります。",
        ],
        [
            "読者が最初につまずく理由は、努力不足より順序の乱れであることが少なくありません。{title} が重要なのは、原稿が不必要に重くなる前に {primary_focus} を整理できるからです。",
            "{topic} を扱う本では、{audience} が早すぎる磨き込みをやめ、{secondary_focus} をもう一段正直に見直したときに明瞭さが生まれます。弱い説明が持続する権威に変わるのはその地点です。",
            "この章をしっかり通過すると、読者の手元には {reader_output} と、なぜ約束が機能するのかという理解が残ります。ノイズが減り、コントロール感が増し、次の一手が見えやすくなるべきです。",
            "そのためこのパートは何度も再利用性へ戻ってきます。ここで方法が教えられる形になれば、本は知識を述べるだけでなく、需要を支える資産として振る舞い始めます。",
        ],
    ],
}


@dataclass
class BookEntry:
    slug: str
    languageCode: str
    languageLabel: str
    chapterLabel: str
    category: str
    toneArchetype: str
    title: str
    subtitle: str
    summary: str
    author: str
    authorBio: str
    publisher: str
    brandingMark: str
    brandingLogoSvg: str
    coverBrief: str
    chapterCount: int
    heroRank: int
    exportTarget: str
    type: str
    tags: list[str]
    topic: str
    audience: str
    promise: str
    spineColor: str
    coverGradient: str
    accentColor: str
    textAccent: str
    year: str
    coverPrompt: str = ""
    openingNote: str = ""
    readerHook: str = ""
    coverTemplateHint: str = ""
    titleTone: str = ""
    coverHierarchy: str = ""


LANGUAGE_PACKS: dict[str, dict[str, Any]] = {
    "English": {
        "pageLabel": "pp.",
        "foundation": [
            "the promise readers can repeat in one sentence",
            "the friction your audience already feels every week",
            "the narrow transformation that raises attention",
            "the hidden cost of staying vague",
            "the first proof point that changes belief",
            "the reader question that deserves page one",
            "the promise that separates signal from noise",
            "the quick win that earns page-level trust",
            "the decision readers postpone for too long",
            "the common myth that weakens authority",
            "the real starting line for this method",
            "the urgency behind the book's core shift",
        ],
        "system": [
            "a framework readers can apply without your presence",
            "a chapter architecture that keeps momentum alive",
            "a repeatable routine that makes the method teachable",
            "a sequence of decisions that reduces reader confusion",
            "a logic chain that makes your argument easy to trust",
            "a structure that turns notes into a marketable asset",
            "an operating rhythm that prevents half-finished drafts",
            "a lesson flow that moves from insight to action",
            "a method stack that feels practical instead of abstract",
            "a system for keeping examples concrete and memorable",
            "a teaching rhythm that rewards consistent reading",
            "a backbone that makes the book feel professionally built",
        ],
        "execution": [
            "examples that make the method feel lived-in",
            "language choices that sharpen perceived value",
            "exercises that create commitment, not busywork",
            "case notes that remove silent objections",
            "prompts that turn reflection into movement",
            "proof moments that help the reader trust your standard",
            "supporting assets that extend the chapter's usefulness",
            "decision checkpoints that stop drift early",
            "editing passes that keep the message tight",
            "narrative beats that make the lesson easier to hold",
            "tools that save time without lowering quality",
            "reader actions that create visible momentum",
        ],
        "scale": [
            "offer bridges that connect the book to real revenue",
            "distribution habits that keep the asset working longer",
            "positioning cues that raise the quality of inbound demand",
            "a follow-up path that makes the next step obvious",
            "authority signals buyers notice before they inquire",
            "metrics that show whether the message is landing",
            "a repurposing plan for talks, pages, and workshops",
            "the proof loop that compounds trust over time",
            "a packaging strategy that protects premium pricing",
            "reader milestones that reveal where demand grows",
            "team handoffs that preserve your editorial standard",
            "a visibility system that keeps the book commercially useful",
        ],
        "closing": [
            "revision habits that make the book sharper every quarter",
            "long-tail advantages that outlast launch week",
            "reader feedback that improves the next edition",
            "the next authority asset this book should trigger",
            "a closing promise the reader will remember later",
            "the habits that keep quality high after publication",
            "the small refinements that raise trust fastest",
            "a maintenance ritual that protects credibility",
            "the final test for a book that truly converts",
            "how to keep clarity when the market gets noisy",
            "the lasting edge created by editorial discipline",
            "the quiet follow-through that keeps the asset selling",
        ],
        "titleTemplates": [
            "Clarify {focus}",
            "Design {focus}",
            "Build {focus}",
            "Use {focus}",
            "Protect {focus}",
        ],
        "paragraphs": [
            "This chapter matters because {title_lower} is where {topic} stops sounding attractive in theory and starts becoming believable in practice. For {audience}, the difference between vague ambition and trusted authority is usually one missing layer of structure. {tone_signal} By the end of the chapter, the reader should feel the method getting lighter, clearer, and easier to act on.",
            "Most readers already know they want {promise}, but they usually attack the work from the wrong side. They collect more notes, add more explanations, and delay the hard editorial decisions that create confidence. Here the goal is to expose that friction early, name it plainly, and replace it with a smaller move the reader can actually complete without burning attention or momentum.",
            "A useful chapter does not simply motivate; it arranges choices in the right order. First, the reader identifies what must stay fixed. Second, they remove anything that dilutes the promise. Third, they shape a working sequence that can be repeated tomorrow with the same level of clarity. That is how the book starts behaving like an operating system instead of a pile of interesting pages.",
            "When the reader applies this section well, they are not left with abstract insight. They leave with a page, decision, checklist, or positioning sentence that can be used immediately in the draft, in a client conversation, or in the next revision round. That practical shift is what turns a strong chapter into a sales asset instead of a pleasant read that changes nothing.",
            "The deeper lesson is simple: authority compounds when clarity is easier to see than effort. If the reader can make one visible improvement now, the next chapter feels lighter and the whole book gains credibility. That is why this section keeps pushing toward clean decisions, concrete proof, and a result the reader can feel before the book is even finished.",
        ],
        "toneSignals": {
            "Operator Playbook": "The tone is operational on purpose: every page should help the reader make a sharper commercial decision.",
            "Mentor Guide": "The tone stays generous and steady so the reader feels guided, not judged.",
            "Systems Manual": "The tone stays precise so the reader can trust the sequence, not just the idea.",
            "Story-led Manifesto": "The tone carries a little more narrative energy because belief often shifts before behavior does.",
            "Workbook": "The tone keeps returning to practice because insight without use is wasted motion.",
            "Calm Executive Brief": "The tone is intentionally calm, reducing noise so the next move feels obvious.",
        },
    },
    "Turkish": {
        "pageLabel": "s.",
        "foundation": [
            "okurun tek cümlede tekrarlayacağı vaadi",
            "hedef kitlenin zaten yaşadığı görünmez sürtünmeyi",
            "dikkati yükselten dar dönüşüm alanını",
            "muğlak kalmanın gerçek maliyetini",
            "inancı değiştiren ilk kanıt katmanını",
            "ilk sayfada cevaplanması gereken ana soruyu",
            "gürültüyü ayıklayan net konum cümlesini",
            "güven oluşturan ilk hızlı kazanımı",
            "okurun ertelediği temel kararı",
            "otoriteyi zayıflatan yaygın miti",
            "bu metodun gerçek başlangıç çizgisini",
            "kitabın merkez dönüşüm nedenini",
        ],
        "system": [
            "okurun sensiz de uygulayabileceği çerçeveyi",
            "temponun düşmesini engelleyen bölüm mimarisini",
            "metodu öğretilebilir kılan tekrar ritmini",
            "okur kafa karışıklığını azaltan karar sırasını",
            "argümanı daha güvenilir kılan mantık zincirini",
            "notları pazarlanabilir bir varlığa çeviren yapıyı",
            "yarım kalan taslakları önleyen çalışma düzenini",
            "içgörüden eyleme ilerleyen öğrenme akışını",
            "soyutluğu azaltan yöntem katmanını",
            "örnekleri somut tutan açıklama sistemini",
            "sürekli okumayı ödüllendiren öğretim ritmini",
            "kitabı profesyonel hissettiren iskeleti",
        ],
        "execution": [
            "metodu yaşayan örneklerle görünür kılan sahneleri",
            "algılanan değeri keskinleştiren dil tercihlerini",
            "okuru oyalamayan uygulama egzersizlerini",
            "sessiz itirazları çözen vaka notlarını",
            "düşünceyi harekete çeviren promptları",
            "okurun standardına güvenmesini sağlayan kanıt anlarını",
            "bölümün değerini uzatan yardımcı varlıkları",
            "erken sapmayı durduran karar duraklarını",
            "mesajı sıkı tutan revizyon turunu",
            "dersi daha kolay taşıyan anlatı vuruşlarını",
            "zaman kazandıran ama kalite düşürmeyen araçları",
            "görünür ilerleme üreten okur aksiyonlarını",
        ],
        "scale": [
            "kitabı gerçek gelire bağlayan teklif köprülerini",
            "varlığın ömrünü uzatan dağıtım alışkanlıklarını",
            "gelen talebin kalitesini yükselten konum ipuçlarını",
            "sonraki adımı doğal kılan takip yolunu",
            "sorudan önce fark edilen otorite sinyallerini",
            "mesajın çalışıp çalışmadığını gösteren ölçümleri",
            "konuşma, sayfa ve atölyeye açılan yeniden kullanım planını",
            "zamanla güveni büyüten kanıt döngüsünü",
            "premium fiyatı koruyan paketleme yaklaşımını",
            "talebin nerede büyüdüğünü gösteren okur kilometre taşlarını",
            "editoryal standardı koruyan ekip devrini",
            "kitabı ticari olarak canlı tutan görünürlük düzenini",
        ],
        "closing": [
            "kitabı her çeyrek daha keskin yapan revizyon alışkanlığını",
            "lansman haftasını aşan uzun kuyruk avantajını",
            "sonraki baskıyı güçlendiren okur geri bildirimini",
            "bu kitabın tetiklemesi gereken sonraki varlığı",
            "okurun sonra da hatırlayacağı kapanış vaadini",
            "yayından sonra kaliteyi yüksek tutan davranışları",
            "güveni en hızlı yükselten küçük iyileştirmeleri",
            "inandırıcılığı koruyan bakım ritüelini",
            "dönüşüm üreten kitabın son testini",
            "pazar gürültüsünde netliği korumanın yolunu",
            "editoryal disiplinin bıraktığı kalıcı avantajı",
            "varlığın satmaya devam etmesini sağlayan sessiz devamlılığı",
        ],
        "titleTemplates": [
            "{focus} netleştir",
            "{focus} tasarla",
            "{focus} kur",
            "{focus} görünür hale getir",
            "{focus} koru",
        ],
        "paragraphs": [
            "Bu bölüm kritik çünkü {title_lower}, {topic} konusunun fikir düzeyinden çıkıp okurun gözünde gerçek değere dönüşmesini sağlar. {audience} için asıl farkı yaratan şey çoğu zaman daha fazla bilgi değil, daha iyi yerleştirilmiş bir yapı olur. {tone_signal} Bölüm ilerledikçe okur hem neyi bırakması gerektiğini hem de neyi görünür kılması gerektiğini daha net görür.",
            "Birçok okur aslında {promise} istediğini bilir; fakat işe yanlış taraftan başlar. Daha çok not toplar, daha çok açıklama ekler ve güven oluşturan editoryal kararları geciktirir. Bu bölümün görevi, o gizli sürtünmeyi erken teşhis etmek, adıyla çağırmak ve yerine bugün uygulanabilecek daha küçük ama daha etkili bir hareket koymaktır.",
            "İyi çalışan bir bölüm yalnızca motive etmez; kararları doğru sıraya dizer. Önce vazgeçilmez olanı sabitler. Sonra vaadi bulanıklaştıran yükleri temizler. Ardından yarın da aynı berraklıkla tekrar edilebilecek bir akış kurar. Böylece kitap, ilginç fikir yığınından çıkıp gerçek bir çalışma sistemi gibi davranmaya başlar.",
            "Bu kısmı doğru uygulayan okur soyut bir farkındalıkla kalmaz. Elinde hemen kullanabileceği bir sayfa, cümle, kontrol listesi ya da bölüm kararı olur. Asıl dönüşüm burada gerçekleşir: okur sadece düşünmez, taslağa, müşteri konuşmasına ya da sonraki revizyona doğrudan taşınabilecek bir çıktı üretir.",
            "Bölümün derin mesajı şudur: güven, emekten önce netlik görünür olduğunda birikir. Okur bugün tek bir somut iyileştirme yaptığında sonraki bölüm hafifler ve kitabın tamamı daha ikna edici hale gelir. Bu yüzden bu bölüm temiz kararlara, gözle görülen kanıta ve bitmeden önce hissedilebilen sonuca doğru iter.",
        ],
        "toneSignals": {
            "Operator Playbook": "Bu ton özellikle operasyona yaslanır; her sayfa daha net ticari karar üretmelidir.",
            "Mentor Guide": "Ton bilinçli olarak rehberlik eder; okur baskı değil yön hisseder.",
            "Systems Manual": "Tonun net kalması gerekir; okur fikre değil sıraya güvenmelidir.",
            "Story-led Manifesto": "Ton biraz daha anlatı taşır; çünkü önce inanç değişir, sonra davranış.",
            "Workbook": "Ton sürekli uygulamaya döner; çünkü kullanılmayan içgörü hızla buharlaşır.",
            "Calm Executive Brief": "Ton bilerek sakin tutulur; gürültü azalınca bir sonraki hamle görünür olur.",
        },
    },
    "Spanish": {
        "pageLabel": "pp.",
        "foundation": [
            "la promesa que el lector debe sentir en una frase",
            "la fricción que tu audiencia ya vive cada semana",
            "la transformación concreta que realmente llama la atención",
            "el costo silencioso de seguir siendo ambiguo",
            "la primera prueba que cambia la creencia del lector",
            "la pregunta clave que merece la primera página",
            "la frase de posicionamiento que limpia el ruido",
            "la victoria rápida que gana confianza desde el inicio",
            "la decisión que el lector ha postergado demasiado",
            "el mito que debilita la autoridad sin que se note",
            "el verdadero punto de partida del método",
            "la urgencia detrás del cambio central del libro",
        ],
        "system": [
            "un marco que el lector pueda aplicar sin ti",
            "una arquitectura de capítulos que mantenga el ritmo",
            "una rutina repetible que vuelva enseñable el método",
            "una secuencia de decisiones que reduzca confusión",
            "una cadena lógica que haga creíble el argumento",
            "una estructura que convierta notas en activo comercial",
            "un ritmo de trabajo que evite borradores a medias",
            "un flujo didáctico que una idea y acción",
            "una capa metodológica que suene práctica y no abstracta",
            "un sistema para que los ejemplos se recuerden",
            "un ritmo pedagógico que premie la continuidad",
            "una columna vertebral que haga profesional al libro",
        ],
        "execution": [
            "ejemplos que hagan vivible el método",
            "decisiones de lenguaje que eleven el valor percibido",
            "ejercicios que creen compromiso y no relleno",
            "notas de caso que resuelvan objeciones silenciosas",
            "prompts que conviertan reflexión en movimiento",
            "momentos de prueba que refuercen tu estándar",
            "activos de apoyo que extiendan la utilidad del capítulo",
            "puntos de control que frenen la deriva a tiempo",
            "rondas de edición que mantengan el mensaje tenso",
            "golpes narrativos que vuelvan fácil la lección",
            "herramientas que ahorren tiempo sin bajar calidad",
            "acciones del lector que muestren avance visible",
        ],
        "scale": [
            "puentes hacia ofertas reales y mejores ingresos",
            "hábitos de distribución que alarguen la vida del activo",
            "señales de posicionamiento que eleven la calidad de la demanda",
            "una ruta de seguimiento que vuelva obvio el siguiente paso",
            "señales de autoridad que el comprador nota antes de preguntar",
            "métricas que revelen si el mensaje está entrando",
            "un plan de reutilización para charlas, páginas y talleres",
            "el ciclo de prueba que multiplica confianza con el tiempo",
            "una forma de empaquetar que proteja precios premium",
            "hitos del lector que muestren dónde crece la demanda",
            "relevos de equipo que conserven el estándar editorial",
            "un sistema de visibilidad que mantenga útil el libro",
        ],
        "closing": [
            "hábitos de revisión que afinen el libro cada trimestre",
            "ventajas de largo plazo que superen la semana del lanzamiento",
            "feedback de lectores que fortalezca la siguiente edición",
            "el siguiente activo que este libro debería activar",
            "la promesa final que el lector recordará después",
            "los hábitos que sostienen la calidad tras publicar",
            "los ajustes pequeños que suben la confianza más rápido",
            "el ritual de mantenimiento que protege credibilidad",
            "la prueba final de un libro que realmente convierte",
            "la forma de conservar claridad cuando el mercado hace ruido",
            "la ventaja duradera de la disciplina editorial",
            "la constancia silenciosa que sigue vendiendo el activo",
        ],
        "titleTemplates": [
            "Aclara {focus}",
            "Diseña {focus}",
            "Construye {focus}",
            "Activa {focus}",
            "Protege {focus}",
        ],
        "paragraphs": [
            "Este capítulo importa porque {title_lower} es el punto donde {topic} deja de sonar bien en teoría y empieza a sentirse útil en la práctica. Para {audience}, la diferencia entre una idea bonita y una autoridad visible casi siempre depende de una capa extra de estructura. {tone_signal} Cuando el lector termina esta parte, debería notar más dirección, menos ruido y una sensación concreta de avance.",
            "La mayoría de los lectores sabe que quiere {promise}, pero suele atacar el trabajo desde el lado equivocado. Reúne más notas, añade más explicación y posterga las decisiones editoriales que generan confianza. Aquí el objetivo es exponer esa fricción a tiempo, nombrarla con precisión y cambiarla por un movimiento más pequeño y más viable.",
            "Un capítulo útil no se limita a inspirar; ordena decisiones. Primero fija lo que no debe moverse. Después elimina todo lo que diluye la promesa. Finalmente crea una secuencia que pueda repetirse mañana con la misma claridad. Así el libro empieza a comportarse como un sistema de trabajo y no como un montón de páginas interesantes.",
            "Si el lector aplica bien esta sección, no sale solo con una reflexión agradable. Sale con una frase, una lista, una decisión o un mini activo que puede usar de inmediato en el borrador, en una conversación comercial o en la siguiente revisión. Esa transferencia práctica es lo que convierte un capítulo sólido en un activo que vende confianza.",
            "La lección profunda es simple: la autoridad crece cuando la claridad se ve antes que el esfuerzo. Si el lector logra una mejora visible ahora, el siguiente capítulo se vuelve más ligero y el libro entero gana credibilidad. Por eso esta parte empuja hacia decisiones limpias, pruebas concretas y resultados que ya se sienten antes del cierre.",
        ],
        "toneSignals": {
            "Operator Playbook": "El tono es operativo a propósito: cada página debe ayudar al lector a decidir mejor.",
            "Mentor Guide": "El tono se mantiene cercano y estable para que el lector se sienta acompañado.",
            "Systems Manual": "El tono busca precisión para que el lector confíe en la secuencia y no solo en la idea.",
            "Story-led Manifesto": "El tono lleva algo más de narrativa porque primero cambia la creencia y luego la acción.",
            "Workbook": "El tono vuelve una y otra vez a la práctica porque la idea sin uso se enfría rápido.",
            "Calm Executive Brief": "El tono reduce ruido de forma deliberada para que el siguiente movimiento se vea claro.",
        },
    },
    "German": {
        "pageLabel": "S.",
        "foundation": [
            "das Versprechen, das Leser in einem Satz wiedergeben können",
            "die Reibung, die deine Zielgruppe bereits jede Woche spürt",
            "die enge Transformation, die wirklich Aufmerksamkeit erzeugt",
            "die stillen Kosten unklarer Positionierung",
            "den ersten Beweis, der Überzeugung verändert",
            "die Leitfrage, die auf Seite eins stehen muss",
            "die Positionierung, die Signal von Rauschen trennt",
            "den schnellen Gewinn, der Vertrauen früh verdient",
            "die Entscheidung, die Leser zu lange aufschieben",
            "den Mythos, der Autorität heimlich schwächt",
            "die echte Startlinie dieser Methode",
            "die Dringlichkeit hinter der Kernveränderung des Buches",
        ],
        "system": [
            "ein Gerüst, das Leser ohne dich anwenden können",
            "eine Kapitelarchitektur, die das Tempo hält",
            "eine wiederholbare Routine, die die Methode lehrbar macht",
            "eine Entscheidungsfolge, die Verwirrung reduziert",
            "eine Logikkette, die das Argument glaubwürdig macht",
            "eine Struktur, die Notizen in ein vermarktbares Asset verwandelt",
            "einen Arbeitsrhythmus, der halbfertige Entwürfe verhindert",
            "einen Lernfluss von Einsicht zu Handlung",
            "eine Methodenschicht, die praktisch statt abstrakt wirkt",
            "ein System, das Beispiele konkret und erinnerbar hält",
            "einen didaktischen Rhythmus, der Kontinuität belohnt",
            "ein Rückgrat, das dem Buch professionelle Form gibt",
        ],
        "execution": [
            "Beispiele, die die Methode erlebbar machen",
            "Sprachentscheidungen, die den wahrgenommenen Wert schärfen",
            "Übungen, die Verpflichtung statt Leerlauf erzeugen",
            "Fallnotizen, die stille Einwände auflösen",
            "Prompts, die Reflexion in Bewegung verwandeln",
            "Beweismomente, die den Standard glaubwürdig machen",
            "Begleitassets, die den Nutzen des Kapitels verlängern",
            "Prüfpunkte, die Abdriften früh stoppen",
            "Redaktionsrunden, die die Botschaft straff halten",
            "erzählerische Marker, die die Lektion tragfähig machen",
            "Werkzeuge, die Zeit sparen ohne Qualität zu senken",
            "Leseraktionen, die sichtbaren Fortschritt erzeugen",
        ],
        "scale": [
            "Brücken zu realen Angeboten und besserem Umsatz",
            "Verteilungsgewohnheiten, die das Asset länger arbeiten lassen",
            "Positionierungssignale, die die Nachfragequalität erhöhen",
            "einen Folgepfad, der den nächsten Schritt offensichtlich macht",
            "Autoritätssignale, die Käufer vor der Anfrage bemerken",
            "Kennzahlen, die zeigen, ob die Botschaft trägt",
            "einen Wiederverwendungsplan für Talks, Seiten und Workshops",
            "die Beweisschleife, die Vertrauen mit der Zeit verdichtet",
            "eine Verpackung, die Premiumpreise schützt",
            "Leser-Meilensteine, die Nachfrage sichtbar machen",
            "Übergaben im Team, die den redaktionellen Standard wahren",
            "ein Sichtbarkeitssystem, das das Buch geschäftlich relevant hält",
        ],
        "closing": [
            "Revisionsgewohnheiten, die das Buch quartalsweise schärfen",
            "Langzeiteffekte, die weit über Launch-Wochen hinausgehen",
            "Leserfeedback, das die nächste Ausgabe stärkt",
            "das nächste Asset, das dieses Buch auslösen sollte",
            "das Schlussversprechen, das Leser später noch erinnern",
            "die Gewohnheiten, die Qualität nach der Veröffentlichung halten",
            "kleine Verfeinerungen, die Vertrauen am schnellsten steigern",
            "das Wartungsritual, das Glaubwürdigkeit schützt",
            "den Abschlusstest für ein Buch, das wirklich konvertiert",
            "die Art, Klarheit auch im Marktlärm zu behalten",
            "den dauerhaften Vorteil redaktioneller Disziplin",
            "die leise Kontinuität, durch die das Asset weiter verkauft",
        ],
        "titleTemplates": [
            "{focus} klären",
            "{focus} gestalten",
            "{focus} aufbauen",
            "{focus} aktivieren",
            "{focus} schützen",
        ],
        "paragraphs": [
            "Dieses Kapitel ist wichtig, weil {title_lower} der Punkt ist, an dem {topic} nicht mehr nur theoretisch überzeugend klingt, sondern praktisch belastbar wird. Für {audience} entsteht der eigentliche Unterschied selten durch mehr Wissen, sondern durch bessere Anordnung. {tone_signal} Am Ende dieses Abschnitts soll der Leser mehr Richtung, weniger Nebel und ein spürbar stabileres Vorgehen haben.",
            "Viele Leser wissen bereits, dass sie {promise} wollen, greifen die Arbeit aber von der falschen Seite an. Sie sammeln mehr Notizen, fügen mehr Erklärungen hinzu und verschieben genau die redaktionellen Entscheidungen, die Vertrauen erzeugen. Hier wird diese Reibung früh sichtbar gemacht, präzise benannt und durch einen kleineren, machbaren nächsten Schritt ersetzt.",
            "Ein nützliches Kapitel motiviert nicht nur, es sortiert Entscheidungen. Zuerst wird fixiert, was nicht verwässert werden darf. Danach wird entfernt, was das Versprechen trübt. Anschließend entsteht eine Abfolge, die morgen mit derselben Klarheit wiederholt werden kann. So beginnt das Buch, wie ein Betriebssystem zu wirken und nicht wie ein Stapel interessanter Seiten.",
            "Wenn der Leser diesen Abschnitt sauber umsetzt, bleibt er nicht bei einer bloßen Einsicht stehen. Er nimmt eine Formulierung, eine Liste, eine Entscheidung oder ein konkretes Asset mit, das direkt in den Entwurf, in ein Kundengespräch oder in die nächste Überarbeitung wandern kann. Genau diese Übertragbarkeit macht aus einem starken Kapitel ein Vertrauensasset.",
            "Die tiefere Botschaft ist einfach: Autorität wächst dann, wenn Klarheit schneller sichtbar wird als Anstrengung. Gelingt jetzt eine sichtbare Verbesserung, wirkt das nächste Kapitel leichter und das ganze Buch überzeugender. Deshalb drängt dieser Abschnitt auf saubere Entscheidungen, konkrete Beweise und ein Ergebnis, das noch vor dem Abschluss fühlbar wird.",
        ],
        "toneSignals": {
            "Operator Playbook": "Der Ton ist bewusst operativ: Jede Seite soll eine schärfere geschäftliche Entscheidung ermöglichen.",
            "Mentor Guide": "Der Ton bleibt zugewandt und ruhig, damit sich der Leser geführt statt belehrt fühlt.",
            "Systems Manual": "Der Ton setzt auf Präzision, damit der Leser der Reihenfolge vertrauen kann.",
            "Story-led Manifesto": "Der Ton trägt etwas mehr Erzählenergie, weil sich erst die Überzeugung und dann das Verhalten verändert.",
            "Workbook": "Der Ton kehrt konsequent zur Anwendung zurück, weil ungenutzte Einsicht schnell verpufft.",
            "Calm Executive Brief": "Der Ton reduziert bewusst Lärm, damit der nächste Schritt klarer sichtbar wird.",
        },
    },
    "French": {
        "pageLabel": "pp.",
        "foundation": [
            "la promesse que le lecteur peut redire en une phrase",
            "la friction que votre audience ressent déjà chaque semaine",
            "la transformation précise qui attire vraiment l'attention",
            "le coût silencieux du flou",
            "la première preuve qui change la perception",
            "la question qui mérite la première page",
            "la formulation qui sépare le signal du bruit",
            "le gain rapide qui crée la confiance d'entrée",
            "la décision que le lecteur reporte depuis trop longtemps",
            "le mythe qui affaiblit l'autorité sans bruit",
            "la vraie ligne de départ de cette méthode",
            "l'urgence derrière le changement central du livre",
        ],
        "system": [
            "un cadre que le lecteur peut appliquer sans vous",
            "une architecture de chapitres qui garde le rythme",
            "une routine répétable qui rend la méthode transmissible",
            "une séquence de décisions qui réduit la confusion",
            "une chaîne logique qui rend l'argument crédible",
            "une structure qui transforme des notes en actif éditorial",
            "un rythme de travail qui évite les brouillons inachevés",
            "un flux pédagogique qui relie idée et action",
            "une couche méthodique qui paraît concrète et non abstraite",
            "un système qui rend les exemples mémorables",
            "un rythme de transmission qui récompense la continuité",
            "une ossature qui donne au livre une tenue professionnelle",
        ],
        "execution": [
            "des exemples qui rendent la méthode tangible",
            "des choix de langage qui haussent la valeur perçue",
            "des exercices qui créent un engagement réel",
            "des notes de cas qui lèvent les objections silencieuses",
            "des prompts qui transforment la réflexion en mouvement",
            "des moments de preuve qui renforcent votre standard",
            "des actifs complémentaires qui prolongent l'utilité du chapitre",
            "des points de contrôle qui stoppent la dérive tôt",
            "des passes d'édition qui gardent le message tendu",
            "des battements narratifs qui rendent la leçon portable",
            "des outils qui gagnent du temps sans perdre en qualité",
            "des actions lecteur qui rendent le progrès visible",
        ],
        "scale": [
            "des ponts vers des offres réelles et mieux valorisées",
            "des habitudes de diffusion qui prolongent la vie de l'actif",
            "des signaux de positionnement qui améliorent la demande reçue",
            "un chemin de suivi qui rend la suite évidente",
            "des marqueurs d'autorité repérés avant la prise de contact",
            "des métriques qui montrent si le message porte",
            "un plan de réemploi pour ateliers, pages et conférences",
            "la boucle de preuve qui fait croître la confiance",
            "une logique de packaging qui protège un prix premium",
            "des jalons lecteur qui révèlent où la demande monte",
            "des relais d'équipe qui gardent le standard éditorial",
            "un système de visibilité qui garde le livre utile commercialement",
        ],
        "closing": [
            "des habitudes de révision qui affinent le livre chaque trimestre",
            "des avantages durables qui dépassent la semaine de lancement",
            "le retour lecteur qui renforce l'édition suivante",
            "l'actif suivant que ce livre devrait déclencher",
            "la promesse finale que le lecteur gardera en tête",
            "les habitudes qui maintiennent la qualité après publication",
            "les petits réglages qui augmentent vite la confiance",
            "le rituel d'entretien qui protège la crédibilité",
            "le test final d'un livre qui convertit vraiment",
            "la manière de garder la clarté dans le bruit du marché",
            "l'avantage durable de la discipline éditoriale",
            "la continuité discrète qui fait encore vendre l'actif",
        ],
        "titleTemplates": [
            "Clarifier {focus}",
            "Concevoir {focus}",
            "Construire {focus}",
            "Activer {focus}",
            "Protéger {focus}",
        ],
        "paragraphs": [
            "Ce chapitre compte parce que {title_lower} est l'endroit où {topic} cesse d'être séduisant en théorie pour devenir crédible dans la pratique. Pour {audience}, l'écart entre une bonne idée et une vraie autorité tient souvent à une couche de structure supplémentaire. {tone_signal} À la fin de cette partie, le lecteur doit sentir plus de direction, moins de bruit et un mouvement plus net.",
            "La plupart des lecteurs savent déjà qu'ils veulent {promise}, mais ils attaquent le travail par le mauvais côté. Ils accumulent des notes, ajoutent des explications et repoussent les décisions éditoriales qui créent la confiance. Ici, le but est d'identifier cette friction tôt, de la nommer clairement et de la remplacer par un geste plus petit mais réellement faisable.",
            "Un chapitre utile ne se contente pas d'inspirer; il met les décisions dans le bon ordre. D'abord, on fixe ce qui ne doit pas bouger. Ensuite, on retire ce qui brouille la promesse. Enfin, on met en place une séquence que l'on pourra répéter demain avec la même clarté. Le livre commence alors à agir comme un système de travail et non comme un empilement de pages intéressantes.",
            "Si le lecteur applique bien cette section, il ne repart pas avec une simple intuition agréable. Il repart avec une phrase, une liste, une décision ou un mini-actif qu'il peut utiliser immédiatement dans le manuscrit, dans une conversation commerciale ou dans la prochaine révision. C'est cette transférabilité qui transforme un bon chapitre en actif de confiance.",
            "La leçon profonde est simple: l'autorité grandit quand la clarté se voit avant l'effort. Si le lecteur obtient une amélioration visible maintenant, le chapitre suivant devient plus léger et l'ensemble du livre gagne en crédibilité. Voilà pourquoi cette partie pousse vers des décisions nettes, des preuves concrètes et un résultat déjà sensible avant la fin.",
        ],
        "toneSignals": {
            "Operator Playbook": "Le ton reste volontairement opérationnel: chaque page doit aider à décider plus juste.",
            "Mentor Guide": "Le ton demeure guidant et calme pour que le lecteur se sente accompagné.",
            "Systems Manual": "Le ton cherche la précision afin que le lecteur fasse confiance à la séquence.",
            "Story-led Manifesto": "Le ton accueille davantage de narration, car la croyance change souvent avant l'action.",
            "Workbook": "Le ton revient sans cesse à la pratique, car une idée inutilisée s'évapore vite.",
            "Calm Executive Brief": "Le ton retire volontairement du bruit afin que le prochain geste apparaisse mieux.",
        },
    },
    "Portuguese": {
        "pageLabel": "pp.",
        "foundation": [
            "a promessa que o leitor consegue repetir em uma frase",
            "a fricção que sua audiência já sente toda semana",
            "a transformação específica que realmente chama atenção",
            "o custo silencioso de continuar vago",
            "a primeira prova que muda a percepção",
            "a pergunta que merece a página inicial",
            "a frase de posicionamento que limpa o ruído",
            "a vitória rápida que gera confiança cedo",
            "a decisão que o leitor adia há tempo demais",
            "o mito que enfraquece a autoridade sem aviso",
            "a verdadeira linha de partida do método",
            "a urgência por trás da mudança central do livro",
        ],
        "system": [
            "uma estrutura que o leitor consegue aplicar sem você",
            "uma arquitetura de capítulos que sustenta o ritmo",
            "uma rotina repetível que torna o método ensinável",
            "uma sequência de decisões que reduz confusão",
            "uma cadeia lógica que deixa o argumento confiável",
            "uma estrutura que transforma notas em ativo vendável",
            "um ritmo de trabalho que evita rascunhos abandonados",
            "um fluxo didático que conecta ideia e ação",
            "uma camada de método que soa prática e não abstrata",
            "um sistema que mantém exemplos concretos e memoráveis",
            "um ritmo de ensino que recompensa a continuidade",
            "uma espinha dorsal que dá acabamento profissional ao livro",
        ],
        "execution": [
            "exemplos que fazem o método parecer vivido",
            "escolhas de linguagem que aumentam o valor percebido",
            "exercícios que criam compromisso e não enfeite",
            "notas de caso que removem objeções silenciosas",
            "prompts que transformam reflexão em movimento",
            "momentos de prova que reforçam seu padrão",
            "ativos de apoio que ampliam a utilidade do capítulo",
            "pontos de checagem que evitam desvio cedo",
            "rodadas de edição que mantêm a mensagem firme",
            "batidas narrativas que tornam a lição mais carregável",
            "ferramentas que economizam tempo sem baixar a qualidade",
            "ações do leitor que tornam o avanço visível",
        ],
        "scale": [
            "pontes para ofertas reais e receita melhor",
            "hábitos de distribuição que prolongam a vida do ativo",
            "sinais de posicionamento que elevam a qualidade da demanda",
            "um caminho de acompanhamento que deixa o próximo passo óbvio",
            "sinais de autoridade percebidos antes do contato",
            "métricas que mostram se a mensagem está funcionando",
            "um plano de reaproveitamento para palestras, páginas e workshops",
            "o ciclo de prova que acumula confiança ao longo do tempo",
            "uma lógica de embalagem que protege preço premium",
            "marcos do leitor que mostram onde a demanda cresce",
            "passagens de equipe que preservam o padrão editorial",
            "um sistema de visibilidade que mantém o livro útil comercialmente",
        ],
        "closing": [
            "hábitos de revisão que deixam o livro mais afiado a cada trimestre",
            "vantagens duradouras que passam da semana de lançamento",
            "o retorno do leitor que fortalece a próxima edição",
            "o próximo ativo que este livro deve destravar",
            "a promessa final que o leitor vai lembrar depois",
            "os hábitos que sustentam a qualidade após publicar",
            "os pequenos ajustes que elevam confiança mais rápido",
            "o ritual de manutenção que protege credibilidade",
            "o teste final de um livro que realmente converte",
            "a forma de manter clareza quando o mercado faz barulho",
            "a vantagem longa da disciplina editorial",
            "a continuidade silenciosa que mantém o ativo vendendo",
        ],
        "titleTemplates": [
            "Clareie {focus}",
            "Desenhe {focus}",
            "Construa {focus}",
            "Ative {focus}",
            "Proteja {focus}",
        ],
        "paragraphs": [
            "Este capítulo importa porque {title_lower} é o ponto em que {topic} deixa de parecer apenas uma boa ideia e começa a funcionar na prática. Para {audience}, a diferença entre conteúdo interessante e autoridade percebida normalmente nasce de uma camada extra de estrutura. {tone_signal} Ao fim desta parte, o leitor deve sentir mais direção, menos ruído e um movimento mais concreto.",
            "A maioria dos leitores já sabe que quer {promise}, mas costuma começar pelo lado errado. Junta mais notas, acrescenta mais explicações e adia decisões editoriais que realmente criam confiança. Aqui o objetivo é revelar essa fricção cedo, nomeá-la com clareza e substituí-la por um passo menor, mais leve e aplicável ainda hoje.",
            "Um capítulo forte não apenas inspira; ele ordena decisões. Primeiro fixa o que não pode se perder. Depois remove o que dilui a promessa. Em seguida monta uma sequência que possa ser repetida amanhã com a mesma clareza. Assim o livro passa a se comportar como um sistema de trabalho, não como um amontoado de páginas boas.",
            "Quando o leitor aplica esta seção de verdade, ele não sai apenas com um insight agradável. Sai com uma frase, uma lista, uma decisão ou um pequeno ativo que pode usar imediatamente no rascunho, numa conversa comercial ou na próxima revisão. Essa transferência prática é o que transforma um bom capítulo em um ativo de confiança.",
            "A lição mais profunda é simples: autoridade cresce quando a clareza aparece antes do esforço. Se o leitor conquista uma melhoria visível agora, o próximo capítulo fica mais leve e o livro inteiro ganha credibilidade. Por isso esta parte insiste em decisões limpas, provas concretas e um resultado que já pode ser sentido antes do fim.",
        ],
        "toneSignals": {
            "Operator Playbook": "O tom é operacional de propósito: cada página deve ajudar o leitor a decidir melhor.",
            "Mentor Guide": "O tom se mantém acolhedor e firme para que o leitor se sinta guiado, não pressionado.",
            "Systems Manual": "O tom busca precisão para que o leitor confie na sequência e não só na ideia.",
            "Story-led Manifesto": "O tom carrega mais narrativa porque a crença costuma mudar antes do comportamento.",
            "Workbook": "O tom volta sempre para a prática, porque insight sem uso perde força rapidamente.",
            "Calm Executive Brief": "O tom reduz ruído de forma deliberada para que o próximo movimento fique evidente.",
        },
    },
    "Italian": {
        "pageLabel": "pp.",
        "foundation": [
            "la promessa che il lettore può ripetere in una frase",
            "la frizione che il tuo pubblico sente già ogni settimana",
            "la trasformazione precisa che attira davvero attenzione",
            "il costo silenzioso del restare vaghi",
            "la prima prova che cambia percezione",
            "la domanda che merita la prima pagina",
            "la frase di posizionamento che ripulisce il rumore",
            "il guadagno rapido che crea fiducia all'inizio",
            "la decisione che il lettore rimanda da troppo tempo",
            "il mito che indebolisce l'autorevolezza senza farsi notare",
            "la vera linea di partenza del metodo",
            "l'urgenza dietro il cambiamento centrale del libro",
        ],
        "system": [
            "una struttura che il lettore può applicare anche senza di te",
            "un'architettura di capitoli che mantiene il ritmo",
            "una routine ripetibile che rende il metodo insegnabile",
            "una sequenza di decisioni che riduce confusione",
            "una catena logica che rende credibile l'argomento",
            "una struttura che trasforma appunti in un asset vendibile",
            "un ritmo di lavoro che evita bozze lasciate a metà",
            "un flusso didattico che unisce idea e azione",
            "uno strato di metodo che suona pratico e non astratto",
            "un sistema che rende gli esempi memorabili",
            "un ritmo di insegnamento che premia la continuità",
            "una spina dorsale che fa sembrare il libro professionale",
        ],
        "execution": [
            "esempi che fanno sembrare vissuto il metodo",
            "scelte di linguaggio che alzano il valore percepito",
            "esercizi che creano impegno e non riempitivo",
            "note di caso che sciolgono obiezioni silenziose",
            "prompt che trasformano riflessione in movimento",
            "momenti di prova che rafforzano il tuo standard",
            "asset di supporto che estendono l'utilità del capitolo",
            "punti di controllo che fermano presto la deriva",
            "giri di editing che tengono il messaggio compatto",
            "battiti narrativi che rendono la lezione più trasportabile",
            "strumenti che fanno risparmiare tempo senza perdere qualità",
            "azioni del lettore che creano progresso visibile",
        ],
        "scale": [
            "ponti verso offerte reali e ricavi migliori",
            "abitudini di distribuzione che allungano la vita dell'asset",
            "segnali di posizionamento che migliorano la domanda in entrata",
            "un percorso di follow-up che rende ovvio il passo successivo",
            "segnali di autorevolezza percepiti prima del contatto",
            "metriche che mostrano se il messaggio sta arrivando",
            "un piano di riuso per speech, pagine e workshop",
            "il ciclo di prova che accumula fiducia nel tempo",
            "una logica di packaging che protegge il prezzo premium",
            "tappe del lettore che mostrano dove cresce la domanda",
            "passaggi di team che preservano lo standard editoriale",
            "un sistema di visibilità che mantiene il libro utile sul piano commerciale",
        ],
        "closing": [
            "abitudini di revisione che affilano il libro ogni trimestre",
            "vantaggi di lungo periodo che superano la settimana di lancio",
            "feedback dei lettori che rafforza l'edizione successiva",
            "l'asset successivo che questo libro dovrebbe attivare",
            "la promessa finale che il lettore ricorderà dopo",
            "le abitudini che mantengono alta la qualità dopo la pubblicazione",
            "i piccoli aggiustamenti che alzano la fiducia più in fretta",
            "il rituale di manutenzione che protegge la credibilità",
            "il test finale di un libro che converte davvero",
            "il modo di mantenere chiarezza quando il mercato fa rumore",
            "il vantaggio duraturo della disciplina editoriale",
            "la continuità silenziosa che fa vendere ancora l'asset",
        ],
        "titleTemplates": [
            "Chiarisci {focus}",
            "Progetta {focus}",
            "Costruisci {focus}",
            "Attiva {focus}",
            "Proteggi {focus}",
        ],
        "paragraphs": [
            "Questo capitolo conta perché {title_lower} è il punto in cui {topic} smette di sembrare solo interessante e diventa credibile nella pratica. Per {audience}, la differenza tra una buona idea e un'autorità percepita nasce spesso da uno strato in più di struttura. {tone_signal} Alla fine di questa parte il lettore dovrebbe sentire più direzione, meno rumore e un avanzamento concreto.",
            "Molti lettori sanno già di volere {promise}, ma attaccano il lavoro dal lato sbagliato. Raccolgono più appunti, aggiungono più spiegazioni e rimandano proprio le decisioni editoriali che generano fiducia. Qui l'obiettivo è far emergere presto quella frizione, darle un nome chiaro e sostituirla con una mossa più piccola ma immediatamente praticabile.",
            "Un capitolo utile non si limita a motivare; ordina decisioni. Prima fissa ciò che non deve muoversi. Poi toglie quello che diluisce la promessa. Infine costruisce una sequenza che possa essere ripetuta domani con la stessa chiarezza. In questo modo il libro inizia a comportarsi come un sistema di lavoro, non come una somma di pagine interessanti.",
            "Se il lettore applica bene questa sezione, non esce soltanto con una riflessione piacevole. Esce con una frase, una lista, una decisione o un piccolo asset da usare subito nella bozza, in una conversazione commerciale o nel prossimo giro di revisione. È questa trasferibilità a trasformare un buon capitolo in un vero asset di fiducia.",
            "La lezione profonda è semplice: l'autorevolezza cresce quando la chiarezza si vede prima dello sforzo. Se il lettore ottiene ora un miglioramento visibile, il capitolo successivo diventa più leggero e l'intero libro acquista credibilità. Per questo questa parte insiste su decisioni pulite, prove concrete e risultati percepibili già prima della fine.",
        ],
        "toneSignals": {
            "Operator Playbook": "Il tono è volutamente operativo: ogni pagina deve aiutare il lettore a decidere meglio.",
            "Mentor Guide": "Il tono resta vicino e stabile perché il lettore si senta guidato, non giudicato.",
            "Systems Manual": "Il tono cerca precisione così che il lettore possa fidarsi della sequenza.",
            "Story-led Manifesto": "Il tono porta un po' più di narrazione, perché spesso cambia prima la convinzione e poi il comportamento.",
            "Workbook": "Il tono ritorna sempre alla pratica, perché l'intuizione non usata perde forza in fretta.",
            "Calm Executive Brief": "Il tono riduce rumore con intenzione, così il prossimo passo risulta più evidente.",
        },
    },
    "Dutch": {
        "pageLabel": "pp.",
        "foundation": [
            "de belofte die een lezer in één zin kan herhalen",
            "de wrijving die je publiek nu al elke week voelt",
            "de scherpe transformatie die echt aandacht trekt",
            "de stille prijs van vaag blijven",
            "het eerste bewijs dat overtuiging verandert",
            "de vraag die op pagina één thuishoort",
            "de positioneringszin die ruis opruimt",
            "de snelle winst die vroeg vertrouwen bouwt",
            "de beslissing die de lezer te lang uitstelt",
            "de mythe die gezag ongemerkt verzwakt",
            "de echte startlijn van deze methode",
            "de urgentie achter de kernverschuiving van het boek",
        ],
        "system": [
            "een kader dat de lezer zonder jou kan toepassen",
            "een hoofdstukarchitectuur die het tempo vasthoudt",
            "een herhaalbaar ritme dat de methode overdraagbaar maakt",
            "een volgorde van beslissingen die verwarring verlaagt",
            "een logische keten die het argument geloofwaardig maakt",
            "een structuur die notities omzet in een verkoopbaar asset",
            "een werkritme dat half afgemaakte concepten voorkomt",
            "een leerlijn die inzicht met actie verbindt",
            "een methodische laag die praktisch voelt in plaats van abstract",
            "een systeem dat voorbeelden concreet en onthoudbaar houdt",
            "een onderwijsritme dat continuïteit beloont",
            "een ruggengraat die het boek professioneel laat voelen",
        ],
        "execution": [
            "voorbeelden die de methode geleefd laten voelen",
            "taalkeuzes die de waargenomen waarde verhogen",
            "oefeningen die inzet creëren in plaats van opvulling",
            "casusnotities die stille bezwaren wegnemen",
            "prompts die reflectie in beweging omzetten",
            "bewijs-momenten die je standaard geloofwaardig maken",
            "ondersteunende assets die het hoofdstuk langer bruikbaar maken",
            "controlepunten die afdrijven vroeg stoppen",
            "redactierondes die de boodschap strak houden",
            "verhalende slagen die de les beter laten landen",
            "hulpmiddelen die tijd besparen zonder kwaliteit te verlagen",
            "lezersacties die zichtbare voortgang geven",
        ],
        "scale": [
            "bruggen naar echte aanbiedingen en betere omzet",
            "distributiegewoonten die de levensduur van het asset verlengen",
            "positioneringssignalen die de kwaliteit van vraag verhogen",
            "een vervolgpad dat de volgende stap vanzelfsprekend maakt",
            "gezagssignalen die kopers al vóór contact opmerken",
            "metingen die tonen of de boodschap landt",
            "een hergebruikplan voor talks, pagina's en workshops",
            "de bewijsloop die vertrouwen in de tijd vergroot",
            "een verpakkingsaanpak die premium prijs bewaakt",
            "lezersmijlpalen die laten zien waar vraag groeit",
            "teamoverdrachten die de redactionele standaard bewaren",
            "een zichtbaarheidssysteem dat het boek commercieel bruikbaar houdt",
        ],
        "closing": [
            "revisiegewoonten die het boek elk kwartaal scherper maken",
            "langetermijnvoordelen die langer meegaan dan launch week",
            "lezersfeedback die de volgende editie versterkt",
            "het volgende asset dat dit boek moet losmaken",
            "de slotbelofte die de lezer later nog onthoudt",
            "de gewoonten die kwaliteit na publicatie hoog houden",
            "de kleine verfijningen die vertrouwen het snelst verhogen",
            "het onderhoudsritueel dat geloofwaardigheid beschermt",
            "de laatste test voor een boek dat echt converteert",
            "de manier om helder te blijven wanneer de markt luid is",
            "het blijvende voordeel van redactionele discipline",
            "de stille opvolging die het asset blijft laten verkopen",
        ],
        "titleTemplates": [
            "{focus} verhelderen",
            "{focus} ontwerpen",
            "{focus} bouwen",
            "{focus} activeren",
            "{focus} beschermen",
        ],
        "paragraphs": [
            "Dit hoofdstuk doet ertoe omdat {title_lower} het punt is waarop {topic} ophoudt alleen aantrekkelijk te klinken en praktisch geloofwaardig wordt. Voor {audience} ontstaat het verschil tussen een aardig idee en zichtbaar gezag meestal door betere ordening. {tone_signal} Aan het einde van deze sectie hoort de lezer meer richting, minder ruis en een duidelijker volgende stap te voelen.",
            "Veel lezers weten al dat ze {promise} willen, maar beginnen aan het werk vanaf de verkeerde kant. Ze verzamelen meer notities, voegen meer uitleg toe en stellen juist de redactionele keuzes uit die vertrouwen opbouwen. Hier is het doel om die wrijving vroeg zichtbaar te maken, scherp te benoemen en te vervangen door een kleinere maar direct bruikbare beweging.",
            "Een sterk hoofdstuk motiveert niet alleen; het zet beslissingen in de juiste volgorde. Eerst wordt vastgelegd wat niet mag verschuiven. Daarna wordt verwijderd wat de belofte verdund. Vervolgens ontstaat een volgorde die morgen met dezelfde helderheid herhaald kan worden. Zo gaat het boek zich gedragen als een werksysteem in plaats van als een stapel interessante pagina's.",
            "Als de lezer deze sectie goed toepast, blijft hij niet hangen in een prettig inzicht. Hij vertrekt met een zin, lijst, beslissing of klein asset dat direct bruikbaar is in het manuscript, in een klantgesprek of in de volgende revisieronde. Die overdraagbaarheid maakt van een goed hoofdstuk een echt vertrouwensasset.",
            "De diepere les is eenvoudig: gezag groeit wanneer helderheid eerder zichtbaar wordt dan inspanning. Als de lezer nu één zichtbare verbetering maakt, voelt het volgende hoofdstuk lichter en wordt het hele boek overtuigender. Daarom duwt dit deel richting schone beslissingen, concreet bewijs en een resultaat dat al merkbaar is voor het einde.",
        ],
        "toneSignals": {
            "Operator Playbook": "De toon is bewust operationeel: elke pagina moet leiden tot een scherpere zakelijke keuze.",
            "Mentor Guide": "De toon blijft rustig en begeleidend zodat de lezer zich geholpen voelt.",
            "Systems Manual": "De toon kiest voor precisie zodat de lezer de volgorde kan vertrouwen.",
            "Story-led Manifesto": "De toon draagt iets meer verhaal, omdat overtuiging vaak eerder verandert dan gedrag.",
            "Workbook": "De toon keert steeds terug naar toepassing, omdat ongebruikte inzichten snel vervagen.",
            "Calm Executive Brief": "De toon haalt bewust ruis weg zodat de volgende zet beter zichtbaar wordt.",
        },
    },
    "Arabic": {
        "pageLabel": "ص.",
        "foundation": [
            "الوعد الذي يستطيع القارئ تكراره في جملة واحدة",
            "الاحتكاك الذي يعيشه جمهورك كل أسبوع",
            "التحول المحدد الذي يجذب الانتباه فعلاً",
            "كلفة البقاء غامضاً",
            "أول دليل يغيّر القناعة",
            "السؤال الذي يستحق الصفحة الأولى",
            "صياغة التموضع التي تنظف الضجيج",
            "المكسب السريع الذي يبني الثقة مبكراً",
            "القرار الذي يؤجله القارئ منذ وقت طويل",
            "الخرافة التي تضعف السلطة بهدوء",
            "خط البداية الحقيقي لهذه المنهجية",
            "الإلحاح الكامن خلف التحول المركزي في الكتاب",
        ],
        "system": [
            "إطاراً يستطيع القارئ تطبيقه من دون وجودك",
            "هندسة فصول تحفظ الإيقاع",
            "روتيناً قابلاً للتكرار يجعل المنهج قابلاً للتعليم",
            "تسلسلاً من القرارات يقلل الالتباس",
            "سلسلة منطقية تجعل الحجة أكثر موثوقية",
            "بنية تحول الملاحظات إلى أصل قابل للبيع",
            "إيقاع عمل يمنع المسودات المتوقفة",
            "تدفقاً تعليمياً يربط الفكرة بالفعل",
            "طبقة منهجية تبدو عملية لا مجردة",
            "نظاماً يحافظ على الأمثلة ملموسة وسهلة التذكر",
            "إيقاعاً تعليمياً يكافئ الاستمرار",
            "عموداً فقرياً يمنح الكتاب إحساساً مهنياً",
        ],
        "execution": [
            "أمثلة تجعل المنهج محسوساً",
            "اختيارات لغوية ترفع القيمة المدركة",
            "تمارين تصنع التزاماً لا حشواً",
            "ملاحظات حالة تزيل الاعتراضات الصامتة",
            "موجهات تحول التأمل إلى حركة",
            "لحظات إثبات تعزز معيارك المهني",
            "أصولاً داعمة تطيل فائدة الفصل",
            "نقاط فحص توقف الانحراف مبكراً",
            "جولات تحرير تبقي الرسالة مشدودة",
            "نبضات سردية تجعل الدرس أسهل حملاً",
            "أدوات توفر الوقت من دون خفض الجودة",
            "أفعالاً للقارئ تصنع تقدماً مرئياً",
        ],
        "scale": [
            "جسوراً تربط الكتاب بعروض حقيقية وإيراد أفضل",
            "عادات توزيع تطيل عمر الأصل",
            "إشارات تموضع ترفع جودة الطلب الوارد",
            "مسار متابعة يجعل الخطوة التالية واضحة",
            "إشارات سلطة يلاحظها المشتري قبل أن يسأل",
            "مقاييس تكشف هل الرسالة تصل فعلاً",
            "خطة إعادة استخدام للمحاضرات والصفحات والورش",
            "حلقة إثبات تراكم الثقة مع الوقت",
            "طريقة تغليف تحمي السعر المرتفع",
            "محطات للقارئ تكشف أين ينمو الطلب",
            "تسليمات فريق تحفظ المعيار التحريري",
            "نظام ظهور يحافظ على القيمة التجارية للكتاب",
        ],
        "closing": [
            "عادات مراجعة تجعل الكتاب أكثر حدة كل ربع سنة",
            "مزايا طويلة الأثر تتجاوز أسبوع الإطلاق",
            "تغذية راجعة من القراء تقوي النسخة التالية",
            "الأصل التالي الذي يجب أن يطلقه هذا الكتاب",
            "الوعد الختامي الذي سيبقى مع القارئ",
            "العادات التي تحافظ على الجودة بعد النشر",
            "التحسينات الصغيرة التي ترفع الثقة بسرعة",
            "طقس الصيانة الذي يحمي المصداقية",
            "الاختبار النهائي لكتاب يحقق التحويل حقاً",
            "طريقة الحفاظ على الوضوح حين يعلو ضجيج السوق",
            "الميزة الدائمة للانضباط التحريري",
            "الاستمرارية الهادئة التي تبقي الأصل يبيع",
        ],
        "titleTemplates": [
            "وضّح {focus}",
            "صمّم {focus}",
            "ابنِ {focus}",
            "فعّل {focus}",
            "احمِ {focus}",
        ],
        "paragraphs": [
            "تكمن أهمية هذا الفصل في أن {title_lower} هي اللحظة التي يتوقف فيها {topic} عن الظهور كفكرة جميلة فقط، ويبدأ في أخذ شكل يمكن الوثوق به عملياً. بالنسبة إلى {audience}، فإن الفارق بين فكرة جيدة وأصل سلطة واضح يظهر غالباً من طبقة إضافية من البنية. {tone_signal} وعند نهاية هذا الجزء يجب أن يشعر القارئ بمزيد من الاتجاه، وضجيج أقل، وخطوة تالية أوضح.",
            "يعرف كثير من القراء أنهم يريدون {promise}، لكنهم يبدأون من الجهة الخطأ. يجمعون ملاحظات أكثر، ويضيفون شروحاً أكثر، ويؤجلون القرارات التحريرية التي تبني الثقة فعلاً. هدف هذا الفصل هو كشف ذلك الاحتكاك مبكراً، وتسميته بوضوح، واستبداله بحركة أصغر لكنها أكثر قابلية للتنفيذ اليوم.",
            "الفصل المفيد لا يكتفي بإلهام القارئ، بل يرتب القرارات. أولاً يثبت ما يجب ألا يضيع. ثم يزيل ما يخفف الوعد. وبعد ذلك يبني تسلسلاً يمكن تكراره غداً بالوضوح نفسه. عندها يبدأ الكتاب في التصرف كنظام عمل لا كمجموعة صفحات مثيرة للاهتمام فقط.",
            "إذا طبق القارئ هذا الجزء جيداً فلن يغادر بمجرد فكرة لطيفة. سيخرج بجملة، أو قائمة، أو قرار، أو أصل صغير يمكن استخدامه فوراً في المسودة، أو في محادثة بيع، أو في جولة المراجعة التالية. وهذه القابلية للنقل هي ما يحوّل الفصل الجيد إلى أصل يبني الثقة فعلاً.",
            "الرسالة الأعمق بسيطة: السلطة تنمو عندما يظهر الوضوح قبل الجهد. فإذا حقق القارئ تحسناً مرئياً الآن، صار الفصل التالي أخف وأصبح الكتاب كله أكثر إقناعاً. ولهذا يدفع هذا الجزء نحو قرارات نظيفة، وأدلة ملموسة، ونتيجة يمكن الشعور بها قبل الوصول إلى النهاية.",
        ],
        "toneSignals": {
            "Operator Playbook": "النبرة عملية عن قصد: كل صفحة يجب أن تساعد القارئ على اتخاذ قرار تجاري أوضح.",
            "Mentor Guide": "النبرة هادئة ومساندة حتى يشعر القارئ بأنه مُرشد لا مُلام.",
            "Systems Manual": "النبرة دقيقة لأن القارئ يحتاج أن يثق بالتسلسل لا بالفكرة وحدها.",
            "Story-led Manifesto": "النبرة تحمل قدراً أكبر من السرد لأن القناعة تتغير غالباً قبل السلوك.",
            "Workbook": "النبرة تعود دائماً إلى التطبيق لأن الفكرة غير المستخدمة تفقد قوتها سريعاً.",
            "Calm Executive Brief": "النبرة تقلل الضجيج عمداً حتى تصبح الخطوة التالية أكثر وضوحاً.",
        },
    },
    "Japanese": {
        "pageLabel": "pp.",
        "foundation": [
            "読者が一文で言い直せる約束",
            "読者がすでに毎週感じている摩擦",
            "本当に注意を引く限定された変化",
            "曖昧なままでいることの静かな代償",
            "見方を変える最初の証拠",
            "一ページ目で答えるべき問い",
            "ノイズを取り除くポジショニングの一文",
            "早い段階で信頼を得る小さな勝ち",
            "読者が長く先送りしてきた判断",
            "権威を弱める思い込み",
            "この方法の本当の出発点",
            "本の中心変化を支える切迫感",
        ],
        "system": [
            "読者があなた抜きでも使える枠組み",
            "勢いを保つ章構成",
            "方法を再現可能にする反復リズム",
            "迷いを減らす意思決定の順番",
            "主張を信頼しやすくする論理の連鎖",
            "メモを売れる資産に変える構造",
            "途中離脱を防ぐ作業リズム",
            "気づきと行動を結ぶ学習フロー",
            "抽象ではなく実務に見える方法層",
            "例を具体的で覚えやすく保つ仕組み",
            "継続を報いる教え方のリズム",
            "本全体をプロらしく感じさせる背骨",
        ],
        "execution": [
            "方法が生きて見える具体例",
            "価値認識を鋭くする言葉選び",
            "やった感ではなく前進を生む演習",
            "静かな反論を消すケースノート",
            "内省を行動に変える問い",
            "基準への信頼を高める証明の瞬間",
            "章の価値を延ばす補助アセット",
            "脱線を早く止める確認ポイント",
            "メッセージを締める編集ラウンド",
            "学びを保持しやすくする物語の打点",
            "品質を落とさず時間を節約する道具",
            "進捗を見える形にする読者アクション",
        ],
        "scale": [
            "本を実際の提案や収益につなぐ橋",
            "資産の寿命を延ばす配布習慣",
            "問い合わせの質を高める位置づけの合図",
            "次の一歩を自然にするフォロー導線",
            "相談前に伝わる権威シグナル",
            "メッセージが届いているかを示す指標",
            "講演・ページ・講座への再利用計画",
            "時間とともに信頼を増やす証拠ループ",
            "高価格を守るパッケージ設計",
            "需要が伸びる地点を示す読者マイルストーン",
            "編集基準を守るチーム引き継ぎ",
            "本を商業的に生かし続ける可視化の仕組み",
        ],
        "closing": [
            "四半期ごとに本を研ぎ澄ます見直し習慣",
            "発売週を超えて残る長期優位",
            "次版を強くする読者の反応",
            "この本が次に生むべき資産",
            "あとで思い出される締めの約束",
            "出版後も品質を保つ行動",
            "信頼を最速で高める小さな修正",
            "信用を守る保守リチュアル",
            "本当に機能する本かを測る最終テスト",
            "市場が騒がしくても明確さを保つ方法",
            "編集規律が残す長い優位",
            "資産を静かに売り続ける継続動作",
        ],
        "titleTemplates": [
            "{focus}を明確にする",
            "{focus}を設計する",
            "{focus}を組み立てる",
            "{focus}を動かす",
            "{focus}を守る",
        ],
        "paragraphs": [
            "この章が重要なのは、{title_lower}が、{topic}を単なる魅力的な発想から、実際に信頼できる仕組みへ変える地点だからです。{audience}にとって、面白い知識と権威ある資産の差は、情報量ではなく配置の精度から生まれます。{tone_signal} 読み終える頃には、次に何を決め、何を削り、何を残すべきかが前よりもはっきり見えているはずです。",
            "多くの読者はすでに{promise}したいと思っています。けれど、仕事への入り口を誤り、ノートを増やし、説明を足し、信頼を生む編集判断を後回しにします。この章の役割は、その見えにくい摩擦を早めに表面化し、言語化し、今日のうちに実行できるより小さな一手へ置き換えることです。",
            "強い章は、読者を励ますだけではありません。意思決定の順序を整えます。まず、失ってはいけない核を固定します。次に、約束を濁らせる要素を取り除きます。そのうえで、明日も同じ精度で繰り返せる流れを作ります。こうして本は、興味深い断片の集まりではなく、動く運用システムとして振る舞い始めます。",
            "この節をうまく使えた読者は、気分の良い理解だけを持ち帰りません。原稿、商談、次の見直しにそのまま移せる一文、リスト、判断、または小さな資産を持ち帰ります。この転用可能性こそが、良い章を信頼を生む章へ変える本質です。",
            "より深い教訓は単純です。努力より先に明確さが見えるとき、信頼は積み上がります。今ここで一つでも目に見える改善が起きれば、次の章は軽くなり、本全体の説得力も上がります。だからこの章は、曖昧な励ましではなく、きれいな判断、具体的な証拠、そして終盤前でも感じられる結果へと読者を押し進めます。",
        ],
        "toneSignals": {
            "Operator Playbook": "この章のトーンは実務寄りです。各ページがより良い意思決定につながるよう設計されています。",
            "Mentor Guide": "この章のトーンは穏やかです。読者が責められるのではなく導かれていると感じられることを重視します。",
            "Systems Manual": "この章のトーンは精密です。発想だけでなく順序そのものを信頼できる形に整えます。",
            "Story-led Manifesto": "この章のトーンには少し物語性があります。行動の前に確信が動くことが多いからです。",
            "Workbook": "この章のトーンは実践重視です。使われない洞察はすぐに熱を失うからです。",
            "Calm Executive Brief": "この章のトーンは静かです。ノイズを減らし、次の一手を見えやすくするためです。",
        },
    },
}


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    cleaned = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", cleaned).strip("-").lower()
    return cleaned or "book"


def safe_ascii(value: str, fallback: str = "") -> str:
    normalized = unicodedata.normalize("NFKD", value)
    cleaned = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or fallback


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def load_manifest() -> list[BookEntry]:
    raw = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries = [BookEntry(**normalize_manifest_item(item)) for item in raw]
    ensure(len(entries) == 30, "Manifest must contain exactly 30 entries.")
    slugs = {entry.slug for entry in entries}
    ensure(len(slugs) == len(entries), "Manifest has duplicate slugs.")
    publishers = {entry.publisher for entry in entries}
    ensure(len(publishers) == len(entries), "Manifest has duplicate publishers.")
    marks = {entry.brandingMark for entry in entries}
    ensure(len(marks) == len(entries), "Manifest has duplicate branding marks.")
    for entry in entries:
        ensure(entry.languageCode in SUPPORTED_LANGUAGES, f"Unsupported language: {entry.languageCode}")
        ensure(10 <= entry.chapterCount <= 60, f"Invalid chapter count for {entry.slug}")
        ensure(entry.exportTarget in {"hero", "preview"}, f"Invalid export target for {entry.slug}")
    return sorted(entries, key=lambda item: item.heroRank)


def derive_cover_template_hint(item: dict[str, Any]) -> str:
    category = str(item.get("category") or "").lower()
    tone = str(item.get("toneArchetype") or "").lower()
    if "story" in tone:
        return "narrative-story"
    if "calm executive" in tone or "executive" in tone:
        return "executive-minimal"
    if "education" in category:
        return "education-workbook"
    if "personal" in category:
        return "personal-growth"
    if "expertise" in category or "uzman" in category:
        return "expertise-authority"
    return "business-playbook"


def derive_title_tone(item: dict[str, Any]) -> str:
    language = str(item.get("languageCode") or "")
    if language == "Japanese":
        return "cjk"
    if language == "Arabic":
        return "rtl"
    tone = str(item.get("toneArchetype") or "").lower()
    if "operator" in tone or "systems" in tone or "executive" in tone:
        return "sharp"
    return "classic"


def derive_cover_hierarchy(item: dict[str, Any]) -> str:
    tone = str(item.get("toneArchetype") or "").lower()
    if "story" in tone:
        return "title-subtitle-emotive"
    if "executive" in tone:
        return "title-author-minimal"
    return "title-first"


def normalize_manifest_item(item: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(item)
    normalized.setdefault("coverTemplateHint", derive_cover_template_hint(normalized))
    normalized.setdefault("titleTone", derive_title_tone(normalized))
    normalized.setdefault("coverHierarchy", derive_cover_hierarchy(normalized))
    return normalized


def phase_for(index: int, total: int) -> str:
    ratio = index / max(total, 1)
    if ratio <= 0.2:
        return "foundation"
    if ratio <= 0.5:
        return "system"
    if ratio <= 0.75:
        return "execution"
    if ratio <= 0.9:
        return "scale"
    return "closing"


def chapter_reference(entry: BookEntry, number: int) -> str:
    if entry.languageCode == "Japanese":
        return f"第{number}章"
    return f"{entry.chapterLabel} {number}"


def chapter_heading(entry: BookEntry, number: int, title: str) -> str:
    return f"{chapter_reference(entry, number)}: {title}"


def page_label(language_code: str) -> str:
    return str(LANGUAGE_PACKS[language_code]["pageLabel"])


def chapter_pages(entry: BookEntry, number: int) -> str:
    width = 6 + ((number + entry.heroRank) % 5)
    start = 1
    for current in range(1, number):
        start += 6 + ((current + entry.heroRank) % 5)
    end = start + width - 1
    return f"{page_label(entry.languageCode)} {start}-{end}"


def chapter_title(entry: BookEntry, number: int) -> str:
    pack = LANGUAGE_PACKS[entry.languageCode]
    phase = phase_for(number, entry.chapterCount)
    focuses = list(pack[phase])
    template = pack["titleTemplates"][(number - 1) % len(pack["titleTemplates"])]
    focus = focuses[(number - 1) % len(focuses)]
    title = template.format(focus=focus)
    return title[0].upper() + title[1:]


def tone_signal(entry: BookEntry) -> str:
    return str(LANGUAGE_PACKS[entry.languageCode]["toneSignals"][entry.toneArchetype])


def focus_for(entry: BookEntry, phase: str, index: int) -> str:
    values = list(LANGUAGE_PACKS[entry.languageCode][phase])
    return values[index % len(values)]


def next_phase(phase: str) -> str:
    order = ["foundation", "system", "execution", "scale", "closing"]
    idx = order.index(phase)
    return order[min(idx + 1, len(order) - 1)]


def chapter_body(entry: BookEntry, number: int, title: str) -> str:
    phase = phase_for(number, entry.chapterCount)
    current_focus = focus_for(entry, phase, number - 1)
    follow_focus = focus_for(entry, next_phase(phase), number + 2)
    structure_set = CHAPTER_BODY_STRUCTURES[entry.languageCode]
    structure = structure_set[(number + entry.heroRank) % len(structure_set)]
    variables = {
        "title": title,
        "title_lower": title[:1].lower() + title[1:] if title else title,
        "topic": entry.topic,
        "audience": entry.audience,
        "promise": entry.promise,
        "tone_signal": tone_signal(entry),
        "primary_focus": current_focus,
        "secondary_focus": follow_focus,
        "reader_output": READER_OUTPUT_REFERENCES[entry.languageCode],
    }
    return "\n\n".join(template.format(**variables).strip() for template in structure)


def introduction_markdown(entry: BookEntry) -> str:
    heading = INTRODUCTION_HEADINGS[entry.languageCode]
    paragraphs = [entry.openingNote.strip(), entry.summary.strip(), entry.readerHook.strip()]
    cleaned = [paragraph for paragraph in paragraphs if paragraph]
    return f"# {heading}\n\n" + "\n\n".join(cleaned) + "\n"


def render_raster_cover(entry: BookEntry, output_path: Path) -> None:
    payload = {
        "slug": entry.slug,
        "category": entry.category,
        "type": entry.type,
        "topic": entry.topic,
        "brandingMark": entry.brandingMark,
        "coverBrief": entry.coverBrief,
        "coverPrompt": entry.coverPrompt,
        "coverGradient": entry.coverGradient,
        "accentColor": entry.accentColor,
        "textAccent": entry.textAccent,
    }
    subprocess.run(
        ["node", str(COVER_RENDER_SCRIPT), str(output_path)],
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        check=True,
        cwd=ROOT,
    )


def gradient_colors(gradient: str) -> tuple[str, str, str]:
    colors = re.findall(r"#[0-9a-fA-F]{6}", gradient)
    if len(colors) >= 3:
        return colors[0], colors[1], colors[2]
    return "#111111", "#444444", "#777777"


def front_cover_svg(entry: BookEntry) -> str:
    c1, c2, c3 = gradient_colors(entry.coverGradient)
    title_lines = textwrap.wrap(entry.title, width=18)[:4]
    subtitle_lines = textwrap.wrap(entry.subtitle, width=30)[:4]
    title_y = 280
    subtitle_y = title_y + 58 * len(title_lines) + 36
    title_svg = "".join(
        f'<text x="72" y="{title_y + index * 58}" font-family="Georgia, Times New Roman, serif" '
        f'font-size="42" font-weight="700" fill="{entry.textAccent}">{html.escape(line)}</text>'
        for index, line in enumerate(title_lines)
    )
    subtitle_svg = "".join(
        f'<text x="72" y="{subtitle_y + index * 28}" font-family="Arial, sans-serif" '
        f'font-size="20" fill="{entry.textAccent}" opacity="0.9">{html.escape(line)}</text>'
        for index, line in enumerate(subtitle_lines)
    )
    return f"""<svg width="1600" height="2560" viewBox="0 0 1600 2560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cover-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="52%" stop-color="{c2}" />
      <stop offset="100%" stop-color="{c3}" />
    </linearGradient>
  </defs>
  <rect width="1600" height="2560" fill="url(#cover-grad)" />
  <circle cx="1320" cy="420" r="250" fill="{entry.accentColor}" opacity="0.12" />
  <circle cx="260" cy="1980" r="320" fill="{entry.textAccent}" opacity="0.08" />
  <path d="M1220 0 L1600 0 L1600 980 Q1390 960 1220 1100 Z" fill="{entry.textAccent}" opacity="0.08" />
  <rect x="72" y="120" width="1456" height="2" fill="{entry.textAccent}" opacity="0.25" />
  <g transform="translate(72 156)">
    <rect width="112" height="112" rx="28" fill="rgba(0,0,0,0)" />
    {entry.brandingLogoSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112" fill="none">', '').replace('</svg>', '')}
  </g>
  <text x="210" y="226" font-family="Arial, sans-serif" font-size="28" letter-spacing="5" fill="{entry.textAccent}" opacity="0.88">{html.escape(entry.publisher.upper())}</text>
  <text x="72" y="196" font-family="Arial, sans-serif" font-size="18" letter-spacing="4" fill="{entry.textAccent}" opacity="0.65">{html.escape(entry.category.upper())}</text>
  {title_svg}
  {subtitle_svg}
  <text x="72" y="2260" font-family="Arial, sans-serif" font-size="28" fill="{entry.textAccent}" opacity="0.88">{html.escape(entry.author)}</text>
  <text x="72" y="2325" font-family="Arial, sans-serif" font-size="20" letter-spacing="4" fill="{entry.textAccent}" opacity="0.6">{html.escape(entry.coverBrief.upper())}</text>
  <rect x="72" y="2388" width="1456" height="2" fill="{entry.textAccent}" opacity="0.25" />
</svg>
"""


def back_cover_svg(entry: BookEntry) -> str:
    c1, c2, c3 = gradient_colors(entry.coverGradient)
    summary_lines = textwrap.wrap(entry.summary, width=42)
    bio_lines = textwrap.wrap(entry.authorBio, width=40)
    tags = " · ".join(entry.tags)
    summary_svg = "".join(
        f'<text x="120" y="{360 + index * 38}" font-family="Arial, sans-serif" font-size="28" fill="{entry.textAccent}" opacity="0.94">{html.escape(line)}</text>'
        for index, line in enumerate(summary_lines[:8])
    )
    bio_svg = "".join(
        f'<text x="120" y="{1760 + index * 34}" font-family="Arial, sans-serif" font-size="24" fill="{entry.textAccent}" opacity="0.86">{html.escape(line)}</text>'
        for index, line in enumerate(bio_lines[:6])
    )
    return f"""<svg width="1600" height="2560" viewBox="0 0 1600 2560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="back-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c3}" />
      <stop offset="45%" stop-color="{c2}" />
      <stop offset="100%" stop-color="{c1}" />
    </linearGradient>
  </defs>
  <rect width="1600" height="2560" fill="url(#back-grad)" />
  <rect x="80" y="120" width="1440" height="2320" rx="44" fill="rgba(0,0,0,0.18)" stroke="{entry.textAccent}" stroke-opacity="0.16" />
  <text x="120" y="220" font-family="Georgia, Times New Roman, serif" font-size="54" fill="{entry.textAccent}">{html.escape(entry.title)}</text>
  {summary_svg}
  <text x="120" y="940" font-family="Arial, sans-serif" font-size="22" letter-spacing="3" fill="{entry.textAccent}" opacity="0.62">{html.escape(tags.upper())}</text>
  <text x="120" y="1620" font-family="Arial, sans-serif" font-size="20" letter-spacing="3" fill="{entry.textAccent}" opacity="0.62">{html.escape(entry.author.upper())}</text>
  {bio_svg}
  <text x="120" y="2200" font-family="Arial, sans-serif" font-size="20" letter-spacing="3" fill="{entry.textAccent}" opacity="0.62">{html.escape(entry.publisher.upper())} · {entry.year}</text>
  <text x="120" y="2280" font-family="Arial, sans-serif" font-size="20" fill="{entry.textAccent}" opacity="0.8">{html.escape(entry.coverBrief)}</text>
</svg>
"""


def outline_markdown(entry: BookEntry, chapters: list[dict[str, str]]) -> str:
    lines = [f"# {entry.title}", f"## {entry.subtitle}", ""]
    for item in chapters:
        lines.append(f"### {chapter_heading(entry, item['num'], item['title'])} ({item['pages']})")
    lines.append("")
    return "\n".join(lines)


def dashboard_meta(entry: BookEntry, timestamp: str) -> dict[str, Any]:
    return {
        "author": entry.author,
        "publisher": entry.publisher,
        "description": entry.summary,
        "author_bio": entry.authorBio,
        "branding_mark": entry.brandingMark,
        "branding_logo_url": "assets/publisher_logo.svg",
        "cover_brief": entry.coverBrief,
        "cover_prompt": entry.coverPrompt,
        "opening_note": entry.openingNote,
        "reader_hook": entry.readerHook,
        "language": entry.languageCode,
        "generate_cover": True,
        "cover_art_image": "",
        "cover_image": "assets/front_cover_final.png",
        "back_cover_image": "assets/back_cover_final.svg",
        "cover_template": entry.coverTemplateHint,
        "cover_variant_count": 0,
        "cover_generation_provider": "showcase-generator",
        "cover_composed": True,
        "isbn": "",
        "year": entry.year,
        "fast": False,
        "preview_stage": "complete",
        "preview_message": "Showcase output hazır.",
        "preview_error": "",
        "preview_progress": 100,
        "cover_state": "ready",
        "first_chapter_state": "ready",
        "preview_started_at": timestamp,
        "preview_updated_at": timestamp,
        "preview_completed_at": timestamp,
    }


def html_export(entry: BookEntry, chapters: list[dict[str, str]]) -> str:
    direction = "rtl" if entry.languageCode in RTL_LANGUAGES else "ltr"
    lang = entry.languageLabel
    toc_items = "\n".join(
        f'<li><a href="#chapter-{item["num"]}">{html.escape(chapter_reference(entry, item["num"]))} · {html.escape(item["title"])}</a> <span>{html.escape(item["pages"])}</span></li>'
        for item in chapters
    )
    chapter_sections = "\n".join(
        f"""
        <section class="chapter" id="chapter-{item['num']}">
          <div class="chapter-kicker">{html.escape(chapter_reference(entry, item['num']))}</div>
          <h2>{html.escape(item['title'])}</h2>
          <div class="chapter-pages">{html.escape(item['pages'])}</div>
          {''.join(f'<p>{html.escape(paragraph)}</p>' for paragraph in item['body'].split('\\n\\n'))}
        </section>
        """
        for item in chapters
    )
    return f"""<!doctype html>
<html lang="{html.escape(lang)}" dir="{direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{html.escape(entry.title)}</title>
    <style>
      :root {{
        --spine: {entry.spineColor};
        --accent: {entry.accentColor};
        --text: {entry.textAccent};
        --surface: #f7f2ea;
        --ink: #201814;
      }}
      * {{ box-sizing: border-box; }}
      body {{ margin: 0; font-family: Georgia, 'Times New Roman', serif; background: var(--surface); color: var(--ink); line-height: 1.65; }}
      .hero {{
        padding: 64px 0 40px;
        background: {entry.coverGradient};
        color: var(--text);
      }}
      .wrap {{ width: min(1080px, calc(100vw - 48px)); margin: 0 auto; }}
      .hero-grid {{ display: grid; gap: 32px; grid-template-columns: 280px 1fr; align-items: start; }}
      .cover {{ width: 280px; border-radius: 24px; box-shadow: 0 24px 48px rgba(0,0,0,0.18); overflow: hidden; }}
      .cover img {{ width: 100%; display: block; }}
      .eyebrow {{ font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.24em; font-size: 12px; opacity: 0.75; }}
      h1 {{ font-size: clamp(2.4rem, 5vw, 4rem); margin: 18px 0 14px; line-height: 1.03; }}
      .subtitle {{ font-family: Arial, sans-serif; font-size: 1.1rem; max-width: 60ch; opacity: 0.92; }}
      .meta {{ margin-top: 24px; display: flex; flex-wrap: wrap; gap: 12px; font-family: Arial, sans-serif; }}
      .pill {{ border: 1px solid rgba(255,255,255,0.22); border-radius: 999px; padding: 8px 12px; backdrop-filter: blur(8px); }}
      main {{ padding: 42px 0 80px; }}
      .intro {{ display: grid; gap: 24px; grid-template-columns: 1.4fr 1fr; align-items: start; }}
      .card {{ background: rgba(255,255,255,0.8); border: 1px solid rgba(32,24,20,0.08); border-radius: 26px; padding: 28px; }}
      .logo-wrap {{ display: flex; align-items: center; gap: 14px; }}
      .logo-wrap img {{ width: 64px; height: 64px; border-radius: 18px; }}
      .toc {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }}
      .toc li {{ display: flex; justify-content: space-between; gap: 24px; padding-bottom: 12px; border-bottom: 1px solid rgba(32,24,20,0.08); font-family: Arial, sans-serif; }}
      .toc a {{ color: inherit; text-decoration: none; font-weight: 600; }}
      .chapter {{ margin-top: 36px; padding-top: 36px; border-top: 1px solid rgba(32,24,20,0.1); }}
      .chapter-kicker {{ font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.2em; font-size: 12px; color: var(--spine); }}
      .chapter h2 {{ font-size: 2rem; margin: 12px 0 6px; }}
      .chapter-pages {{ font-family: Arial, sans-serif; font-size: 0.95rem; color: #6f6156; margin-bottom: 16px; }}
      .chapter p {{ margin: 0 0 16px; font-size: 1.04rem; }}
      @media (max-width: 840px) {{
        .hero-grid, .intro {{ grid-template-columns: 1fr; }}
        .cover {{ width: min(100%, 320px); }}
      }}
    </style>
  </head>
  <body>
    <header class="hero">
      <div class="wrap hero-grid">
        <div class="cover"><img src="../assets/front_cover_final.png" alt="{html.escape(entry.title)}" /></div>
        <div>
          <div class="eyebrow">{html.escape(entry.category)} · {html.escape(entry.languageLabel)}</div>
          <h1>{html.escape(entry.title)}</h1>
          <div class="subtitle">{html.escape(entry.subtitle)}</div>
          <div class="meta">
            <div class="pill">{html.escape(entry.author)}</div>
            <div class="pill">{html.escape(entry.publisher)}</div>
            <div class="pill">{entry.chapterCount} {html.escape(entry.chapterLabel.lower() if entry.languageCode != 'Japanese' else 'chapters')}</div>
            <div class="pill">{html.escape(entry.toneArchetype)}</div>
          </div>
        </div>
      </div>
    </header>
    <main>
      <div class="wrap">
        <section class="intro">
          <article class="card">
            <div class="logo-wrap">
              <img src="../assets/publisher_logo.svg" alt="{html.escape(entry.publisher)}" />
              <div>
                <div class="eyebrow">Author</div>
                <div>{html.escape(entry.author)}</div>
              </div>
            </div>
            <p><strong>{html.escape(entry.openingNote)}</strong></p>
            <p>{html.escape(entry.summary)}</p>
            <p>{html.escape(entry.authorBio)}</p>
            <p>{html.escape(entry.readerHook)}</p>
            <p><strong>{html.escape(entry.coverBrief)}</strong></p>
          </article>
          <aside class="card">
            <div class="eyebrow">Contents</div>
            <ul class="toc">
              {toc_items}
            </ul>
          </aside>
        </section>
        {chapter_sections}
      </div>
    </main>
  </body>
</html>
"""


def epub_text_page(title: str, body_html: str, direction: str) -> str:
    return f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" dir="{direction}">
  <head>
    <title>{html.escape(title)}</title>
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body>
    {body_html}
  </body>
</html>
"""


def epub_export(entry: BookEntry, book_dir: Path, export_dir: Path, chapters: list[dict[str, str]]) -> None:
    epub_path = export_dir / f"{entry.slug}.epub"
    direction = "rtl" if entry.languageCode in RTL_LANGUAGES else "ltr"
    cover_path = book_dir / "assets" / "front_cover_final.png"
    if not cover_path.exists():
        cover_path = book_dir / "assets" / "showcase_front_cover.png"
    with zipfile.ZipFile(epub_path, "w") as archive:
        archive.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        archive.writestr(
            "META-INF/container.xml",
            """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
""",
        )
        archive.writestr(
            "OEBPS/styles.css",
            """
body { font-family: Georgia, 'Times New Roman', serif; margin: 5%; line-height: 1.6; }
h1, h2 { line-height: 1.2; }
.eyebrow { font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; }
.chapter-ref { font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.75rem; color: #725441; }
.page-note { font-family: Arial, sans-serif; color: #6f6156; font-size: 0.85rem; }
.cover img { width: 100%; max-width: 480px; display: block; margin: 0 auto 24px; }
""".strip(),
        )
        archive.writestr("OEBPS/cover.png", cover_path.read_bytes())
        archive.writestr("OEBPS/logo.svg", entry.brandingLogoSvg)
        archive.writestr(
            "OEBPS/nav.xhtml",
            epub_text_page(
                entry.title,
                "<nav epub:type='toc' id='toc'><h1>Contents</h1><ol>"
                + "".join(
                    f"<li><a href='chapter-{item['num']:03d}.xhtml'>{html.escape(chapter_reference(entry, item['num']))} · {html.escape(item['title'])}</a></li>"
                    for item in chapters
                )
                + "</ol></nav>",
                direction,
            ),
        )
        archive.writestr(
            "OEBPS/cover.xhtml",
            epub_text_page(
                entry.title,
                f"""
                <section class="cover">
                  <img src="cover.png" alt="{html.escape(entry.title)}" />
                  <div class="eyebrow">{html.escape(entry.category)}</div>
                  <h1>{html.escape(entry.title)}</h1>
                  <p>{html.escape(entry.subtitle)}</p>
                  <p><strong>{html.escape(entry.author)}</strong> · {html.escape(entry.publisher)}</p>
                </section>
                """,
                direction,
            ),
        )
        manifest_items = [
            "<item id='nav' href='nav.xhtml' media-type='application/xhtml+xml' properties='nav'/>",
            "<item id='cover-page' href='cover.xhtml' media-type='application/xhtml+xml'/>",
            "<item id='cover-image' href='cover.png' media-type='image/png' properties='cover-image'/>",
            "<item id='logo-image' href='logo.svg' media-type='image/svg+xml'/>",
            "<item id='styles' href='styles.css' media-type='text/css'/>",
        ]
        spine_items = ["<itemref idref='cover-page'/>"]
        for item in chapters:
            filename = f"chapter-{item['num']:03d}.xhtml"
            archive.writestr(
                f"OEBPS/{filename}",
                epub_text_page(
                    item["title"],
                    f"""
                    <section>
                      <div class="chapter-ref">{html.escape(chapter_reference(entry, item['num']))}</div>
                      <h2>{html.escape(item['title'])}</h2>
                      <div class="page-note">{html.escape(item['pages'])}</div>
                      {''.join(f'<p>{html.escape(paragraph)}</p>' for paragraph in item['body'].split('\\n\\n'))}
                    </section>
                    """,
                    direction,
                ),
            )
            manifest_items.append(
                f"<item id='chapter-{item['num']:03d}' href='{filename}' media-type='application/xhtml+xml'/>"
            )
            spine_items.append(f"<itemref idref='chapter-{item['num']:03d}'/>")
        archive.writestr(
            "OEBPS/content.opf",
            f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">{html.escape(entry.slug)}</dc:identifier>
    <dc:title>{html.escape(entry.title)}</dc:title>
    <dc:language>{html.escape(entry.languageCode)}</dc:language>
    <dc:creator>{html.escape(entry.author)}</dc:creator>
    <dc:publisher>{html.escape(entry.publisher)}</dc:publisher>
    <dc:description>{html.escape(entry.summary)}</dc:description>
  </metadata>
  <manifest>
    {"".join(manifest_items)}
  </manifest>
  <spine>
    {"".join(spine_items)}
  </spine>
</package>
""",
        )


def pdf_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def paeth_predictor(left: int, up: int, up_left: int) -> int:
    prediction = left + up - up_left
    left_distance = abs(prediction - left)
    up_distance = abs(prediction - up)
    up_left_distance = abs(prediction - up_left)
    if left_distance <= up_distance and left_distance <= up_left_distance:
        return left
    if up_distance <= up_left_distance:
        return up
    return up_left


def read_png_for_pdf(png_path: Path) -> tuple[int, int, bytes, bytes | None]:
    data = png_path.read_bytes()
    signature = b"\x89PNG\r\n\x1a\n"
    if not data.startswith(signature):
        raise ValueError(f"Unsupported cover image for PDF: {png_path}")

    offset = len(signature)
    width = 0
    height = 0
    bit_depth = 8
    color_type = 6
    interlace = 0
    idat_chunks: list[bytes] = []
    while offset < len(data):
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        chunk_type = data[offset + 4 : offset + 8]
        chunk_data = data[offset + 8 : offset + 8 + length]
        offset += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _compression, _filtering, interlace = struct.unpack(">IIBBBBB", chunk_data)
        elif chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    if bit_depth != 8 or interlace != 0 or color_type not in {2, 6}:
        raise ValueError(f"Unsupported PNG profile for PDF: {png_path}")

    raw = zlib.decompress(b"".join(idat_chunks))
    channels = 4 if color_type == 6 else 3
    stride = width * channels
    previous = bytearray(stride)
    rgb = bytearray()
    alpha = bytearray() if color_type == 6 else None
    cursor = 0

    for _row in range(height):
        filter_type = raw[cursor]
        cursor += 1
        current = bytearray(raw[cursor : cursor + stride])
        cursor += stride
        for index, value in enumerate(current):
            left = current[index - channels] if index >= channels else 0
            up = previous[index]
            up_left = previous[index - channels] if index >= channels else 0
            if filter_type == 1:
                current[index] = (value + left) & 0xFF
            elif filter_type == 2:
                current[index] = (value + up) & 0xFF
            elif filter_type == 3:
                current[index] = (value + ((left + up) // 2)) & 0xFF
            elif filter_type == 4:
                current[index] = (value + paeth_predictor(left, up, up_left)) & 0xFF
        previous = current
        if color_type == 6:
            for pixel in range(0, len(current), 4):
                rgb.extend(current[pixel : pixel + 3])
                alpha.append(current[pixel + 3])
        else:
            rgb.extend(current)

    return width, height, bytes(rgb), bytes(alpha) if alpha is not None else None


def simple_pdf(entry: BookEntry, book_dir: Path, export_dir: Path, chapters: list[dict[str, str]]) -> None:
    pdf_path = export_dir / f"{entry.slug}.pdf"
    title = safe_ascii(entry.title, entry.slug.replace("-", " ").title())
    subtitle = safe_ascii(entry.subtitle, entry.promise)
    lines = [
        title,
        subtitle,
        "",
        f"Author: {safe_ascii(entry.author, 'Book Creator')}",
        f"Publisher: {safe_ascii(entry.publisher, 'Book Generator')}",
        f"Language: {entry.languageLabel}",
        f"Category: {safe_ascii(entry.category, entry.category)}",
        "",
        safe_ascii(entry.summary, entry.slug),
        "",
        "Contents:",
    ]
    for item in chapters[:20]:
        lines.append(
            f"{item['num']:02d}. {safe_ascii(item['title'], f'Chapter {item['num']}')} [{item['pages']}]"
        )
    lines.append("")
    lines.append("This showcase PDF is a lightweight proof export. Full reading experience is available in HTML and EPUB.")

    pages: list[list[str]] = []
    chunk_size = 36
    for start in range(0, len(lines), chunk_size):
        pages.append(lines[start : start + chunk_size])

    objects: list[bytes] = []

    def add_object(payload: str | bytes) -> int:
        if isinstance(payload, str):
            payload = payload.encode("latin-1", errors="replace")
        objects.append(payload)
        return len(objects)

    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    pages_id = add_object("<< /Type /Pages /Kids [] /Count 0 >>")
    page_ids: list[int] = []
    content_ids: list[int] = []
    cover_path = book_dir / "assets" / "front_cover_final.png"
    if cover_path.exists():
        cover_width, cover_height, cover_rgb, cover_alpha = read_png_for_pdf(cover_path)
        alpha_object_id = None
        if cover_alpha:
            alpha_compressed = zlib.compress(cover_alpha)
            alpha_object_id = add_object(
                (
                    f"<< /Type /XObject /Subtype /Image /Width {cover_width} /Height {cover_height} "
                    f"/ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length {len(alpha_compressed)} >>\nstream\n"
                ).encode("latin-1")
                + alpha_compressed
                + b"\nendstream"
            )
        cover_compressed = zlib.compress(cover_rgb)
        image_dict = (
            f"<< /Type /XObject /Subtype /Image /Width {cover_width} /Height {cover_height} "
            f"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length {len(cover_compressed)}"
        )
        if alpha_object_id:
            image_dict += f" /SMask {alpha_object_id} 0 R"
        image_dict += " >>\nstream\n"
        image_object_id = add_object(image_dict.encode("latin-1") + cover_compressed + b"\nendstream")

        page_width = 612.0
        page_height = 792.0
        scale = min(page_width / cover_width, page_height / cover_height)
        display_width = cover_width * scale
        display_height = cover_height * scale
        x = (page_width - display_width) / 2
        y = (page_height - display_height) / 2
        cover_stream = f"q {display_width:.2f} 0 0 {display_height:.2f} {x:.2f} {y:.2f} cm /ImCover Do Q".encode(
            "latin-1"
        )
        cover_content_id = add_object(
            f"<< /Length {len(cover_stream)} >>\nstream\n".encode("latin-1") + cover_stream + b"\nendstream"
        )
        cover_page_id = add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /XObject << /ImCover {image_object_id} 0 R >> >> /Contents {cover_content_id} 0 R >>"
        )
        page_ids.append(cover_page_id)
        content_ids.append(cover_content_id)

    for page_lines in pages:
        content_stream = ["BT", "/F1 12 Tf", "72 770 Td", "16 TL"]
        for index, line in enumerate(page_lines):
            escaped = pdf_escape(line)
            if index == 0:
                content_stream.append(f"({escaped}) Tj")
            else:
                content_stream.append(f"T* ({escaped}) Tj")
        content_stream.append("ET")
        stream = "\n".join(content_stream).encode("latin-1", errors="replace")
        content_id = add_object(
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream"
        )
        page_id = add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        )
        page_ids.append(page_id)
        content_ids.append(content_id)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("latin-1")
    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, payload in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(payload)
        pdf.extend(b"\nendobj\n")
    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "latin-1"
        )
    )
    pdf_path.write_bytes(pdf)


def build_chapters(entry: BookEntry) -> list[dict[str, str]]:
    chapters = []
    for number in range(1, entry.chapterCount + 1):
        title = chapter_title(entry, number)
        chapters.append(
            {
                "num": number,
                "title": title,
                "pages": chapter_pages(entry, number),
                "body": chapter_body(entry, number, title),
            }
        )
    return chapters


def write_exports(entry: BookEntry, book_dir: Path, chapters: list[dict[str, str]]) -> None:
    export_dir = book_dir / "exports_showcase"
    export_dir.mkdir(parents=True, exist_ok=True)
    (export_dir / "index.html").write_text(html_export(entry, chapters), encoding="utf-8")
    export_formats = HERO_EXPORT_FORMATS if entry.exportTarget == "hero" else PREVIEW_EXPORT_FORMATS
    if "epub" in export_formats:
        epub_export(entry, book_dir, export_dir, chapters)
    if "pdf" in export_formats:
        simple_pdf(entry, book_dir, export_dir, chapters)


def write_book(entry: BookEntry) -> None:
    timestamp = datetime.now(timezone.utc).isoformat()
    book_dir = BOOK_OUTPUTS_DIR / entry.slug
    if book_dir.exists():
        shutil.rmtree(book_dir)
    (book_dir / "assets").mkdir(parents=True, exist_ok=True)
    chapters = build_chapters(entry)
    outline_path = book_dir / f"book_outline_final_{entry.slug}.md"
    outline_path.write_text(outline_markdown(entry, chapters), encoding="utf-8")
    (book_dir / "introduction_final.md").write_text(introduction_markdown(entry), encoding="utf-8")

    for item in chapters:
        chapter_path = book_dir / f"chapter_{item['num']}_final.md"
        chapter_path.write_text(
            f"# {chapter_heading(entry, item['num'], item['title'])}\n\n{item['body']}\n",
            encoding="utf-8",
        )

    (book_dir / "assets" / "publisher_logo.svg").write_text(entry.brandingLogoSvg, encoding="utf-8")
    render_raster_cover(entry, book_dir / "assets" / "front_cover_final.png")
    front_svg = front_cover_svg(entry)
    back_svg = back_cover_svg(entry)
    (book_dir / "assets" / "front_cover_final.svg").write_text(front_svg, encoding="utf-8")
    (book_dir / "assets" / "back_cover_final.svg").write_text(back_svg, encoding="utf-8")
    shutil.copyfile(book_dir / "assets" / "front_cover_final.png", book_dir / "assets" / "showcase_front_cover.png")
    (book_dir / "assets" / "showcase_front_cover.svg").write_text(front_svg, encoding="utf-8")
    (book_dir / "assets" / "showcase_back_cover.svg").write_text(back_svg, encoding="utf-8")
    (book_dir / "dashboard_meta.json").write_text(
        json.dumps(dashboard_meta(entry, timestamp), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_exports(entry, book_dir, chapters)


def validate_outputs(entries: list[BookEntry]) -> None:
    for entry in entries:
        book_dir = BOOK_OUTPUTS_DIR / entry.slug
        ensure(book_dir.exists(), f"Missing book dir for {entry.slug}")
        outline_files = list(book_dir.glob("book_outline_final_*.md"))
        ensure(len(outline_files) == 1, f"Outline mismatch for {entry.slug}")
        ensure((book_dir / "introduction_final.md").exists(), f"Missing introduction for {entry.slug}")
        chapter_files = sorted(book_dir.glob("chapter_*_final.md"))
        ensure(len(chapter_files) == entry.chapterCount, f"Chapter count mismatch for {entry.slug}")
        meta = json.loads((book_dir / "dashboard_meta.json").read_text(encoding="utf-8"))
        ensure(meta.get("language") == entry.languageCode, f"Language mismatch in metadata for {entry.slug}")
        ensure(meta.get("branding_mark") == entry.brandingMark, f"Branding mismatch for {entry.slug}")
        ensure(meta.get("cover_image") == "assets/front_cover_final.png", f"Primary cover metadata mismatch for {entry.slug}")
        ensure(bool(meta.get("cover_composed")), f"Composed cover flag missing for {entry.slug}")
        ensure(bool(meta.get("cover_template")), f"Cover template missing for {entry.slug}")
        if meta.get("cover_art_image"):
            ensure(int(meta.get("cover_variant_count") or 0) == 3, f"Variant count mismatch for {entry.slug}")
            ensure(len(meta.get("cover_variants") or []) == 3, f"Cover variants missing for {entry.slug}")
            ensure(bool(meta.get("selected_cover_variant")), f"Selected cover variant missing for {entry.slug}")
            ensure(bool(meta.get("recommended_cover_variant")), f"Recommended cover variant missing for {entry.slug}")
        ensure((book_dir / "assets" / "front_cover_final.png").exists(), f"Missing raster front cover for {entry.slug}")
        ensure((book_dir / "assets" / "front_cover_final.svg").exists(), f"Missing front cover SVG for {entry.slug}")
        ensure((book_dir / "assets" / "back_cover_final.png").exists() or (book_dir / "assets" / "back_cover_final.svg").exists(), f"Missing back cover for {entry.slug}")
        ensure((book_dir / "assets" / "publisher_logo.svg").exists(), f"Missing logo for {entry.slug}")
        export_dir = book_dir / "exports_showcase"
        ensure((export_dir / "index.html").exists(), f"Missing HTML export for {entry.slug}")
        if entry.exportTarget == "hero":
            ensure((export_dir / f"{entry.slug}.epub").exists(), f"Missing EPUB export for {entry.slug}")
            ensure((export_dir / f"{entry.slug}.pdf").exists(), f"Missing PDF export for {entry.slug}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate multilingual showcase books.")
    parser.add_argument("--validate-only", action="store_true", help="Only validate existing outputs.")
    parser.add_argument(
        "--ai-covers",
        action="store_true",
        help="Generate real AI front covers after writing showcase outputs.",
    )
    args = parser.parse_args()

    entries = load_manifest()
    if not args.validate_only:
        for entry in entries:
            write_book(entry)
        if args.ai_covers:
            subprocess.run([sys.executable, str(AI_COVER_BATCH_SCRIPT)], check=True)
            for entry in entries:
                write_exports(entry, BOOK_OUTPUTS_DIR / entry.slug, build_chapters(entry))
    validate_outputs(entries)
    print(f"showcase portfolio ready: {len(entries)} books")


if __name__ == "__main__":
    main()
