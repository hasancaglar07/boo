# Book Generator Web

Bu klasor, Book Generator'in `Next.js` tabanli public site + uygulama katmanidir.

## Runtime Standardi

- Node: `24.x` (repo icinde: `.tools/node-current` -> `node-v24.14.0-linux-x64`)
- Paket yoneticisi: `pnpm` (corepack uzerinden)

`web/package.json` engine tanimi bu runtime'a gore ayarlidir.

## Tek Komutlu Calistirma

Repo kok dizininden:

```bash
./start-web.sh start
```

Bu komut su adimlari otomatik yapar:

1. Dashboard backend'i ayaga kaldirir (`start-dashboard.sh`)
2. Node runtime'i dogrular (`>=24`)
3. `node_modules` eksikse `pnpm install` calistirir
4. Build yoksa `pnpm build` alir
5. Next uygulamasini `start` modunda acar

## Build Modu

`BOOK_WEB_BUILD_MODE` ile build davranisi kontrol edilir:

- `auto` (varsayilan): `.next/BUILD_ID` yoksa build alir
- `always`: her baslatmada build alir
- `never`: hic build almaz

Ornek:

```bash
BOOK_WEB_BUILD_MODE=always ./start-web.sh start
```

## Diger Komutlar

```bash
./start-web.sh build   # sadece build
./start-web.sh stop    # web surecini durdur
```

## Gelistirme

Canli gelistirme icin (`next dev`) komutlari:

```bash
cd web
PATH="../.tools/node-current/bin:$PATH" corepack pnpm dev
```
