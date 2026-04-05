const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/app/workspace-screen.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// ============================================================
// PUBLISH TAB REDESIGN (lines 1016-1116)
// Replace the entire TabsContent for publish
// ============================================================

// Find exact line numbers
let publishStart = -1;
let publishEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('TabsContent value="publish"')) {
    publishStart = i;
  }
  if (publishStart > 0 && publishEnd === -1 && lines[i].includes('ReferralBanner') && lines[i+1] && lines[i+1].includes('</TabsContent>')) {
    publishEnd = i + 1; // include the closing TabsContent
    break;
  }
}

// Fallback - find TabsContent value="settings" to know where publish ends
if (publishEnd === -1) {
  for (let i = publishStart + 1; i < lines.length; i++) {
    if (lines[i].includes('TabsContent value="settings"')) {
      publishEnd = i - 1;
      break;
    }
  }
}

console.log(`Publish tab: lines ${publishStart+1} - ${publishEnd+1}`);
console.log(`First line: ${lines[publishStart]}`);
console.log(`Last line: ${lines[publishEnd]}`);

const newPublishTab = `        <TabsContent value="publish" className="mt-6 space-y-8">
          {/* ── Publish Hero ── */}
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="size-4 text-primary" />
                  </span>
                  <h3 className="text-xl font-bold text-foreground">Yay\u0131n ve D\u0131\u015fa Aktar</h3>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Kitab\u0131n\u0131 profesyonel formatta d\u0131\u015fa aktar. \u00d6nce EPUB ile i\u00e7eri\u011fi kontrol et, ard\u0131ndan PDF ile bask\u0131ya haz\u0131r dosya al.
                </p>
              </div>
            </div>
          </div>

          {/* ── Cover Variants ── */}
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="text-sm font-medium text-foreground">Kapak varyantlar\u0131</div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {coverPickerSummary(currentDraft)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      triggerWorkflow({ action: "cover_variants_generate", variant_count: 1 }).catch((error) =>
                        addToast(error instanceof Error ? error.message : "Kapak varyantlar\u0131 \u00fcretilemedi.", "error"),
                      )
                    }
                  >
                    <Layers className="mr-2 size-4" />
                    Tek Konsept \u00dcret
                  </Button>
                  <Button
                    onClick={() =>
                      triggerWorkflow({ action: "cover_variants_generate", force: true, variant_count: 3 }).catch((error) =>
                        addToast(error instanceof Error ? error.message : "Kapak varyantlar\u0131 yeniden \u00fcretilemedi.", "error"),
                      )
                    }
                  >
                    <Sparkles className="mr-2 size-4" />
                    AI ile Yeniden \u00dcret
                  </Button>
                </div>
              </div>

              {coverVariants.length ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  {coverVariants.map((variant) => (
                    <CoverVariantCard
                      key={variant.id}
                      slug={slug}
                      variant={variant}
                      selected={variant.id === selectedCoverVariantId}
                      selecting={selectingCoverVariantId === variant.id}
                      onSelect={() => void handleSelectCoverVariant(variant)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6">
                  <div className="text-sm font-semibold text-foreground">Hen\u00fcz cover picker haz\u0131r de\u011fil.</div>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    \u00d6nce tek konsepti \u00fcret. Sistem \u00f6n kapak + arka kapa\u011f\u0131 metadata i\u00e7ine yazar; be\u011fenmezsen AI ile
                    yeniden \u00fcret ile alternatif set alabilirsin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Export Actions ── */}
          <Card className="border-primary/15">
            <CardContent className="space-y-5 p-6">
              <div className="text-sm font-medium text-foreground">Dosya Olu\u015ftur</div>
              <p className="text-sm leading-7 text-muted-foreground">
                Kitab\u0131n\u0131 se\u00e7ti\u011fin formatta d\u0131\u015fa aktar. Dosya otomatik olarak indirilir.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* EPUB Button */}
                <button
                  type="button"
                  className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-background p-5 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => triggerBuild("epub").catch((error) => addToast(error instanceof Error ? error.message : "EPUB ba\u015far\u0131s\u0131z.", "error"))}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                    <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-foreground">EPUB Olu\u015ftur</div>
                    <div className="mt-1 text-xs text-muted-foreground">E-kitap format\u0131 \u2022 T\u00fcm okuyucularla uyumlu \u2022 \u0130\u00e7erik kontrol\u00fc i\u00e7in ideal</div>
                  </div>
                </button>

                {/* PDF Button */}
                <button
                  type="button"
                  className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-background p-5 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => triggerBuild("pdf").catch((error) => addToast(error instanceof Error ? error.message : "PDF ba\u015far\u0131s\u0131z.", "error"))}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                    <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-foreground">PDF Olu\u015ftur</div>
                    <div className="mt-1 text-xs text-muted-foreground">Bask\u0131ya haz\u0131r \u2022 KDP uyumlu \u2022 Profesyonel format</div>
                  </div>
                </button>
              </div>

              {/* Preflight - secondary action */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const toastId = addToast("\u00d6n kontrol yap\u0131l\u0131yor...", "loading");
                    try {
                      const response = await preflightBook(slug, { action: "build", format: "epub" });
                      updateToast(toastId, response.ok ? "EPUB i\u00e7in haz\u0131r." : String(response.reason || "Haz\u0131r de\u011fil."), response.ok ? "success" : "error");
                    } catch (error) {
                      updateToast(toastId, error instanceof Error ? error.message : "\u00d6n kontrol ba\u015far\u0131s\u0131z.", "error");
                    }
                  }}
                >
                  <FlaskConical className="mr-2 size-3.5" />
                  Dosya \u00d6n Kontrol\u00fc
                </Button>
                <span className="text-xs text-muted-foreground">
                  Export almadan \u00f6nce kitab\u0131n haz\u0131r oldu\u011funu do\u011frula
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ── Export History ── */}
          <div>
            <div className="mb-3 text-sm font-medium text-foreground">\u00d6nceki \u00c7\u0131kt\u0131lar</div>
            <div className="grid gap-3">
              {(book.resources?.exports || []).slice(-12).reverse().map((file) => {
                const name = String(file.name || "").toLowerCase();
                const isPdf = name.endsWith(".pdf");
                const isEpub = name.endsWith(".epub");
                return (
                  <div
                    key={file.relative_path}
                    className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition hover:border-border hover:shadow-sm"
                  >
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      isPdf && "bg-blue-500/10",
                      isEpub && "bg-emerald-500/10",
                      !isPdf && !isEpub && "bg-muted",
                    )}>
                      {isPdf ? (
                        <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                      ) : isEpub ? (
                        <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FileText className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{file.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{file.relative_path}</div>
                    </div>
                    <a href={buildAssetUrl(file.url)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="opacity-60 group-hover:opacity-100 transition-opacity">
                        <Download className="mr-1.5 size-3.5" />
                        \u0130ndir
                      </Button>
                    </a>
                  </div>
                );
              })}
              {!book.resources?.exports?.length ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-8 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                  <div className="mt-3 text-sm font-medium text-muted-foreground">Hen\u00fcz \u00e7\u0131kt\u0131 yok</div>
                  <p className="mt-1 text-xs text-muted-foreground">Yukar\u0131daki EPUB veya PDF butonuna t\u0131klayarak ilk dosyan\u0131 olu\u015ftur</p>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>`;

// Replace the publish tab
const before = lines.slice(0, publishStart);
const after = lines.slice(publishEnd + 1);

const newLines = [...before, ...newPublishTab.split('\n'), ...after];

console.log(`\nOriginal: ${lines.length} lines`);
console.log(`New: ${newLines.length} lines`);

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log(`\nDone! Publish tab redesigned.`);

// Also add Download to imports if not already there
let importCheck = fs.readFileSync(filePath, 'utf8');
if (!importCheck.includes('Download')) {
  importCheck = importCheck.replace(
    'BarChart3, BookOpen, Check, FileText,',
    'BarChart3, BookOpen, Check, Download, FileText,'
  );
  fs.writeFileSync(filePath, importCheck, 'utf8');
  console.log('Added Download to imports');
} else {
  console.log('Download already in imports');
}
