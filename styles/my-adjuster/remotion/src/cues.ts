// All times = seconds on the source video (no cuts). VEND = video end, END = + end card.
import type {Block, Ico} from './Reel';
export const VEND = 82.6;
export const END = 86.2;
export const HANDLE = '@yevroprotokol_xorazm';
export const PHONE = '+998 91 858-28-28';
export const LOWER = {t0: 12.0, out: 15.6, name: 'Davlat Abdullayev', role: 'MY ADJUSTER · YEVROPROTOKOL'};

type K = 'small' | 'big' | 'serif' | 'white';
const L = (k: K, ...p: [string, number][]) => ({k, words: p.map(([w, t]) => ({w, t}))});
const B = (out: number, ...lines: ReturnType<typeof L>[]): Block => ({out, lines});

export const BLOCKS: Block[] = [
  // ---- mijoz savoli ----
  B(1.95, L('small', ['Davlat', 0.05], ['aka,', 0.3], ['yaqinda', 0.55]), L('big', ['AVARIYA', 0.96]), L('small', ['bo‘ldim', 1.34])),
  B(4.0, L('small', ['Kimdan', 1.98], ['pul', 2.55], ['chiqadi?', 2.75])),
  B(7.85, L('small', ['Tanishlarim:', 4.4], ['«Nega', 5.5]), L('big', ['YEVROPROTOKOL', 5.96]), L('small', ['qilmading?»', 6.87], ['deyishdi', 7.44])),
  B(9.45, L('small', ['Endi', 7.89], ['mendan', 8.34]), L('big', ['PUL', 8.72]), L('small', ['chiqadimi?', 8.92])),
  B(11.5, L('small', ['Nega', 9.5]), L('serif', ['yevroprotokol', 9.82]), L('small', ['qilmadik?', 10.73])),
  // ---- Davlat aka javobi ----
  B(13.95, L('small', ['Bizning', 12.67], ['sug‘urta', 13.05]), L('serif', ['kompaniyada', 13.38])),
  B(16.05, L('small', ['sug‘urta', 14.0], ['qildirsangiz', 14.3]), L('white', ['YEVROPROTOKOL', 15.32])),
  B(17.4, L('big', ['TEKIN', 16.14]), L('small', ['bo‘lar', 16.52], ['edi', 16.83])),
  B(21.05, L('small', ['Oddiygina', 19.36], ['shu', 19.86]), L('big', ['60', 20.26], ['MING', 20.57]), L('small', ['yoki', 21.0])),
  B(22.85, L('big', ['320', 21.29], ['MING', 21.72]), L('small', ['sug‘urta', 22.09], ['polisini', 22.35])),
  B(25.8, L('small', ['bizdan', 22.92], ['qildirsangiz', 23.56]), L('serif', ['shunday', 24.32], ['bo‘lardi', 25.24])),
  B(29.9, L('small', ['bizning', 27.78]), L('white', ['XIZMATLARIMIZ', 28.08]), L('big', ['TEKIN', 28.85]), L('small', ['bo‘lar', 29.18], ['edi', 29.46])),
  B(33.2, L('small', ['Joyida', 30.3]), L('big', ['YEVROPROTOKOL', 30.7]), L('small', ['rasmiylashtirilardi', 31.53])),
  B(36.55, L('small', ['Bu', 33.24], ['qonuniy:', 33.3], ['Vazirlar', 33.64]), L('serif', ['Mahkamasining', 34.12]), L('big', ['609-SONLI', 34.89]), L('small', ['qarori', 35.35], ['asosida', 35.94])),
  B(39.2, L('serif', ['rasmiylashtiriladi', 36.64]), L('small', ['yevroprotokollarimiz', 37.68])),
  B(41.3, L('small', ['Ikki', 39.27], ['tomon', 39.58]), L('big', ['KELISHUVI', 39.93]), L('small', ['asosida', 40.49])),
  B(43.3, L('small', ['o‘z', 42.0], ['aybiga', 42.2]), L('big', ['IQROR', 42.35]), L('small', ['bo‘lgan', 42.58], ['holatda', 42.81])),
  B(45.25, L('small', ['yevroprotokol', 43.32]), L('serif', ['rasmiylashtiriladi', 43.86])),
  // ---- mijoz: zarar ----
  B(49.25, L('small', ['Menga', 45.43], ['ham', 45.69], ['yetkazilgan', 45.9]), L('big', ['ZARARNI', 46.47]), L('small', ['sug‘urtadan', 47.06], ['undirsa', 47.65], ['bo‘ladimi?', 48.04])),
  // ---- javob ----
  B(53.2, L('small', ['Ha,', 49.38], ['yetkazilgan', 49.5]), L('white', ['ZARARNI', 49.75]), L('small', ['sug‘urta', 51.86], ['polisidan', 52.31])),
  B(55.95, L('small', ['jabrlanuvchiga', 53.3]), L('small', ['yetkazilgan', 54.12], ['zarar', 54.66]), L('serif', ['baholangach', 55.26])),
  B(56.95, L('big', ['28', 56.02], ['MLN', 56.29]), L('small', ['so‘mgacha', 56.5])),
  B(59.15, L('small', ['zarar', 57.06], ['qismi', 57.34]), L('big', ['QOPLANADI', 57.6])),
  B(61.25, L('small', ['Bundan', 59.24], ['tashqari,', 59.6]), L('serif', ['hozir', 60.16], ['ko‘chada', 60.51])),
  B(63.95, L('small', ['ayrim', 61.28]), L('big', ['CHALA', 62.98]), L('small', ['yevroprotokollar', 62.36], ['bor', 63.49])),
  B(65.95, L('small', ['Ulardan', 63.98]), L('white', ['ALDANIB', 64.34]), L('small', ['qolmaslik', 64.76], ['uchun', 65.48])),
  B(68.6, L('small', ['bemalol', 66.04]), L('big', ['BIZGA', 67.07]), L('small', ['murojaat', 67.39], ['qiling', 67.75])),
  B(71.0, L('big', ['24/7', 68.74]), L('serif', ['Xorazm', 69.28], ['bo‘ylab', 69.66]), L('small', ['xizmatdamiz', 70.36])),
  // ---- mijoz fikri ----
  B(74.5, L('small', ['Hech', 73.0], ['kimning', 73.1], ['boshiga', 73.3]), L('big', ['KULFAT', 73.76]), L('small', ['tushmasin', 74.11])),
  B(76.6, L('small', ['Agar', 74.58], ['shunday', 74.82]), L('serif', ['vaziyatga', 75.24]), L('small', ['tushib', 75.72], ['qolsangiz', 75.9])),
  B(78.75, L('small', ['Davlat', 76.76], ['akaga', 77.0]), L('big', ['BEMALOL', 77.2]), L('small', ['murojaat', 77.7], ['qiling', 78.08])),
  B(81.1, L('small', ['yoki', 78.84], ['pastdagi', 79.21]), L('white', ['RAQAMGA', 79.66]), L('small', ['qo‘ng‘iroq', 80.25], ['qiling', 80.6])),
  B(82.55, L('small', ['Yo‘llaringiz', 81.18]), L('serif', ['bexatar', 81.65], ['bo‘lsin', 81.91])),
];
// red strike-throughs (reference: crossed-out word)
BLOCKS[24].strike = {t: 63.4, line: 1};

export const TAGS = [
  {t0: 0.1, out: 11.4, text: 'MIJOZ SAVOLI'},
  {t0: 11.8, out: 44.9, text: 'MUTAXASSIS JAVOBI'},
  {t0: 45.3, out: 49.2, text: 'MIJOZ SAVOLI'},
  {t0: 49.4, out: 70.9, text: 'MUTAXASSIS JAVOBI'},
  {t0: 71.1, out: 82.4, text: 'MIJOZ FIKRI'},
];

export const ICONS: Ico[] = [
  {t0: 0.96, out: 1.95, x: 880, y: 1080, type: 'crash', rot: 8},
  {t0: 8.72, out: 9.45, x: 200, y: 1090, type: 'money'},
  {t0: 16.14, out: 17.4, x: 860, y: 1100, type: 'check', rot: 6},
  {t0: 22.09, out: 22.85, x: 200, y: 1090, type: 'doc'},
  {t0: 28.85, out: 29.9, x: 880, y: 1060, type: 'check', rot: 8},
  {t0: 34.89, out: 36.55, x: 190, y: 1040, type: 'shield'},
  {t0: 46.47, out: 49.25, x: 880, y: 1070, type: 'car', rot: 8},
  {t0: 57.6, out: 59.15, x: 190, y: 1090, type: 'money'},
  {t0: 62.98, out: 63.95, x: 880, y: 1090, type: 'warn', rot: 8},
  {t0: 67.07, out: 68.6, x: 200, y: 1090, type: 'arrow', rot: -8},
  {t0: 68.74, out: 71.0, x: 880, y: 1080, type: 'clock', rot: 6},
  {t0: 79.66, out: 81.1, x: 190, y: 1080, type: 'phone'},
];

// [start, end, scale] smooth punch-ins on key moments
export const PUNCH: [number, number, number][] = [
  [0.9, 2.0, 1.06], [8.6, 9.5, 1.07], [16.0, 17.5, 1.08], [20.2, 22.9, 1.05], [28.8, 30.0, 1.08],
  [34.8, 36.6, 1.06], [46.4, 49.2, 1.06], [56.0, 59.2, 1.1], [62.9, 64.0, 1.06], [68.7, 71.0, 1.07],
  [73.7, 74.6, 1.06], [79.6, 81.2, 1.06],
];
