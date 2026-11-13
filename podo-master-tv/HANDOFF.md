# Podo Master — klinika televizori uchun motion-design video

Mijoz: **Podo Master / @podolog_urganch** (Xorazm, Urganch), podolog klinikasi.
Video kutish zalidagi televizorda to'xtovsiz aylanadi: 1920×1080, 60 fps, loop (oxiri boshiga uzilishsiz ulanadi).

## Joriy holat (v2, 97 s)
`index.html` — butun animatsiya. Deterministik `render(t)` funksiyasi bor, t = 0..97 s.
Uslub: foydalanuvchi bergan 2-referens (Apple uslubidagi kinetik matn: so'zlar blur bilan birma-bir chiqadi,
so'zlar orasida 3D ikonka, 3D tunnel, qorong'i shisha kartochkalar), faqat "pedolog" ranglarida:
#00C1C0, #007D79, #E0F7F7, matn #1d292d / #333333.

| Vaqt (s) | Sahna |
|---|---|
| 0–4.6 | Logo (boshlanish = tugash kadri, loop uchun) |
| 4.2–12.9 | "Oyoq va tirnoq [ikonka] salomatligi" → "Mutaxassis qo'lida — ishonch bilan." |
| 12.6–26 | 3D tunnel + 3 xizmat |
| 25.7–35.2 | Qorong'i sahna: "Sizda shu belgilar bormi?" + shisha kartochkalar |
| 34.9–52 | Oldin/Keyin: 3 juft rasm 3D kartochkada aylanib almashadi |
| 52–74 | "Muruvvat" saxovat uyi videosi (muruvvat.mp4, ~20 s lavhalar), telefon ramkasida |
| 74–80.5 | 14 700+ obunachi, shisha plitkalar to'ri |
| 80.2–90.4 | Kontaktlar: +998 50 103 40 45, Telegram, Instagram, Xorazm, Urganch |
| 90.2–97 | Logo qayta yig'iladi |

Ichkarida: `render(t)` 52–74 oralig'ini muruvvat sahnasi uchun ajratadi; asosiy sahnalar `mt = t-22` bilan ishlaydi (t ≥ 74 da).

## Foydalanuvchi qarorlari
- Ixlos opaning rasmi videoda **bo'lmasin** (olib tashlangan). Ism kerak bo'lsa "Ixlos" deb yoziladi, "Ixlos opa" emas.
- Logo bo'lsin; video silliq, zeriktirmaydigan bo'lsin; oldin/keyin rasmlari bo'lsin.
- Muruvvat videosi o'rtaga qo'shildi.
- ElevenLabs ovozi rejada: diktor matnini yozish, foydalanuvchi audio faylni beradi. API kalitni kodga yoki repoga YOZMANG.

## Render
Kerak: Python + Playwright, Google Chrome, ffmpeg.
- `scripts/render_chunk.py A B 60 out.mp4` — A..B soniyani 60 fps MP4 ga chiqaradi (yo'llarni o'zingizning papkangizga moslang).
- `scripts/render_all.sh` — 2 parallel navbat bilan hamma bo'laklar.
- `scripts/music.py` — sintez qilingan yumshoq fon musiqasi + SFX (97 s, loop). Keyin `loudnorm=I=-18`.
- Yig'ish: concat bo'laklar + audio → `-c:v copy -c:a aac -b:a 256k -movflags +faststart`.
- `scripts/test_frames.py t1 t2 ...` — tekshirish uchun alohida kadrlar.

`old_v1_light.html` — oldingi (1-uslub) versiya, kerak bo'lsa.
