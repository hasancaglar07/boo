import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function syncDirectory(source, destination) {
  await rm(destination, { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

async function main() {
  const root = process.cwd();
  const standaloneRoot = path.join(root, ".next", "standalone");
  const staticSource = path.join(root, ".next", "static");
  const publicSource = path.join(root, "public");

  if (!(await exists(standaloneRoot))) {
    console.log("[postbuild] Skipping standalone asset sync; .next/standalone not found.");
    return;
  }

  if (await exists(staticSource)) {
    await syncDirectory(staticSource, path.join(standaloneRoot, ".next", "static"));
    console.log("[postbuild] Synced .next/static into standalone output.");
  }

  if (await exists(publicSource)) {
    await syncDirectory(publicSource, path.join(standaloneRoot, "public"));
    console.log("[postbuild] Synced public/ into standalone output.");
  }
}

main().catch((error) => {
  console.error("[postbuild] Failed to prepare standalone assets.", error);
  process.exitCode = 1;
});
