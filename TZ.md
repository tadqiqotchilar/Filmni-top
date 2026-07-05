# TEXNIK TOPSHIRIQ (TZ)
## «Filmni Top» — Telegram Mini App o'yini

**Versiya:** 1.0
**Sana:** 2026-07-04
**Buyurtmachi:** Baxtjon
**Loyiha nomi:** Filmni-top

---

## 1. Loyiha maqsadi

Telegram Mini App ko'rinishidagi o'yin. O'yinchiga mashhur filmdan bitta kadr (skrinshot) ko'rsatiladi. O'yinchi film nomini **o'zi yozib** topishi kerak. To'g'ri javoblar uchun ochko beriladi, natijalar liderlar jadvalida ko'rsatiladi.

---

## 2. Asosiy tushunchalar

| Termin | Ma'nosi |
|---|---|
| Kadr | Filmdan olingan bitta skrinshot (savol) |
| Raund | Bitta kadr + javob berish jarayoni |
| Sessiya | Ketma-ket N ta raund (standart: 10) |
| Alias | Film nomining qabul qilinadigan yozilish variantlari |
| Streak | Ketma-ket to'g'ri javoblar soni |

---

## 3. O'yin mexanikasi

### 3.1. Asosiy jarayon

1. O'yinchi «Boshlash» tugmasini bosadi.
2. Ekranda kadr chiqadi + matn kiritish maydoni.
3. Har raundga **60 soniya** vaqt beriladi (taymer ko'rinib turadi).
4. O'yinchi film nomini yozadi va «Javob berish» bosadi.
5. Tizim javobni tekshiradi (3.3-bandga qarang).
6. Natija ko'rsatiladi: to'g'ri/noto'g'ri, filmning to'liq nomi, yili, posteri.
7. Keyingi raundga o'tiladi. 10 raunddan keyin sessiya yakuni ekrani.

### 3.2. Yordam (hint) tizimi

Har bir raundda o'yinchi ochko evaziga yordam olishi mumkin:

| Yordam | Narxi | Tavsifi |
|---|---|---|
| Birinchi harf | 10 ochko | Film nomining bosh harfi ochiladi |
| Chiqarilgan yil | 15 ochko | Filmning yili ko'rsatiladi |
| Janr | 10 ochko | Filmning janri ko'rsatiladi |
| Harflar soni | 5 ochko | Nomdagi harflar soni (_ _ _ _ ko'rinishida) |

### 3.3. Javobni tekshirish (eng muhim qism!)

O'yinchi yozgan matn quyidagi bosqichlarda tekshiriladi:

1. **Normalizatsiya:** kichik harfga o'tkazish, ortiqcha probellar, tinish belgilari, apostroflar olib tashlanadi. Lotin/kirill transliteratsiyasi qo'llanadi (masalan, «Титаник» = «Titanik» = «Titanic»).
2. **Alias bilan solishtirish:** har bir film uchun bazada bir nechta qabul qilinadigan nom saqlanadi:
   - Asl nomi: `The Shawshank Redemption`
   - Ruscha: `Побег из Шоушенка`
   - O'zbekcha: `Shoushenkdan qochish`
   - Qisqa variantlar: `Shawshank`, `Шоушенк`
3. **Fuzzy matching:** Levenshtein masofasi bilan imlo xatolarga chidamlilik:
   - Nom uzunligi ≤ 5 harf → 1 ta xatoga ruxsat
   - 6–10 harf → 2 ta xato
   - > 10 harf → 3 ta xato
4. Mos kelsa — javob to'g'ri deb qabul qilinadi.

### 3.4. Ochko hisoblash

| Holat | Ochko |
|---|---|
| To'g'ri javob (bazaviy) | +100 |
| Tezlik bonusi | qolgan har soniya uchun +1 (maks. +55) |
| Streak bonusi (3+ ketma-ket) | +20 dan boshlab, har streak uchun +10 |
| Yordam ishlatilsa | yordam narxi ayiriladi |
| Noto'g'ri javob / vaqt tugashi | 0 |

Har raundda **3 ta urinish** beriladi: 1-urinishda Qiyin kadr, xato bo'lsa 2-urinishda O'rta kadr, yana xato bo'lsa 3-urinishda Oson kadr ko'rsatiladi (bazaviy ochko mos ravishda 100 / 50 / 25).

### 3.5. Qiyinlik darajalari

Har bir kadrga admin qiyinlik belgilaydi:

- **Oson** (×1.0) — taniqli sahna, mashhur film
- **O'rta** (×1.5) — mashhur film, lekin notanish kadr
- **Qiyin** (×2.0) — kam taniladigan kadr yoki film

Har raund bitta film uchun uchala qiyinlik darajasidagi (Qiyin+O'rta+Oson) kadrlarni birga oladi, shuning uchun faqat uchalasi ham mavjud bo'lgan filmlar sessiyaga kiradi. Bir o'yinchiga ilgari ko'rsatilgan kadr qayta chiqmasligi kerak (baza tugagunga qadar).

---

## 4. O'yin rejimlari

### 4.1. MVP (birinchi versiya)

- **Klassik rejim:** 10 raundlik sessiya, yuqoridagi qoidalar bo'yicha.
- **Liderlar jadvali:** umumiy (barcha vaqt) va haftalik.

### 4.2. Keyingi bosqichlar (MVP dan keyin)

- **Kunlik challenge:** hamma uchun bir xil 5 ta kadr, kuniga 1 marta.
- **Do'stlar bilan bellashish:** havola orqali do'stni chaqirish, natijalarni solishtirish.
- **Bexato rejim (survival):** birinchi xatogacha davom etadi.

---

## 5. Interfeys (UI/UX)

### 5.1. Til

Ikki til: **o'zbek** (standart) va **rus**. Foydalanuvchi sozlamalardan almashtiradi. Birinchi kirishda Telegram tiliga qarab avtomatik tanlanadi. Barcha matnlar i18n fayllarda saqlanadi.

### 5.2. Ekranlar

1. **Bosh ekran:** logo, «O'ynash» tugmasi, ochko/reyting, sozlamalar, qoidalar.
2. **O'yin ekrani:** kadr (to'liq enda), taymer, urinishlar soni, matn maydoni, yordam tugmalari, joriy ochko.
3. **Raund natijasi:** to'g'ri/noto'g'ri animatsiyasi, film nomi + yili + posteri, olingan ochko.
4. **Sessiya yakuni:** umumiy ochko, to'g'ri javoblar soni (masalan 7/10), reytingdagi o'rin, «Yana o'ynash» va «Ulashish» tugmalari.
5. **Liderlar jadvali:** haftalik / umumiy tab, top-100, o'zining o'rni alohida ko'rsatiladi.
6. **Sozlamalar:** til, ovoz.

### 5.3. Dizayn talablari

- Telegram theme'ga moslashish (`themeParams` — light/dark).
- Mobil birinchi: 320–430 px kenglikka optimallashtirilgan.
- Kadr yuklanayotganda skeleton/placeholder.
- Haptic feedback (Telegram WebApp API orqali) — to'g'ri/noto'g'ri javobda.
- Kadr ustida film nomini bildiradigan watermark/subtitr bo'lmasligi shart (kontent tayyorlashda tekshiriladi).

---

## 6. Texnik arxitektura

### 6.1. Stack

| Qatlam | Texnologiya |
|---|---|
| Frontend | React + Vite + TypeScript, `@telegram-apps/sdk` |
| Backend | Node.js (Fastify) + TypeScript |
| Baza | PostgreSQL (yoki MVP uchun SQLite) |
| ORM | Prisma |
| Rasmlar | Server diskida / S3-compatible storage, CDN orqali |
| Bot | grammY (faqat /start va mini-app tugmasi uchun) |
| Deploy | VPS + Docker Compose, Nginx, HTTPS (majburiy — Telegram talabi) |

### 6.2. Autentifikatsiya

- Mini App ochilganda Telegram `initData` backend'ga yuboriladi.
- Backend `initData` imzosini bot tokeni bilan tekshiradi (HMAC-SHA256).
- Tekshiruvdan o'tsa — JWT beriladi, keyingi so'rovlar shu token bilan.
- Foydalanuvchi bazada avtomatik yaratiladi (telegram_id, ism, username, avatar).

### 6.3. Anti-cheat

- Javob tekshiruvi **faqat serverda** — to'g'ri javob frontend'ga hech qachon yuborilmaydi.
- Taymer serverda ham hisoblanadi: raund boshlanish vaqti serverda saqlanadi, 60+5 soniyadan kech kelgan javob rad etiladi.
- Rasm URL'lari film nomini oshkor qilmasligi kerak (UUID nomlar: `a3f8c2.jpg`).
- Rate limiting: bir foydalanuvchidan soniyasiga 5 so'rovdan ko'p emas.

### 6.4. Baza sxemasi (asosiy jadvallar)

```
users
  id, telegram_id, username, first_name, avatar_url,
  language (uz/ru), total_score, games_played, created_at

films
  id, title_original, title_uz, title_ru, year, genre,
  poster_url, is_active

film_aliases
  id, film_id, alias (normalizatsiya qilingan holda saqlanadi)

frames
  id, film_id, image_url, difficulty (easy/medium/hard), is_active

game_sessions
  id, user_id, status, total_score, correct_count, started_at, finished_at

rounds
  id, session_id, frame_id, attempt_count, hints_used (json),
  answer_text, is_correct, score, started_at, answered_at

weekly_scores
  user_id, week_start, score
```

### 6.5. API endpointlar (asosiy)

```
POST /api/auth              — initData tekshirish, JWT olish
POST /api/game/start        — yangi sessiya, birinchi kadr
POST /api/game/answer       — javob yuborish → natija + keyingi kadr
POST /api/game/hint         — yordam sotib olish
GET  /api/game/session/:id  — sessiya holati (reconnect uchun)
GET  /api/leaderboard       — ?period=weekly|all
GET  /api/me                — profil va statistika
```

---

## 7. Kontent (kadrlar bazasi)

### 7.1. Manba

Baza **qo'lda yig'iladi** (buyurtmachi tanlagan filmlar). Kadr tayyorlash mezonlari:

- JPEG/WebP, kamida 1280×720, fayl hajmi ≤ 300 KB (WebP'ga siqiladi).
- Kadrda film nomi, subtitr, kanal logotipi bo'lmasligi kerak.
- Sahna filmni tanib olishga imkon berishi kerak, lekin javob «yozib qo'yilmagan» bo'lishi kerak.

### 7.2. Admin vositasi

MVP uchun: strukturalangan JSON/CSV fayl + rasm papkasi, import skripti bilan bazaga yuklanadi:

```json
{
  "title_original": "Titanic",
  "title_uz": "Titanik",
  "title_ru": "Титаник",
  "year": 1997,
  "genre": "drama",
  "aliases": ["titanic", "titanik", "титаник"],
  "frames": [
    { "file": "titanic_01.jpg", "difficulty": "easy" }
  ]
}
```

Keyingi bosqichda: oddiy veb admin-panel (kadr qo'shish/o'chirish, statistika).

### 7.3. Boshlang'ich hajm

MVP uchun kamida **50 ta film, 100 ta kadr** (har filmga 1–3 kadr). Bir hafta faol o'ynashga yetadi; keyin baza doimiy to'ldirib boriladi.

### 7.4. Mualliflik huquqi eslatmasi

Film kadrlari mualliflik huquqi bilan himoyalangan material hisoblanadi. Viktorina maqsadida bitta kadr ishlatish ko'p yurisdiksiyalarda past riskli deb qaraladi, lekin bu yuridik maslahat emas — ommaviy monetizatsiya rejalashtirilsa, huquqshunos bilan maslahatlashish tavsiya etiladi.

---

## 8. Ishlab chiqish bosqichlari

| Bosqich | Ish | Natija |
|---|---|---|
| 1 | Loyiha skeleti: monorepo, frontend + backend + Docker | Ishga tushadigan bo'sh ilova |
| 2 | Telegram auth (initData → JWT), users jadvali | Login ishlaydi |
| 3 | Baza sxemasi + kontent import skripti | 10 ta test-film bazada |
| 4 | O'yin logikasi: sessiya, raund, javob tekshirish (fuzzy + alias) | O'ynash mumkin |
| 5 | Ochko, streak, yordamlar, taymer | To'liq mexanika |
| 6 | UI polish: animatsiyalar, natija ekranlari, i18n (uz/ru) | Tayyor interfeys |
| 7 | Liderlar jadvali (haftalik/umumiy) | Reyting ishlaydi |
| 8 | Anti-cheat, rate limiting, testlar | Barqaror versiya |
| 9 | Deploy: VPS, HTTPS, BotFather'da mini-app ulash | Prodakshn |
| 10 | 50 film / 100 kadr kontent yuklash | Launch! 🚀 |

---

## 9. Qabul qilish mezonlari (MVP)

- [ ] Mini App Telegram ichida ochiladi va auth ishlaydi
- [ ] 10 raundlik sessiya to'liq o'ynaladi
- [ ] Yozma javob alias + fuzzy matching bilan to'g'ri tekshiriladi
- [ ] Lotin ham kirill yozuvida javob qabul qilinadi
- [ ] Yordamlar ishlaydi va ochkodan ayiriladi
- [ ] Liderlar jadvali (haftalik va umumiy) to'g'ri ko'rsatiladi
- [ ] Interfeys uz/ru tillarida to'liq ishlaydi
- [ ] To'g'ri javobni frontend'dan olish imkonsiz (anti-cheat)
- [ ] Dark/light theme'da to'g'ri ko'rinadi
