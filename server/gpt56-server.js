import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractWithGPT56Detailed, GPT56_MODEL } from "../examples/gpt-5.6-server.example.js";
import { SAMPLE } from "../src/sample.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8000);
const MAX_BODY_BYTES = 250_000;
const PUBLIC_DEMO_MODE = process.env.PUBLIC_GPT56_DEMO === "true";
const BUILD_ID = "2026-07-21-render-video-v2";
const PRESENTATION_VIDEO_URL = "https://youtu.be/sGNNWfXMEEw";

let cachedSampleResult = null;
let sampleRequestInFlight = null;

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
    "X-ClairSortie-Build": BUILD_ID,
    ...extra
  };
}

function json(res, status, payload) {
  res.writeHead(status, securityHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
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

async function runPublicSample() {
  if (cachedSampleResult) return { ...cachedSampleResult, cached: true };
  if (!sampleRequestInFlight) {
    sampleRequestInFlight = extractWithGPT56Detailed(SAMPLE)
      .then(({ plan, verification }) => {
        cachedSampleResult = {
          ...plan,
          _verification: { ...verification, cached: false, sampleOnly: true }
        };
        return cachedSampleResult;
      })
      .finally(() => {
        sampleRequestInFlight = null;
      });
  }
  return sampleRequestInFlight;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      return json(res, 200, {
        gpt56: Boolean(process.env.OPENAI_API_KEY),
        model: GPT56_MODEL,
        publicDemo: PUBLIC_DEMO_MODE,
        sampleOnly: PUBLIC_DEMO_MODE,
        build: BUILD_ID,
        presentationVideo: PRESENTATION_VIDEO_URL,
        lastSuccessfulRun: cachedSampleResult?._verification?.generatedAt || null,
        privacy: "no document retention by ClairSortie"
      });
    }

    if (req.method === "POST" && req.url === "/api/extract") {
      if (!process.env.OPENAI_API_KEY) return json(res, 503, { error: "GPT-5.6 server mode is not configured." });
      const body = await readJson(req);
      const document = body?.document;

      if (PUBLIC_DEMO_MODE) {
        if (typeof document !== "string" || document.trim() !== SAMPLE.trim()) {
          return json(res, 400, { error: "The public GPT-5.6 judge demo accepts only the bundled synthetic example." });
        }
        return json(res, 200, await runPublicSample());
      }

      const { plan, verification } = await extractWithGPT56Detailed(document);
      return json(res, 200, { ...plan, _verification: { ...verification, cached: false, sampleOnly: false } });
    }

    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed." });

    const file = resolveStaticPath(req.url || "/");
    if (!file) return json(res, 400, { error: "Invalid path." });

    const fileStat = await stat(file).catch(() => null);
    if (!fileStat?.isFile()) return json(res, 404, { error: "Not found." });

    const body = await readFile(file);
    res.writeHead(200, securityHeaders({
      "Content-Type": mime[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
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
  console.log(`Build: ${BUILD_ID}`);
  console.log(process.env.OPENAI_API_KEY ? `GPT-5.6 mode enabled (${GPT56_MODEL}).` : "GPT-5.6 mode disabled: set OPENAI_API_KEY on this trusted server.");
  if (PUBLIC_DEMO_MODE) console.log("Public judge demo mode: bundled synthetic sample only.");
});
