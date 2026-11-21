# Project: Gym brat reel "Ozişda vs samirişda" (2026-11-21)

- On 2026-11-21 the user put new footage in the same Google Drive folder (subfolder "Gym brat": 9 standing talking-head clips, 4032x3024 .mov rotated −90°, the same phonk track and reference video) and asked for a new reel "in the same style, but even better".
- On 2026-11-21 the user gave the script as a short Cyrillic list: Ozişda vs samirişda — Geyner: samirişda; L-karnitin: ozişda; BCAA: ikkalasida; Kreatin: ozişda gidroxlorid, samirişda monogidrat; Yoximbe: ozişda; Protein: oddiy samirişda, ozişda izolyat. The list is spoken in clip C644; C636, C637, C641, C639 explain geyner, L-karnitin, BCAA and protein; C642 is the CTA; C633 and C638 are false starts.
- Whisper large-v3 handled this Khorezm speech poorly (it translated two clips into English despite `-l uz`); takes were identified by re-running whisper on short slices and by energy islands. Captions keep the speaker's wording in Uzbek Latin with ş ç ö ğ (for example "Samirjakdam, oriqlijakdam içsa böladi").
- Code: `tools/gym-brat/` (see its README). Same look as the Atlet reel v5; new: OZIŞ vs SAMIRIŞ tracker pills with counters, verdict chips carried by the dumbbell guide, info chips beside the head, full-screen summary table over the CTA, ElevenLabs SFX pack regenerated (11 sounds).
- v1, rendered 2026-11-21: 38.4 s, 18 segments, music drop 1 on "Geyner" and drop 2 near "izolyat", −15 LUFS. Outputs: `videos/Gym_brat_reel_v1.mp4`, `videos/Gym_brat_cover.jpg`, `videos/Gym_brat_izoh.txt`.
- Open as of 2026-11-21: the user's verdict on v1; the speaker should check the caption wording, especially the C639 line ("Kunlik oqsilni töldirib...", read from a poor transcript) and the CTA.

Related: [Atlet reel](project-atlet-reel-2026-11-15.md), [safe zones](preference-safe-zones.md), [alphabet](preference-uzbek-alphabet.md).
