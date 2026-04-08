#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Translate remaining Turkish blog content in marketing-data.ts to English."""

import re
import sys
import os

FILE = os.path.join('web', 'src', 'lib', 'marketing-data.ts')

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

tr = re.compile(r'[\u0131\u011f\u00fc\u015f\u00f6\u00e7\u0130\u011e\u00dc\u015e\u00d6\u00c7]')

# === BLOG 1: what-to-check-before-uploading-to-kdp (lines 444-449) ===
replacements = {
    # Line 444
    'KDP\u2019de ba\u015fl\u0131k, alt ba\u015fl\u0131k ve kitap a\u00e7\u0131klamas\u0131 en kritik aland\u0131r \u00e7\u00fcnk\u00fc Amazon algoritmas\u0131 bu alanlardaki kelimelere bakarak kitab\u0131 s\u0131n\u0131fland\u0131r\u0131yor ve potansiyel okurlar\u0131na g\u00f6steriyor.': 
    'On KDP, the title, subtitle, and book description are the most critical fields because Amazon\'s algorithm uses the words in these areas to classify your book and show it to potential readers.',
    
    'Ba\u015fl\u0131k kitab\u0131n ne hakk\u0131nda oldu\u011funu tek c\u00fcmlede anlatmal\u0131 \u2014 belirsiz ya da sadece yarat\u0131c\u0131 ba\u015fl\u0131klar arama trafi\u011fini \u00f6ld\u00fcr\u00fc.':
    'The title should explain what the book is about in a single sentence \u2014 vague or purely creative titles kill search traffic.',
    
    '\u00d6rne\u011fin \u2018Dijital \u00d6zg\u00fcrl\u00fck\u2019 yerine \u2018Freelance Hayata Ge\u00e7i\u015f: 90 G\u00fcnde Kurumsal \u0130\u015ften Ba\u011f\u0131ms\u0131z Kariyere\u2019 \u00e7ok daha g\u00fc\u00e7l\u00fc bir ba\u015fl\u0131kt\u0131r.':
    'For example, \'Digital Freedom\' is weak, but \'Transition to Freelance Life: From Corporate Job to Independent Career in 90 Days\' is a much stronger title.',
    
    'Alt ba\u015fl\u0131k varsa hedef kitleyi veya vaadi netle\u015ftirmeli; okura \u2018bu kitap senin i\u00e7in mi?\u2019 sorusunu yan\u0131tlatmal\u0131.':
    'If you have a subtitle, it should clarify the target audience or promise; it should make the reader answer \'is this book for me?\'',
    
    'A\u00e7\u0131klaman\u0131n ilk iki c\u00fcmlesi en kritik alan: bir\u00e7ok platformda a\u00e7\u0131klaman\u0131n tamam\u0131 g\u00f6r\u00fcnmez, yaln\u0131zca ilk k\u0131rk-elli kelime ekranda yer al\u0131r.':
    'The first two sentences of the description are the most critical: on many platforms the full description isn\'t visible, only the first forty-fifty words appear on screen.',
    
    '\u2018Bu kitapta X \u00f6\u011freneceksin\u2019 ile ba\u015flamak yerine okurda bir tan\u0131ma an\u0131 yaratan bir c\u00fcmle dene: \u2018Her sabah i\u015fe gitmeye zorlan\u0131yorsan, bu kitap tam senin i\u00e7in.\u2019':
    'Instead of starting with \'In this book you will learn X,\' try a sentence that creates a moment of recognition: \'If you dread going to work every morning, this book is exactly for you.\'',
    
    'Kulland\u0131\u011f\u0131n anahtar kelimelerin ba\u015fl\u0131k ve a\u00e7\u0131klamada do\u011fal bi\u00e7imde ge\u00e7mesi hem arama s\u0131ralamas\u0131na hem de okur g\u00fcvenine katk\u0131 sa\u011flar.':
    'Having your keywords appear naturally in the title and description contributes to both search ranking and reader trust.',
}

# This approach is getting complex. Let me use a simpler line-by-line approach.
# Read lines, identify Turkish lines by line number, replace entire line content.

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

turkish_lines = []
for i, line in enumerate(lines):
    if tr.search(line):
        turkish_lines.append(i)
        
print(f"Turkish lines found: {len(turkish_lines)}")
for idx in turkish_lines:
    print(f"  L{idx+1}: {lines[idx][:80]}...")
