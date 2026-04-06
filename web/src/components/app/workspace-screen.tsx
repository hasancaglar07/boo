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
                        İndir
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
                  <div className="mt-3 text-sm font-medium text-muted-foreground">Henüz output yok</div>
                  <p className="mt-1 text-xs text-muted-foreground">Yukarıdaki EPUB veya PDF butonuna tıklayarak ilk dosyanı generate</p>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ReferralShareDialog open={showReferralDialog} onOpenChange={setShowReferralDialog} />
    </AppFrame>
  );
}

[Output exceeded 50000 byte limit (57426 bytes total). Full output saved to C:\Users\ihsan\AppData\Local\Temp\.tmpP8JyT2\stdout-5. Read it with shell commands like `head`, `tail`, or `sed -n '100,200p'` up to 2000 lines at a time.]