# 💕 Půjdeš se mnou na rande?

Malý web (HTML + CSS + vanilla JS) + jedna serverová funkce, která ti odpověď pošle
e-mailem **z tvého Gmailu** (heslo aplikace je bezpečně v `.env`, ne na webu).
Ona nic nevyplňuje – jen klikne **Odeslat 💌** a e-mail přijde tobě.

```
index.html      – stránka
style.css       – vzhled (barvy a písma v :root nahoře)
script.js       – logika + všechno, co se dá upravit (CONFIG, TEXTS, TAUNTS, ACTIVITIES)
api/send.js     – serverová funkce: POST /api/send → pošle e-mail přes Gmail
server.js       – lokální server pro `npm start` (web + /api/send, načte .env)
.env            – TAJNÉ: Gmail + heslo aplikace (je v .gitignore, na GitHub se nedostane)
.env.example    – vzor pro .env
assets/         – sem patří photo.jpg
google-apps-script.gs – alternativa bez serveru (viz konec README)
```

> ⚠️ **GitHub Pages už nestačí** – umí jen statické soubory, ne serverovou funkci
> s heslem. Web proto nasadíš na **Vercel** (zdarma, napojí se na GitHub, viz krok 3).

---

## 1. Jména

Otevři `script.js` a úplně nahoře vyplň:

```js
const CONFIG = {
  herName: "Eliška",          // 1. pád – použije se v e-mailu („Eliška řekla ANO“)
  herNameVocative: "Eliško",  // 5. pád – oslovení v otázce („Eliško, půjdeš…“)
  myName: "Filip",
  apiUrl: "api/send",         // nech tak
  ...
};
```

## 2. Heslo aplikace Gmail (`.env`)

Soubor `.env` už je připravený. Když heslo změníš / vygeneruješ nové
(<https://myaccount.google.com/apppasswords>, vyžaduje dvoufázové ověření), přepiš ho tam:

```
GMAIL_USER=filipmayer7@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_TO=filipmayer7@gmail.com
```

- `.env` **nikdy nedávej do gitu ani nikam neposílej** – je v `.gitignore`.
- Příjemce (`MAIL_TO`) je pevně na serveru, takže přes web nikdo nemůže poslat e-mail
  nikomu jinému než tobě.

## 3. Fotka

- Nahraj fotku jako **`assets/photo.jpg`** (přesně tenhle název, malými písmeny).
- Zobrazuje se ve **čtvercovém** polaroidu, ideální je poměr **1 : 1**
  (např. 800 × 800 px). Jiný poměr se automaticky ořízne na střed.
- Velikost **max. cca 500 KB**, ať se to na mobilu rychle načte.
- Zmenšení: <https://squoosh.app> → nahraj fotku → *Resize* na 800 px →
  *MozJPEG*, kvalita ~75 → stáhni a přejmenuj na `photo.jpg`.
- Dokud fotka není, zobrazí se 🥰.

## 4. Vyzkoušení na počítači

```bash
npm install     # jen poprvé – stáhne nodemailer
npm start
```

→ otevři <http://localhost:3000> (zastavíš Ctrl+C), projdi to a klikni **Odeslat 💌** –
e-mail ti opravdu přijde. Na mobilu ve stejné Wi-Fi: `http://IP-TVÉHO-PC:3000`.

## 5. Nasazení na internet (GitHub + Vercel)

**a) Nahraj kód na GitHub** – repo může (a klidně by mělo) být **Private**:

```bash
git add .
git commit -m "Rande web 💕"
git branch -M main
git remote add origin https://github.com/TVUJ-UZIVATEL/rande.git
git push -u origin main
```

Před commitem si ověř, že v seznamu `git status` **není `.env`**.

**b) Vercel:**

1. <https://vercel.com/new> → **Continue with GitHub** → u repa `rande` klikni **Import**.
2. *Framework Preset:* **Other**, Build Command i Output Directory nech prázdné.
3. Rozbal **Environment Variables** a přidej tři proměnné (stejné jako v `.env`):
   - `GMAIL_USER` = `filipmayer7@gmail.com`
   - `GMAIL_APP_PASSWORD` = tvoje heslo aplikace
   - `MAIL_TO` = `filipmayer7@gmail.com`
4. **Deploy**. Za chvíli dostaneš adresu typu `https://rande-xxxx.vercel.app` – tu jí pošleš.

Každý další `git push` se na Vercelu nasadí sám. Když změníš proměnné na Vercelu
(*Project → Settings → Environment Variables*), dej **Deployments → ⋯ → Redeploy**.

## Před posláním odkazu

- [ ] otevři web na svém telefonu a zkus trefit NE 🙂
- [ ] projdi celý formulář **na Vercel adrese** a odešli si testovací odpověď – přijde e-mail?
- [ ] web má `noindex`, Google ho nenajde – dostane se k němu jen ten, komu pošleš odkaz

## Úpravy textů

Vše je v `script.js` nahoře:

- `TEXTS` – nadpisy, tlačítka, předmět e-mailu (`{jmeno}`, `{jmeno5}`, `{ja}` se doplní samy)
- `TAUNTS` – hlášky, když NE uteče
- `ACTIVITIES` – karty v kroku 3 (emoji + název)

Barvy jsou v `style.css` v bloku `:root`.

---

## Alternativa bez serveru: Google Apps Script

Kdybys chtěl zůstat na GitHub Pages: vlož `google-apps-script.gs` do
<https://script.google.com/home/projects/create>, spusť `testEmail`, pak
**Nasadit → Nové nasazení → Webová aplikace** (*Spustit jako: Já*, *Přístup: Kdokoli*),
URL končící `/exec` dej do `CONFIG.googleScriptUrl` a `CONFIG.apiUrl` nastav na `""`.
