/**
 * Rande web → hezký e-mail do tvého Gmailu 💌
 * ------------------------------------------------------------
 * Tenhle kód NEPATŘÍ na web – zkopíruj ho do https://script.google.com
 * (postup je v README.md, sekce „Hezký e-mail přes Google“).
 *
 * Web sem pošle odpověď a skript ti ji odešle jako barevný HTML e-mail
 * z tvého vlastního Gmailu. Nic dalšího nepotřebuješ.
 */

// Kam má odpověď přijít. Když necháš prázdné, pošle se na Google účet,
// pod kterým skript běží (tj. tvůj Gmail).
const MY_EMAIL = "";

/* Barvy e-mailu – stejné jako na webu */
const C = {
  bg: "#fde4ee",
  card: "#ffffff",
  primary: "#d23c77",
  primaryStrong: "#b82a62",
  soft: "#fff5f9",
  border: "#f3cddd",
  text: "#4a1f3d",
  muted: "#7a4a68"
};
const FONT = "'Nunito','Segoe UI',Helvetica,Arial,sans-serif";

/** Web posílá odpověď sem (POST). */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Honeypot – vyplní ho jen bot, tváříme se, že je vše OK
    if (data.botcheck) return json_({ success: true });

    const subject = String(data.subject || "💌 Odpověď z rande webu").slice(0, 200);
    const message = String(data.message || "").slice(0, 5000);
    if (!message) return json_({ success: false, message: "Prázdná zpráva" });

    const mail = {
      to: MY_EMAIL || Session.getEffectiveUser().getEmail(),
      subject: subject,
      body: message,               // obyčejný text pro aplikace, které neumí HTML
      name: "Rande web 💕"
    };
    if (data.email) mail.htmlBody = buildEmailHtml_(data.email);
    MailApp.sendEmail(mail);

    return json_({ success: true });
  } catch (err) {
    console.error(err);
    return json_({ success: false, message: String(err) });
  }
}

/** Když URL otevřeš v prohlížeči, uvidíš, že skript běží. */
function doGet() {
  return json_({ success: true, message: "Rande web skript běží 💕" });
}

/**
 * Spusť ručně v editoru (▶ Spustit) – Google si řekne o povolení
 * a pošle ti zkušební e-mail v novém designu. Tak ověříš, že to funguje.
 */
function testEmail() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        subject: "💌 Test z rande webu",
        message: "Když tohle čteš, odesílání funguje 🎉",
        email: SAMPLE_EMAIL_
      })
    }
  });
  console.log(result.getContent());
}

/** Ukázková data pro testEmail(). */
const SAMPLE_EMAIL_ = {
  herName: "Klára",
  myName: "Filip",
  weekday: "sobota",
  dayMonth: "27. září",
  time: "19:00",
  activities: ["Kino", "Procházka"],
  otherIdea: "Zmrzlina cestou 🍦",
  pickup: "yes",
  message: "Těším se! Ale popcorn fakt platíš ty 😌",
  noAttempts: 7,
  secretFound: true,
  answeredAt: "24. 9. 2026 10:04:43",
  calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE"
};

/* =========================================================
   Šablona e-mailu
   E-mailové aplikace (Gmail, Outlook…) umí jen tabulky a styly
   přímo v atributu style – proto to vypadá „postaru“.
   ========================================================= */
function buildEmailHtml_(d) {
  const name = esc_(d.herName || "Ona");
  const activities = (d.activities || []).map(esc_);
  const pickup = { yes: "Chce, abys pro ni přijel 🚗", no: "Sejdete se na místě 📍" }[d.pickup] || "";
  const attempts = Number(d.noAttempts) || 0;

  // Řádky s detaily (prázdné se vynechají)
  const rows = [
    activities.length ? detailRow_("💗", "Program", activities.map(chip_).join(" ")) : "",
    d.otherIdea ? detailRow_("✍️", "Její nápad", esc_(d.otherIdea)) : "",
    pickup ? detailRow_("🚗", "Doprava", pickup) : ""
  ].join("");

  const note = d.message
    ? `<tr><td style="padding:8px 28px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soft};border-left:4px solid ${C.primary};border-radius:12px;">
          <tr><td style="padding:14px 18px;font-family:${FONT};">
            <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">💌 Vzkaz pro tebe</div>
            <div style="margin-top:6px;font-size:16px;line-height:1.5;color:${C.text};white-space:pre-line;">${esc_(d.message)}</div>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const button = d.calendarUrl
    ? `<tr><td align="center" style="padding:22px 28px 6px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td bgcolor="${C.primary}" style="border-radius:999px;">
            <a href="${esc_(d.calendarUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">📅 Přidat do mého kalendáře</a>
          </td>
        </tr></table>
      </td></tr>`
    : "";

  const preheader = `${name} řekla ANO! ${esc_(d.weekday)} ${esc_(d.dayMonth)} v ${esc_(d.time)}`;

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${name} řekla ANO!</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg};">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border-radius:24px;overflow:hidden;box-shadow:0 18px 40px -20px rgba(184,42,98,.45);">

      <!-- Hlavička -->
      <tr><td align="center" bgcolor="${C.primary}" style="background:${C.primary};background-image:linear-gradient(135deg,${C.primary},${C.primaryStrong});padding:34px 24px 30px;font-family:${FONT};">
        <div style="font-size:44px;line-height:1;">💌</div>
        <div style="margin-top:12px;font-size:30px;font-weight:800;line-height:1.2;color:#ffffff;">${name} řekla ANO!</div>
        <div style="margin-top:6px;font-size:16px;font-weight:600;color:#ffe4ef;">Máš rande. Tak ať to stojí za to 😏</div>
      </td></tr>

      <!-- Datum a čas jako vstupenka -->
      <tr><td style="padding:26px 28px 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soft};border:2px dashed ${C.border};border-radius:18px;">
          <tr>
            <td align="center" style="padding:18px 12px;font-family:${FONT};">
              <div style="font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.muted};">${esc_(d.weekday)}</div>
              <div style="margin-top:4px;font-size:32px;font-weight:800;line-height:1.15;color:${C.primaryStrong};">${esc_(d.dayMonth)}</div>
              <div style="margin-top:10px;">
                <span style="display:inline-block;padding:6px 16px;border-radius:999px;background:${C.primary};font-size:18px;font-weight:800;color:#ffffff;">🕖 ${esc_(d.time)}</span>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Detaily -->
      <tr><td style="padding:6px 28px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>

      ${note}
      ${button}

      <!-- Statistiky -->
      <tr><td style="padding:22px 28px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          ${statBox_(String(attempts), attempts === 1 ? "pokus kliknout na NE 😏" : attempts >= 2 && attempts <= 4 ? "pokusy kliknout na NE 😏" : "pokusů kliknout na NE 😏")}
          <td width="4%" style="width:4%;font-size:0;line-height:0;">&nbsp;</td>
          ${statBox_(d.secretFound ? "ANO" : "NE", d.secretFound ? "našla tajnou zprávu 🤫" : "tajnou zprávu nenašla 🤫")}
        </tr></table>
      </td></tr>

      <!-- Patička -->
      <tr><td align="center" style="padding:22px 28px 28px;font-family:${FONT};font-size:13px;color:${C.muted};">
        Odpověděla ${esc_(d.answeredAt || "")} · Rande web 💕
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Jeden řádek detailu: ikona | popisek + hodnota */
function detailRow_(icon, label, valueHtml) {
  return `<tr>
    <td width="40" valign="top" style="width:40px;padding:12px 0;border-bottom:1px dashed ${C.border};font-size:22px;line-height:1.3;">${icon}</td>
    <td valign="top" style="padding:12px 0;border-bottom:1px dashed ${C.border};font-family:${FONT};">
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">${label}</div>
      <div style="margin-top:4px;font-size:16px;font-weight:700;line-height:1.5;color:${C.text};">${valueHtml}</div>
    </td>
  </tr>`;
}

/** Růžový „štítek“ pro aktivitu */
function chip_(text) {
  return `<span style="display:inline-block;margin:2px 4px 2px 0;padding:4px 12px;border-radius:999px;background:#ffe4ef;border:1px solid ${C.border};color:${C.primaryStrong};font-size:15px;font-weight:800;">${text}</span>`;
}

/** Malý box se statistikou */
function statBox_(value, label) {
  return `<td width="48%" align="center" valign="top" style="width:48%;padding:14px 8px;background:${C.soft};border:2px solid ${C.border};border-radius:16px;font-family:${FONT};">
    <div style="font-size:26px;font-weight:800;line-height:1.1;color:${C.primaryStrong};">${value}</div>
    <div style="margin-top:4px;font-size:13px;font-weight:700;color:${C.muted};">${label}</div>
  </td>`;
}

/** Ošetří text od uživatele, aby nešlo vložit HTML */
function esc_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
