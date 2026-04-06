                        Author biyografisi
                      </div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{authorBio}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Mobile fixed bottom bar (non-premium only) ─────────────────────── */}
      {!premium && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/98 px-4 pb-safe pt-3 pb-4 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.08)] xl:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">
                {formatUsd(commerce?.primaryOffer.priceCents || 400)} ile tam kitabı aç
              </p>
              <p className="text-xs text-muted-foreground">
                PDF · EPUB · Tüm chapterler · 30 gün iade
              </p>
            </div>
            <Button
              size="default"
              className="shrink-0 font-bold shadow-md"
              onClick={() => openUpgrade("full_unlock")}
            >
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              $4 ile Yayınla
            </Button>
          </div>
        </div>
      )}

      {/* Bottom padding so content isn't hidden behind fixed bar */}
      {!premium && <div className="h-20 xl:hidden" />}

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        slug={slug}
        commerce={commerce}
        authenticated={authenticated}
        onCheckoutSuccess={() => router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`)}
      />
    </AppFrame>
  );
}

[Output exceeded 50000 byte limit (66848 bytes total). Full output saved to C:\Users\ihsan\AppData\Local\Temp\.tmpP8JyT2\stdout-6. Read it with shell commands like `head`, `tail`, or `sed -n '100,200p'` up to 2000 lines at a time.]