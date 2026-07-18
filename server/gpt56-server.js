import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractWithGPT56, GPT56_MODEL } from "../examples/gpt-5.6-server.example.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8000);
const MAX_BODY_BYTES = 250_000;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    ...extra
  };
}

function json(res, status, payload) {
  res.writeHead(status, securityHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }));
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

function resolveStaticPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = resolve(ROOT, relative);
  if (file !== ROOT && !file.startsWith(`${ROOT}${sep}`)) return null;
  return file;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      return json(res, 200, {
        gpt56: Boolean(process.env.OPENAI_API_KEY),
        model: GPT56_MODEL,
        privacy: "no document retention by ClairSortie"
      });
    }

    if (req.method === "POST" && req.url === "/api/extract") {
      if (!process.env.OPENAI_API_KEY) return json(res, 503, { error: "GPT-5.6 server mode is not configured." });
      const body = await readJson(req);
      const plan = await extractWithGPT56(body?.document);
      return json(res, 200, plan);
    }

    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed." });

    const file = resolveStaticPath(req.url || "/");
    if (!file) return json(res, 400, { error: "Invalid path." });

    const fileStat = await stat(file).catch(() => null);
    if (!fileStat?.isFile()) return json(res, 404, { error: "Not found." });

    const body = await readFile(file);
    res.writeHead(200, securityHeaders({
      "Content-Type": mime[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": extname(file) === ".html" ? "no-cache" : "public, max-age=300"
    }));
    if (req.method === "HEAD") return res.end();
    res.end(body);
  } catch (error) {
    const status = Number(error?.status) || 500;
    const message = status >= 500 ? "The secure extraction request failed." : error.message;
    json(res, status, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ClairSortie: http://${HOST}:${PORT}`);
  console.log(process.env.OPENAI_API_KEY ? `GPT-5.6 mode enabled (${GPT56_MODEL}).` : "GPT-5.6 mode disabled: set OPENAI_API_KEY on this trusted server.");
});
