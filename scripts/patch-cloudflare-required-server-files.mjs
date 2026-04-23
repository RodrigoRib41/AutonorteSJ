import fs from "node:fs/promises";
import path from "node:path";

const manifestPaths = [
  path.join(process.cwd(), ".next", "required-server-files.json"),
  path.join(
    process.cwd(),
    ".next",
    "standalone",
    ".next",
    "required-server-files.json",
  ),
];

const requiredExternalPackages = ["@prisma/client", ".prisma/client", "pg-cloudflare"];

async function patchManifest(manifestPath) {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    const currentPackages = Array.isArray(manifest?.config?.serverExternalPackages)
      ? manifest.config.serverExternalPackages
      : [];

    const nextPackages = Array.from(
      new Set([...currentPackages, ...requiredExternalPackages]),
    );

    if (
      currentPackages.length === nextPackages.length &&
      currentPackages.every((pkg, index) => pkg === nextPackages[index])
    ) {
      return;
    }

    manifest.config = {
      ...manifest.config,
      serverExternalPackages: nextPackages,
    };

    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Patched serverExternalPackages in ${path.relative(process.cwd(), manifestPath)}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

await Promise.all(manifestPaths.map(patchManifest));
