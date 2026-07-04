# Filmni Top

Telegram Mini App viktorina o'yini: o'yinchiga film kadri ko'rsatiladi, u esa film
nomini o'zi yozib topishi kerak. To'liq TZ — [TZ.md](TZ.md).

## Monorepo tuzilishi

```
backend/   Fastify + TypeScript + Prisma (SQLite) — API, o'yin logikasi, auth
frontend/  React + Vite + TypeScript — Telegram Mini App interfeysi (uz/ru)
admin/     React + Vite + TypeScript — filmlar/kadrlar boshqaruvi, statistika
bot/       grammY — /start va mini-app tugmasi
nginx/     Prod reverse-proxy konfiguratsiyasi
```

## Talablar

- Node.js 20+
- npm

## Tezkor start (lokal, Telegramsiz)

Backend `AUTH_DEV_MODE=1` bilan haqiqiy Telegram botisiz ham ishlaydi — frontend
soxta foydalanuvchi bilan avtomatik kiradi.

```bash
# 1) Backend
cd backend
cp .env.example .env          # AUTH_DEV_MODE=1 ni yoqing
npm install
npx prisma migrate dev
npm run seed:demo             # 14 ta demo film + placeholder kadrlar bilan bazani to'ldiradi
npm run dev                   # http://localhost:3001

# 2) Frontend (yangi terminalda)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Brauzerda `http://localhost:5173` oching — o'yin darhol ishlaydi (soxta Telegram
foydalanuvchi orqali). Backend testlarini ishga tushirish:

```bash
cd backend && npm test
```

## Admin panel

Filmlar/kadrlar qo'shish, o'chirish va statistikani ko'rish uchun alohida veb
ilova (`admin/`). Parol bilan himoyalangan, `backend/.env`dagi `ADMIN_PASSWORD`
va `ADMIN_JWT_SECRET` orqali ishlaydi.

```bash
cd admin
cp .env.example .env
npm install
npm run dev                   # http://localhost:5174/admin/
```

Backend `.env`da admin dev serveri boshqa portda ishlaganligi uchun uni CORS
ro'yxatiga qo'shing: `CORS_ORIGIN="http://localhost:5173,http://localhost:5174"`.

## Haqiqiy Telegram bilan ishlash

1. [@BotFather](https://t.me/BotFather) orqali bot yarating, tokenni oling.
2. `backend/.env`: `TELEGRAM_BOT_TOKEN`, `AUTH_DEV_MODE=0`.
3. `bot/.env`: `TELEGRAM_BOT_TOKEN`, `MINI_APP_URL` (HTTPS manzil — Telegram
   HTTP mini-app'larni ochmaydi).
4. BotFather'da mini-app URL'ni sozlang (`/newapp` yoki `/setmenubutton`).
5. Botni ishga tushiring: `cd bot && npm install && npm run dev`.

## Kontent (kadrlar bazasi)

`npm run seed:demo` — abstrakt placeholder rasmlar bilan 14 mashhur film (faqat
lokal test uchun; haqiqiy film kadri emas).

Haqiqiy kontent uchun TZ 7.2 formatidagi JSON manifest tayyorlang
(`backend/content/manifest.example.json` ga qarang), rasmlarni
`backend/content/images/` papkasiga qo'ying, so'ng:

```bash
cd backend
npm run seed -- content/manifest.json
```

Inside the deployed Docker container (no `tsx`, only the compiled build), use:

```bash
docker compose exec backend node dist/scripts/importContent.js content/manifest.json
```

## Deploy (VPS, Docker Compose)

```bash
cp backend/.env.example backend/.env      # productiondagi qiymatlar bilan to'ldiring
cp bot/.env.example bot/.env
echo "MINI_APP_URL=https://your-domain.example" > .env

docker compose up -d --build
```

HTTPS uchun (Telegram buni talab qiladi):

1. DNS orqali domeningizni VPS IP'siga yo'naltiring.
2. `certbot` bilan sertifikat oling (masalan, `certbot certonly --webroot -w
   /var/www/certbot ...` alohida konteynerda yoki hostda), natijalarni
   `certbot_conf` volume'iga joylashtiring.
3. `nginx/nginx.conf` dagi HTTPS server blokini oching (izohdan chiqaring),
   domeningizni yozing, `docker compose restart nginx`.

## Texnik eslatmalar

- **Anti-cheat**: to'g'ri javob hech qachon frontend'ga yuborilmaydi; javob
  faqat serverda (`backend/src/lib/matching.ts`) tekshiriladi. Taymer ham
  serverda kuzatiladi (60s + 5s grace).
- **Fuzzy matching**: Levenshtein masofasi + lotin/kirill transliteratsiyasi —
  `backend/src/lib/matching.ts`, testlar `backend/src/test/matching.test.ts`.
- **Ochko hisoblash**: `backend/src/lib/scoring.ts` (bazaviy, tezlik bonusi,
  streak, yordam narxi, qiyinlik ko'paytiruvchisi).
- Demo kadrlar (`seed:demo`) — abstrakt SVG placeholder, real film skrinshoti
  emas. Ishga tushirishdan oldin TZ 7-bo'lim bo'yicha haqiqiy kontent kerak.
