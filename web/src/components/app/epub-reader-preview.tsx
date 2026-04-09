"use client";

import { useMemo } from "react";

export function EpubReaderPreview({ url }: { url: string }) {
  const srcDoc = useMemo(() => {
    const escapedUrl = JSON.stringify(url);
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { height: 100%; margin: 0; background: #f8fafc; font-family: system-ui, sans-serif; }
      body { display: flex; flex-direction: column; }
      .toolbar {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 10px 14px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); background: rgba(255,255,255,0.96);
      }
      .toolbar button {
        border: 1px solid rgba(15, 23, 42, 0.14); background: white; color: #0f172a;
        border-radius: 999px; padding: 8px 12px; font-size: 12px; cursor: pointer;
      }
      .status { font-size: 12px; color: #475569; }
      #viewer { flex: 1; min-height: 0; }
      .error { padding: 16px; color: #b91c1c; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <div class="status" id="status">Loading EPUB preview...</div>
      <div>
        <button id="prev" type="button">Prev</button>
        <button id="next" type="button">Next</button>
      </div>
    </div>
    <div id="viewer"></div>
    <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
    <script>
      (function () {
        var status = document.getElementById("status");
        var viewer = document.getElementById("viewer");
        var prev = document.getElementById("prev");
        var next = document.getElementById("next");
        var bookUrl = ${escapedUrl};
        if (!window.ePub) {
          status.textContent = "EPUB reader script could not load.";
          return;
        }
        var book = window.ePub(bookUrl);
        var rendition = book.renderTo(viewer, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "auto",
          manager: "default"
        });
        rendition.on("relocated", function (location) {
          var page = location && location.start && location.start.displayed && location.start.displayed.page;
          var total = location && location.start && location.start.displayed && location.start.displayed.total;
          status.textContent = page && total ? ("Page " + page + " / " + total) : "EPUB preview ready.";
        });
        rendition.display().catch(function () {
          status.textContent = "EPUB preview could not be rendered.";
        });
        prev.addEventListener("click", function () { rendition.prev(); });
        next.addEventListener("click", function () { rendition.next(); });
      })();
    </script>
  </body>
</html>`;
  }, [url]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
      <iframe title="EPUB preview" srcDoc={srcDoc} className="h-[780px] w-full" sandbox="allow-scripts allow-same-origin" />
    </div>
  );
}
