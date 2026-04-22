# 🍽️ Rodinný hlasovač večeří

Každý den ve 14:00 dostane celá rodina email s 3 návrhy večeře od AI. Každý hlasuje přes odkaz, výsledky jsou vidět živě.

## Stack
- **Next.js 14** (App Router) na **Vercel** (free tier)
- **MySQL** na **Hostinger** + **Prisma ORM**
- **Claude API** (Haiku model) pro generování návrhů
- **Resend** pro emaily (free tier = 3000/měsíc)
- **GitHub Actions** pro denní cron job

---

## Setup – krok za krokem

### 1. Databáze na Hostingeru

1. Přihlas se do **Hostinger hPanel**
2. Jdi na **Databases → MySQL Databases**
3. Vytvoř novou databázi a uživatele
4. Povol **Remote MySQL** přístup:
   - Jdi na **Remote MySQL** 
   - Přidej IP `0.0.0.0` (nebo konkrétní Vercel IP – viz níže)
5. V **phpMyAdmin** spusť soubory:
   - `database/01_schema.sql` (vytvoří tabulky)
   - `database/02_seed_members.sql` (uprav emaily!)

### 2. API klíče

| Služba | Kde získat | Env variable |
|--------|-----------|--------------|
| Claude API | console.anthropic.com | `ANTHROPIC_API_KEY` |
| Resend | resend.com (zadarmo) | `RESEND_API_KEY` |
| Hostinger DB | hPanel → Databases | `DATABASE_URL` |

Formát DATABASE_URL:
```
mysql://DB_USER:DB_PASSWORD@srv123.hostinger.com:3306/DB_NAME
```
Host (srv123...) najdeš v hPanel → Databases → MySQL Databases → detail.

### 3. Lokální development

```bash
# Klonuj repo
git clone https://github.com/tvoje/dinner-voter.git
cd dinner-voter

# Instaluj závislosti
npm install

# Zkopíruj env
cp .env.example .env.local
# Vyplň všechny hodnoty v .env.local

# Vygeneruj Prisma klienta
npx prisma generate

# Spusť lokálně
npm run dev
```

### 4. Deploy na Vercel

```bash
npm i -g vercel
vercel --prod
```

V Vercel dashboardu → Settings → Environment Variables přidej všechny proměnné z `.env.local`.

### 5. GitHub Actions cron

V GitHub repo → Settings → Secrets přidej:
- `CRON_SECRET` – stejná hodnota jako v env
- `APP_URL` – URL tvé Vercel aplikace (bez trailing slash)

---

## Testování

Cron job můžeš spustit ručně:
```bash
curl -H "x-cron-secret: tvuj-secret" https://dinner-voter.vercel.app/api/cron/daily
```

Nebo v GitHub → Actions → Daily Dinner Generator → Run workflow.

---

## Přizpůsobení

### Změna preferencí rodiny
Uprav `database/02_seed_members.sql` a znovu spusť v phpMyAdmin,
nebo edituj záznamy přímo přes phpMyAdmin.

Zároveň aktualizuj `FAMILY_PROFILE` v `lib/generateProposals.ts`
(nebo přepni na dynamické načítání z DB – viz komentář v souboru).

### Změna času odesílání
V `.github/workflows/daily-dinner.yml` uprav cron výraz:
- `0 13 * * *` = 14:00 SEČ (13:00 UTC)
- `0 12 * * *` = 13:00 SEČ

### Počet návrhů
V `lib/generateProposals.ts` uprav prompt – požádej o 4 nebo 5 návrhů místo 3.

---

## Náklady (měsíční)

| Služba | Cena |
|--------|------|
| Vercel | Zdarma |
| Resend (do 3000 emailů) | Zdarma |
| Claude Haiku API (~30 volání/měsíc) | ~$0.05 |
| Hostinger MySQL | Součást tvého plánu |
| **Celkem** | **~$0.05/měsíc** |
