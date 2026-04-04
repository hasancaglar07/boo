import crypto from "node:crypto";

const baseUrl = process.env.CHECK_BASE_URL || "http://localhost:3000";
const rawPaths =
  process.env.CHECK_PATHS || "/,/login,/signup,/pricing,/start/topic,/billing?plan=creator&autostart=1";
const paths = rawPaths
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const iterations = Number(process.env.CHECK_ITERATIONS || 10);
const timeoutMs = Number(process.env.CHECK_TIMEOUT_MS || 15_000);

const assetPattern = /(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g;

function expectedContentType(assetPath) {
  if (assetPath.endsWith(".css")) return "text/css";
  if (assetPath.endsWith(".js")) return "javascript";
  if (assetPath.endsWith(".woff2")) return "woff2";
  return "";
}

function hashAssets(assets) {
  const hash = crypto.createHash("sha1");
  hash.update(assets.join("\n"));
  return hash.digest("hex").slice(0, 12);
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

function parseAssets(html) {
  const found = new Set();
  let match = assetPattern.exec(html);
  while (match) {
    found.add(match[1]);
    match = assetPattern.exec(html);
  }
  assetPattern.lastIndex = 0;
  return Array.from(found).sort();
}

async function verifyAsset(assetPath) {
  const response = await fetchWithTimeout(`${baseUrl}${assetPath}`, { method: "HEAD" });
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const expected = expectedContentType(assetPath);
  const validType = !expected || contentType.includes(expected);
  return {
    ok: response.ok && validType,
    status: response.status,
    contentType,
  };
}

async function main() {
  const pageVariants = new Map();
  const assetErrors = [];

  for (const path of paths) {
    const signatures = new Map();
    const allAssets = new Set();

    for (let index = 0; index < iterations; index += 1) {
      const url = new URL(path, baseUrl);
      url.searchParams.set("__asset_check", `${Date.now()}-${index}`);
      const response = await fetchWithTimeout(url.toString());
      const html = await response.text();
      const assets = parseAssets(html);
      const signature = hashAssets(assets);
      signatures.set(signature, (signatures.get(signature) || 0) + 1);
      for (const asset of assets) {
        allAssets.add(asset);
      }
    }

    pageVariants.set(path, signatures);

    for (const assetPath of allAssets) {
      const result = await verifyAsset(assetPath);
      if (!result.ok) {
        assetErrors.push({
          page: path,
          asset: assetPath,
          status: result.status,
          contentType: result.contentType || "(missing)",
        });
      }
    }
  }

  let failed = false;

  for (const [path, signatures] of pageVariants.entries()) {
    if (signatures.size > 1) {
      failed = true;
      const signatureText = Array.from(signatures.entries())
        .map(([signature, count]) => `${signature}:${count}`)
        .join(", ");
      console.error(`[asset-check] Inconsistent HTML asset variants for "${path}": ${signatureText}`);
    } else {
      const [[signature, count]] = signatures.entries();
      console.log(`[asset-check] Stable assets for "${path}": ${signature} (${count}/${iterations})`);
    }
  }

  if (assetErrors.length) {
    failed = true;
    for (const issue of assetErrors.slice(0, 50)) {
      console.error(
        `[asset-check] Broken asset (${issue.page}) ${issue.asset} -> ${issue.status} ${issue.contentType}`,
      );
    }
    if (assetErrors.length > 50) {
      console.error(`[asset-check] ...and ${assetErrors.length - 50} more broken assets.`);
    }
  } else {
    console.log("[asset-check] No broken asset URLs found.");
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log("[asset-check] PASS");
}

main().catch((error) => {
  console.error("[asset-check] Failed to run check:", error);
  process.exitCode = 1;
});

