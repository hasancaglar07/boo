import Script from "next/script";

const ASSET_LOAD_RECOVERY_JS = `
(function () {
  var GUARD_KEY = "book-generator:asset-reload-at";
  var GUARD_WINDOW_MS = 30000;

  function now() {
    return Date.now();
  }

  function canReload() {
    try {
      var raw = window.sessionStorage.getItem(GUARD_KEY);
      if (!raw) return true;
      var last = Number(raw);
      if (Number.isNaN(last)) return true;
      return now() - last > GUARD_WINDOW_MS;
    } catch (_error) {
      return true;
    }
  }

  function markReload() {
    try {
      window.sessionStorage.setItem(GUARD_KEY, String(now()));
    } catch (_error) {
      // ignore
    }
  }

  function staticAssetUrl(value) {
    return typeof value === "string" && value.indexOf("/_next/static/") !== -1;
  }

  function shouldRecoverFromMessage(message) {
    if (typeof message !== "string" || !message) return false;
    return (
      message.indexOf("ChunkLoadError") !== -1 ||
      message.indexOf("Failed to load chunk") !== -1 ||
      message.indexOf("Failed to fetch dynamically imported module") !== -1 ||
      message.indexOf("Refused to apply style") !== -1 ||
      message.indexOf("MIME type") !== -1 ||
      message.indexOf("/_next/static/") !== -1
    );
  }

  function reloadForFreshAssets() {
    if (!canReload()) return;
    markReload();

    var url = new URL(window.location.href);
    url.searchParams.set("__asset_retry", String(now()));
    window.location.replace(url.toString());
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (target && target.tagName === "SCRIPT" && staticAssetUrl(target.src || "")) {
        reloadForFreshAssets();
        return;
      }
      if (
        target &&
        target.tagName === "LINK" &&
        target.rel === "stylesheet" &&
        staticAssetUrl(target.href || "")
      ) {
        reloadForFreshAssets();
        return;
      }

      if (shouldRecoverFromMessage(event && event.message ? String(event.message) : "")) {
        reloadForFreshAssets();
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message = "";
    if (typeof reason === "string") {
      message = reason;
    } else if (reason && typeof reason.message === "string") {
      message = reason.message;
    }
    if (shouldRecoverFromMessage(message)) {
      reloadForFreshAssets();
    }
  });
})();
`;

export function AssetLoadRecoveryScript() {
  return (
    <Script
      id="asset-load-recovery"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: ASSET_LOAD_RECOVERY_JS }}
    />
  );
}
