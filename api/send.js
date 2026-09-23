/* =========================================================
   POST /api/send – pošle odpověď z webu e-mailem přes Gmail
   ---------------------------------------------------------
   Běží na serveru (Vercel / lokálně server.js), NE v prohlížeči,
   takže heslo aplikace zůstává v tajnosti.

   Potřebné proměnné prostředí (.env / Vercel → Environment Variables):
     GMAIL_USER          – tvůj Gmail, ze kterého se posílá
     GMAIL_APP_PASSWORD  – heslo aplikace (16 znaků)
     MAIL_TO             – kam má odpověď přijít (nepovinné, jinak GMAIL_USER)
   ========================================================= */
const nodemailer = require("nodemailer");

const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, message: "Použij POST" });
  }

  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  const to = process.env.MAIL_TO || user;
  if (!user || !pass) {
    console.error("[api/send] Chybí GMAIL_USER nebo GMAIL_APP_PASSWORD v proměnných prostředí.");
    return sendJson(res, 500, { success: false, message: "Server nemá nastavený e-mail" });
  }

  const data = parseBody(req);

  // Honeypot – vyplní ho jen bot, tváříme se, že je vše OK
  if (data.botcheck) return sendJson(res, 200, { success: true });

  const subject = String(data.subject || "💌 Odpověď z rande webu").slice(0, MAX_SUBJECT);
  const message = String(data.message || "").slice(0, MAX_MESSAGE);
  if (!message.trim()) {
    return sendJson(res, 400, { success: false, message: "Prázdná zpráva" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
    // Příjemce je pevně daný na serveru – přes web nejde poslat e-mail nikomu jinému
    await transporter.sendMail({
      from: `"Rande web 💕" <${user}>`,
      to,
      subject,
      text: message
    });
    return sendJson(res, 200, { success: true });
  } catch (err) {
    console.error("[api/send] Odeslání selhalo:", err.message);
    return sendJson(res, 502, { success: false, message: "Odeslání e-mailu selhalo" });
  }
};
