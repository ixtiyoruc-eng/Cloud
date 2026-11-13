# PODO MASTER — pedolog CRM

Planshet uchun pedolog markazi tizimi. Bitta fayl: `index.html` — brauzerda oching (internet faqat shrift uchun kerak).

## Kirish
| Login | Parol | Huquq |
|---|---|---|
| admin | admin123 | To'liq (administrator) |
| resepshn | 1234 | Cheklangan (resepshn) |

Birinchi kirishdan keyin **Sozlamalar → Xodimlar** bo'limida parollarni almashtiring.

## Imkoniyatlar
- **Bugun** — navbatdagi / muolajadagi mijoz, uning tashxisi va oxirgi muolajasi; qabul vaqti kelganda ovozli oyna chiqadi.
- **Jadval** — kunlik qabul jadvali, bo'sh soatga bosib yozish.
- **Mijozlar bazasi** — telefon, tashxis (diabet/allergiya ogohlantirishi), tashriflar tarixi.
- **Oldin / keyin rasmlar** — planshet kamerasidan; surgich yoki yonma-yon solishtirish.
- **Eslatmalar** — muolaja yakunida 3/7/14/21/30 kun tanlanadi, kuni kelganda mijoz ro'yxatga tushadi; tayyor SMS matni.
- **Kunlik hisobot** — kim qachon keldi, qachon ketdi, davomiyligi, to'lov.
- **Smena** — ochish, kassani sanab yopish, farqni ko'rsatish; admin uchun smenalar tarixi.

## Ma'lumotlar
Hamma narsa shu qurilma brauzerida saqlanadi (localStorage + IndexedDB). Har hafta **Sozlamalar → Zaxira nusxa** oling.
Bir nechta qurilmada umumiy baza va server tomonida himoyalangan parollar uchun backend kerak bo'ladi.
