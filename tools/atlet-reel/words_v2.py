# Caption words v2: speaker's wording (user's ground-truth script, Khorezm dialect) in Uzbek Latin,
# word onsets in SOURCE seconds (whisper large-v3 -l uz, unprompted + script-prompted runs,
# refined by hand against the 50 ms RMS envelope). Where the audio has words the script does not,
# the audio wins (flagged with AUDIO). Alphabet pass (sh->ş, ch->ç, o'->ö, g'->ğ) is applied later.
WORDS = {
 "c1": [("Zala",0.94),("borasiz,",1.21),("lekin",1.94),("nimani",2.16),("sport",2.43),("pitaniye",2.74),  # AUDIO: 'sport pitaniye'
        ("olishni",2.95),("bilmisizmi?",3.37),
        ("Kreatin,",3.90),("geyner,",4.62),("protein.",5.22),   # AUDIO order (script: protein, kreatin, geyner)
        ("Qarang,",6.05),("men sizga",6.33),("munu",6.62),("tushuntirib",6.75),("baraman,",7.09),  # AUDIO (script: 'Qarang, aytib baraman')
        ("qaysini",7.41),("nechun",7.65),("ichishni.",7.89)],
 "c2": [("Birinchi",1.61),("navbatda",1.89),("protein.",2.47),("Protein",3.05),("o'zi",3.46),("bu",3.62),("oddiy",3.74),("oqsil:",4.10),
        ("tvorogda,",4.57),("tuxumda,",5.32),("tovuqda",6.10),("mavjud.",6.58),
        ("Kima",13.75),("dog'ri",13.90),("galadi",14.23),("desa:",14.58),("o'g'ilmi,",15.02),("qizmi,",15.56),("samirjakmi,",15.86),
        ("orriqlijakmi,",16.80),("farqi",18.03),("yo'q.",18.20),
        ("Kunlik",29.43),("oqsil",29.85),("to'ldirish",30.10),("uchun,",30.68),
        ("Agar",39.80),("siz",40.11),("haftasi",40.29),("3",40.86),("marta",40.99),("zala",41.30),("borsangiz,",41.55),
        ("siza",42.45),("har",42.52),("bir",42.63),("kilogizga",42.78),("2",43.15),("gramdan",43.30),("oqsil",43.63),("garak.",43.82),
        ("Agar",44.30),("siz",44.56),("oqsilni",44.80),("ovqatdan",45.17),("olib",45.56),("bilaman",45.80),("desangiz,",46.25),
        ("siza",46.77),("protein",47.18),("shart",47.65),("amas.",47.95),
        ("Agar",55.76),("siz",56.12),("ovqatdan",56.36),("ololmasangiz,",56.81),("o'zingiza",57.76),("garakli",58.08),("oqsil uchun",58.52),
        ("siza",59.09),("protein",59.31),("shart.",59.61)],
 "c3": [("Ikkinchisi",3.83),("esa",4.25),("bu",4.53),("geyner.",4.79),("Geyner",5.35),("—",None),("oqsil,",5.78),("uglevod",6.24),("va",6.79),
        ("yog'la",6.93),("aralashmasi",7.28),("bo'ladi.",7.88)],
 "c4": [("Bu",0.95),("narsala",1.10),("ovqatda",1.40),("bor.",2.05),("Kima",2.50),("dog'ri",2.72),("galadi?",2.95),
        ("Orriq,",23.96),("ves",24.21),("olajak",24.49),("bo'b",24.70),("yurganla,",24.91),("ves",26.14),("olish",26.53),("uchun",26.70),
        ("ko'p",27.06),("yeyish",27.31),("garak,",27.48),("ko'p",28.06),("yeyish",28.28),("esa",28.65),("qiyin.",29.16),
        ("Shu",29.56),("vaxtda",29.92),("siza",30.22),("yordama",30.59),("suyuq",31.12),("ovqat,",31.80),("ya'ni",32.21),("geyner",32.77),
        ("garak",33.80),("bo'ladi.",34.27),
        ("Kunlik",49.56),("kaloriyani",49.82),("to'ldirasiz,",50.34),("va",51.03),("profitsitga",51.43),("chiqasiz,",51.95),("va",52.19),
        ("muskul,",52.60),("vazn",53.62),("olish",53.91),("bo'ladi.",54.28)],
 "c5": [("Uchinchisi",5.19),("esa",6.12),("kreatin.",6.32),("Kreatin",7.13),("kuch",7.28),("va",7.38),("samaradorlikni,",7.61),
        ("ya'ni",8.17),("chidamlilikni",8.45),("oshirish",9.13),("uchun",9.46),("ichiladi.",9.68),
        ("Kreatin",16.91),("nima",17.19),("ish",17.37),("atadi?",17.55),
        ("Kreatin",19.20),("ATF",20.23),("zaxirasini",20.45),("ko'paytiradi.",21.27),("Bu",22.00),("muskullarda",22.11),("glavniy",22.67),
        ("energiya",23.14),("manbayi",23.59),("bo'ladi.",24.03),("Kreatin",24.74),("oddiy",25.20),("go'shtda",25.82),("bor.",26.28),
        ("Kunlik",33.74),("5",34.18),("gram",34.46),("kreatinni",34.74),("olish uchun",35.20),("bir",35.60),("yarim",35.76),("kilo",36.02),
        ("go'sht",36.26),("yeyish",36.50),("garak",36.66),("bo'ladi.",37.01),
        ("O'zingiza",61.41),("garaklisini",61.82),("bilib",62.38),("olgan",62.70),("bo'lsangiz,",63.24),("videoga",63.53),("layk",63.71),
        ("bosing,",63.93),("Atlet.uz",64.35),("Xorazmga",64.83),("obuna",65.45),("bo'lib",65.72),("qo'ying,",66.06),
        ("hammangizni",66.43),("Atlet.uzda",66.81),("kutib",67.11),("qolamiz.",67.31)],
}
ACCENTS = {"protein","kreatin","geyner","kreatinni","oqsil","oqsilni","3","2","gramdan","5","gram","kilo","atf","energiya",
           "chidamlilikni","kaloriyani","profitsitga","muskul","shart","layk","obuna","pitaniye","farqi","suyuq","qiyin","glavniy"}

def new_alphabet(s):
    # user's rule: sh->ş, ch->ç, o'->ö, g'->ğ (+capitals); apostrophe between other letters -> ʼ (tutuq belgisi)
    for a, b in (("O'", "Ö"), ("o'", "ö"), ("G'", "Ğ"), ("g'", "ğ"), ("SH", "Ş"), ("Sh", "Ş"), ("sh", "ş"),
                 ("CH", "Ç"), ("Ch", "Ç"), ("ch", "ç")):
        s = s.replace(a, b)
    return s.replace("'", "ʼ")
