# 💕 Klári, půjdeš se mnou na rande?

Statický web (HTML + CSS + vanilla JS) na **GitHub Pages**:
<https://fajlajpos.github.io/date/>

Odpověď přijde e-mailem na `filipmayer7@gmail.com` přes [FormSubmit.co](https://formsubmit.co) –
bez serveru, bez hesla, bez klíče. Ona nic nevyplňuje, jen klikne **Odeslat 💌**.

```
index.html          – stránka
style.css           – vzhled (barvy a písma v :root nahoře)
script.js           – logika + všechno, co se dá upravit (CONFIG, TEXTS, TAUNTS, ACTIVITIES)
assets/photo.jpg    – fotka na začátku (čtverec)
assets/photo-end.jpg – fotka na konci (na výšku 4:5)
```

---

## ⚠️ Jednorázová aktivace – udělej PŘED posláním odkazu!

FormSubmit při **úplně prvním** odeslání nepošle odpověď, ale aktivační e-mail.

1. Otevři <https://fajlajpos.github.io/date/>, projdi to celé a klikni **Odeslat 💌**.
   Ukáže se „Holub se cestou ztratil…“ – u prvního pokusu je to v pořádku.
2. Do Gmailu přijde e-mail od **FormSubmit** → klikni **Activate Form**
   (mrkni i do Spamu / Promo akcí).
3. Obnov stránku, projdi to znovu a odešli – teď už ti přijde e-mail s odpovědí
   a stránka ukáže „Těším se! 💕“.

Teprve pak pošli odkaz Kláře – jinak by její první odpověď spadla do aktivace.

## Nahrání změn na GitHub

```bash
git add .
git commit -m "Úpravy"
git push
```

Za 1–2 minuty se změny objeví na webu (stav v záložce **Actions**).
Kdyby Pages nebyly zapnuté: repo → **Settings → Pages → Deploy from a branch → `main` / `(root)`**.

## Úpravy

Vše je v `script.js` nahoře:

- `CONFIG` – jména, e-mail, cesty k fotkám
- `TEXTS` – nadpisy, tlačítka, popisek na polaroidu, podpis
- `TAUNTS` – hlášky, když NE uteče (`{pokusy}` = počet pokusů)
- `ACTIVITIES` – karty v kroku 3
- `TIME_FROM` / `TIME_TO` / `TIME_STEP` – nabízené časy

Barvy jsou v `style.css` v bloku `:root`.

## Vyzkoušení na počítači

```bash
npm start      # → http://localhost:3000
```

---

### Poznámka k `.env` / `api/send.js` / `server.js`

To je alternativa, která posílá e-mail přes Gmail s heslem aplikace. **Na GitHub Pages
nefunguje** (Pages neumí spustit server) – použít by šla jen na hostingu se serverem
(např. Vercel). `.env` s heslem **nikdy nedávej do gitu** – je v `.gitignore`.
