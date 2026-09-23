/**
 * Rande web → e-mail do tvého Gmailu 💌
 * ------------------------------------------------------------
 * Tenhle kód NEPATŘÍ na web – zkopíruj ho do https://script.google.com
 * (postup je v README.md, sekce „Odesílání přes Google“).
 *
 * Web sem pošle odpověď a skript ti ji odešle e-mailem z tvého
 * vlastního Gmailu. Nic dalšího nepotřebuješ.
 */

// Kam má odpověď přijít. Když necháš prázdné, pošle se na Google účet,
// pod kterým skript běží (tj. tvůj Gmail).
const MY_EMAIL = "";

/** Web posílá odpověď sem (POST). */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Honeypot – vyplní ho jen bot, tváříme se, že je vše OK
    if (data.botcheck) return json_({ success: true });

    const subject = String(data.subject || "💌 Odpověď z rande webu").slice(0, 200);
    const message = String(data.message || "").slice(0, 5000);
    if (!message) return json_({ success: false, message: "Prázdná zpráva" });

    MailApp.sendEmail({
      to: MY_EMAIL || Session.getEffectiveUser().getEmail(),
      subject: subject,
      body: message,
      name: "Rande web 💕"
    });

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
 * a pošle ti zkušební e-mail. Tak ověříš, že to funguje.
 */
function testEmail() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        subject: "💌 Test z rande webu",
        message: "Když tohle čteš, odesílání funguje 🎉"
      })
    }
  });
  console.log(result.getContent());
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
