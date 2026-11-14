# PODO MASTER — pedolog CRM (onlayn)

Pedolog markazi uchun tizim. Server bitta, unga planshet, telefon va kompyuterdan bir vaqtda kirish mumkin. Ma’lumotlar hamma qurilmada bir xil ko‘rinadi va 4–5 soniyada yangilanadi.

- **Server:** Node.js 22.13+ va SQLite. Tashqi kutubxona kerak emas, `npm install` ham shart emas.
- **Ma’lumotlar** `data/` papkasida saqlanadi: `podo.db` baza va `photos/` rasmlar.
- **Xavfsizlik:**
  - Parollar serverda scrypt bilan shifrlanadi.
  - Sessiya HttpOnly cookie'da saqlanadi.
  - Admin va resepshn huquqlari serverning o‘zida tekshiriladi.
  - 8 marta noto‘g‘ri parol kiritilsa, kirish 15 daqiqaga bloklanadi.
  - Barcha harakatlar jurnalga yoziladi.

## Birinchi kirish

| Login | Boshlang‘ich parol | Huquq |
|---|---|---|
| admin | `ADMIN_PASSWORD` qiymati, berilmasa `admin123` | To‘liq |
| resepshn | `1234` | Cheklangan |

Birinchi kirishda tizim parolni almashtirishni **majburiy** so‘raydi.

---

## 1-usul: VPS + Docker (tavsiya etiladi, HTTPS avtomatik)

Kerak bo‘ladi:
- Ubuntu 22.04 yoki 24.04 VPS (1 GB RAM yetadi).
- Domen, masalan `crm.podomaster.uz`. Uning DNS A-yozuvi server IP manziliga qaratilgan bo‘lishi kerak.

```bash
# 1. Docker o'rnatish
curl -fsSL https://get.docker.com | sh

# 2. Loyihani yuklash
git clone -b claude/pedolog-website-v5a9bo https://github.com/ixtiyoruc-eng/Cloud.git
cd Cloud/pedolog-crm

# 3. Sozlash
cp .env.example .env
nano .env        # DOMAIN=crm.podomaster.uz, ADMIN_PASSWORD=kuchli-parol

# 4. Ishga tushirish
docker compose up -d --build
```

Shundan keyin `https://crm.podomaster.uz` ochiladi. SSL sertifikatni Caddy o‘zi oladi va yangilab turadi.

Yangilash: `git pull && docker compose up -d --build`

## 2-usul: Docker'siz (Node.js + nginx)

```bash
# Node.js 22 o'rnatish
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
cd Cloud/pedolog-crm
ADMIN_PASSWORD=kuchli-parol PORT=3000 npm start
```

Doimiy ishlashi uchun systemd xizmati yarating (`/etc/systemd/system/podo.service`):

```ini
[Unit]
Description=PODO MASTER CRM
After=network.target
[Service]
WorkingDirectory=/opt/Cloud/pedolog-crm
Environment=PORT=3000 TZ=Asia/Tashkent TRUST_PROXY=1
ExecStart=/usr/bin/node --disable-warning=ExperimentalWarning server.js
Restart=always
User=www-data
[Install]
WantedBy=multi-user.target
```

nginx'da `proxy_pass http://127.0.0.1:3000;` qiling va `client_max_body_size 800m;` qo‘shing. HTTPS uchun `certbot --nginx` ishlating.

## Sozlamalar (muhit o‘zgaruvchilari)

| O‘zgaruvchi | Standart | Ma’nosi |
|---|---|---|
| `PORT` | 3000 | Server porti |
| `DATA_DIR` | `./data` | Baza va rasmlar papkasi |
| `TZ` | Asia/Tashkent | Vaqt zonasi (eslatma sanalari shunga qarab hisoblanadi) |
| `ADMIN_PASSWORD` | admin123 | Birinchi ishga tushirishdagi admin paroli |
| `DEMO` | 0 | `1` bo‘lsa, birinchi ishga tushishda namuna mijozlar qo‘shiladi |
| `TRUST_PROXY` | 1 | Nginx yoki Caddy orqasida ishlaganda haqiqiy IP va HTTPS'ni aniqlash uchun |
| `SESSION_DAYS` | 14 | Sessiya muddati |

## Zaxira nusxa

- **Tizim ichidan:** Sozlamalar → “Zaxira nusxa yuklab olish”. Barcha ma’lumot va rasmlar bitta `.json` faylga yoziladi. Shu fayldan “Zaxiradan tiklash” mumkin.
- **Serverda:** `data/` papkasini nusxalang. Masalan, har kecha cron orqali:
  `tar czf /backup/podo-$(date +%F).tgz -C /opt/Cloud/pedolog-crm data`

## Huquqlar

| Amal | Admin | Resepshn |
|---|---|---|
| Mijoz qo‘shish/tahrirlash, navbatga yozish, keldi/ketdi, rasm | ✓ | ✓ |
| Eslatmalar, smenani ochish/yopish | ✓ | ✓ |
| Bugungi hisobot | ✓ (summalar bilan) | ✓ (summalarsiz) |
| Istalgan kun hisoboti, tushum grafigi, smenalar tarixi | ✓ | — |
| O‘chirish (mijoz, yozuv, rasm) | ✓ | — |
| Yopilgan smenadagi to‘lovni o‘zgartirish | ✓ | — |
| Xodimlar, narxlar, sozlamalar, zaxira, jurnal | ✓ | — |
