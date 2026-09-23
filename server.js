/* =========================================================
   Lokální server pro vývoj:  npm start  →  http://localhost:3000
   - servíruje web (index.html, style.css, script.js, assets/)
   - POST /api/send → api/send.js (posílá e-mail přes Gmail)
   - načte tajné údaje z .env
   Na Vercelu se tenhle soubor nepoužívá (tam běží rovnou api/send.js).
   ========================================================= */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

// Načti .env (Node 20.12+ to umí sám, bez balíčku dotenv)
try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  console.warn("⚠️  Soubor .env nenalezen – odesílání e-mailu nebude fungovat (viz .env.example).");
}

const sendHandler = require("./api/send.js");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/plain; charset=utf-8"
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) { reject(new Error("Příliš velký požadavek")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relative);

  // Nepouštěj ven ze složky, ke skrytým souborům (.env!) ani k serverovému kódu
  const forbidden =
    !filePath.startsWith(ROOT + path.sep) ||
    relative.split(/[\\/]/).some((part) => part.startsWith(".")) ||
    /^(api|node_modules)([\\/]|$)/.test(relative);
  if (forbidden) {
    res.writeHead(404).end("Not found");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" }).end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (pathname === "/api/send") {
    try {
      const raw = req.method === "POST" ? await readBody(req) : "";
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      await sendHandler(req, res);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" })
        .end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`💕 Rande web běží na http://localhost:${PORT}`);
});
