#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./book-generator-env.sh
source "$ROOT_DIR/book-generator-env.sh"

TARGET_DIR="${1:-$ROOT_DIR/book_outputs/ornek-kitap}"
mkdir -p "$TARGET_DIR"

cat > "$TARGET_DIR/book_outline_final_ornek.md" <<'EOF'
# Yapay Zeka ile Uretkenlik
## Gunluk isleri hizlandirmak icin kisa rehber

### Bölüm 1: Nereden baslamali?
### Bölüm 2: Gunluk akislar
### Bölüm 3: Daha temiz sonuc almak
EOF

cat > "$TARGET_DIR/chapter_1_final.md" <<'EOF'
# Bölüm 1: Nereden baslamali?

Yapay zeka araclari, tekrar eden isleri hizlandirmak icin guclu bir destek sunar.
Iyi sonuc almanin ilk adimi, neyi otomatiklestirmek istedigini net yazmaktir.

Baslangic icin uc basit alan sec:

- e-posta taslaklari
- icerik planlama
- not duzenleme

Kucuk bir problemle baslamak, araclari daha hizli ogrenmeni saglar.
EOF

cat > "$TARGET_DIR/chapter_2_final.md" <<'EOF'
# Bölüm 2: Gunluk akislar

Her gun ayni tipte isler yapiyorsan, bunlari sabit bir akisa baglamak gerekir.
Ornegin once notlari topla, sonra ozet cikar, sonra son metni duzenle.

Duzenli bir akisin avantajlari sunlardir:

- daha az zaman kaybi
- daha net beklenti
- tekrar edilebilir sonuc

Bu mantik, tek kisilik islerde bile ciddi rahatlik saglar.
EOF

cat > "$TARGET_DIR/chapter_3_final.md" <<'EOF'
# Bölüm 3: Daha temiz sonuc almak

Iyi prompt yazmak, sonuc kalitesini dogrudan etkiler.
Kisa ama net bir komut genelde uzun ve daginik bir komuttan daha verimlidir.

Asagidaki yapi kullanisli olur:

1. hedefi yaz
2. tonu belirt
3. cikti formatini soyle
4. kisit ekle

Boylece ortaya cikan metin daha duzenli, daha kullanilabilir ve daha hizli duzeltilebilir hale gelir.
EOF

echo "Sample book ready at: $TARGET_DIR"
