export default function AppLoading() {
  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-xl rounded-[28px] border border-border/80 bg-card/80 p-8 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Uretim merkezi aciliyor</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Kitaplarin ve calisma alanin yukleniyor.
        </p>
      </div>
    </main>
  );
}
