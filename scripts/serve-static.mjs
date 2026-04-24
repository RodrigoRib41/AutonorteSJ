import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "out");
const host = process.env.HOST?.trim() || "127.0.0.1";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".txt", "text/plain; charset=utf-8"],
]);

function sanitizePathname(pathname) {
  const decodedPathname = decodeURIComponent(pathname);
  const normalizedPath = path.posix.normalize(decodedPathname);

  if (normalizedPath.includes("..")) {
    return null;
  }

  return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
}

async function tryReadFile(filePath) {
  try {
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      return null;
    }

    return {
      filePath,
      stats,
      contents: await fs.readFile(filePath),
    };
  } catch {
    return null;
  }
}

async function resolveRequest(pathname) {
  const safePathname = sanitizePathname(pathname);

  if (!safePathname) {
    return null;
  }

  const relativePath = safePathname.replace(/^\/+/, "");
  const candidates = [];

  if (!relativePath) {
    candidates.push(path.join(outputDir, "index.html"));
  } else {
    candidates.push(path.join(outputDir, relativePath));
    candidates.push(path.join(outputDir, `${relativePath}.html`));
    candidates.push(path.join(outputDir, relativePath, "index.html"));
  }

  for (const candidate of candidates) {
    const resolvedCandidate = path.resolve(candidate);

    if (!resolvedCandidate.startsWith(outputDir)) {
      continue;
    }

    const match = await tryReadFile(resolvedCandidate);

    if (match) {
      return match;
    }
  }

  return null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
  const resolvedFile = await resolveRequest(requestUrl.pathname);
  const notFoundFile = await tryReadFile(path.join(outputDir, "404.html"));
  const result = resolvedFile ?? notFoundFile;

  if (!result) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Static export not found. Run `npm run build` first.");
    return;
  }

  const extension = path.extname(result.filePath).toLowerCase();
  const contentType =
    contentTypes.get(extension) || "application/octet-stream";

  response.writeHead(resolvedFile ? 200 : 404, {
    "Content-Length": result.stats.size,
    "Content-Type": contentType,
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(result.contents);
});

server.listen(port, host, () => {
  console.log(`Static preview available at http://${host}:${port}`);
});
