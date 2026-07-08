# Filmni Top

Telegram Mini App viktorina o'yini: o'yinchiga film kadri ko'rsatiladi, u esa film
nomini o'zi yozib topishi kerak. To'liq TZ — [TZ.md](TZ.md).

## Monorepo tuzilishi

```
backend/   Fastify + TypeScript + Prisma (SQLite) — API, o'yin logikasi, auth
frontend/  React + Vite + TypeScript — Telegram Mini App interfeysi (uz/ru)
admin/     React + Vite + TypeScript — filmlar/kadrlar boshqaruvi, statistika
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

Mini App'ni ochish uchun alohida bot serveri kerak emas — BotFather'ning o'zida
mini-app havolasini sozlash yetarli:

1. [@BotFather](https://t.me/BotFather) orqali bot yarating, tokenni oling.
2. `backend/.env`: `TELEGRAM_BOT_TOKEN`, `AUTH_DEV_MODE=0`.
3. Frontend'ni deploy qiling (masalan Vercel) va **HTTPS** manzilini oling —
   Telegram HTTP mini-app'larni ochmaydi.
4. BotFather'da: `/mybots` → botingizni tanlang → **Bot Settings** → **Menu
   Button** → shu HTTPS manzilni kiriting (yoki `/newapp` orqali to'liq
   mini-app sifatida ro'yxatdan o'tkazing).
5. Havolani Telegram ichidan (bot menyusi orqali) oching — brauzerda
   to'g'ridan-to'g'ri ochilganda auth ishlamaydi, bu kutilgan holat (pastdagi
   "Deploy" bo'limiga qarang).

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

## Deploy

### Variant A — VPS, Docker Compose (hammasi bir joyda)

```bash
cp backend/.env.example backend/.env      # productiondagi qiymatlar bilan to'ldiring
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

### Variant B — Frontend Vercel'da, backend alohida hostda

`frontend/` statik build (Vite) bo'lgani uchun Vercel'ga to'g'ridan-to'g'ri
mos keladi, lekin **backend Vercel'da ishlamaydi** — SQLite fayl-baza doimiy
diskni talab qiladi, Vercel esa serverless (har so'rovda fayl tizimi
tiklanadi). Backend uchun doimiy disk beradigan xizmat kerak (masalan
Railway, Render, Fly.io yoki oddiy VPS).

1. **Backend**ni Railway/Render/VPS'ga deploy qiling (`backend/` papkasi,
   `Dockerfile` tayyor). Muhim: `DATABASE_URL` doimiy volume/diskka
   yo'naltirilishi kerak, aks holda har deploy'da baza o'chib ketadi.
2. Backend `.env`da `CORS_ORIGIN`ga Vercel domeningizni qo'shing (masalan
   `https://filmni-top.vercel.app`).
3. **Vercel**da `frontend/` uchun loyiha yarating (Root Directory =
   `frontend`), `VITE_API_URL` environment variable'ini backend'ning ochiq
   HTTPS manziliga o'rnating, deploy qiling. `frontend/vercel.json` ichki
   marshrutlarni (masalan `/stages/1/play/5`) sahifa yangilanganda 404
   bermasligi uchun `index.html`ga yo'naltiradi — qo'shimcha sozlash kerak
   emas.
4. BotFather'da mini-app/menu button URL'ni shu Vercel manziliga sozlang
   (yuqoridagi "Haqiqiy Telegram bilan ishlash" bo'limiga qarang).
5. Havolani **faqat Telegram ichidan** sinab ko'ring — brauzerda
   to'g'ridan-to'g'ri ochish "Telegram orqali ochilmadi" xabarini beradi,
   bu anti-cheat talabi bo'yicha kutilgan holat, xato emas.

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
