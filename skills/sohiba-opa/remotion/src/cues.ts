// Timeline of the edited talk (seconds). SEG = start of each kept segment + final end; END = SEG end + ~2 s outro.
export const SEG = [0, 6.125, 9.125, 15.5417, 25.7917, 30.1667, 34.6667, 38.7083, 44.5, 46.3333];
export const END = 48.4;
export const FACE: [number, number][] = [[0.483,0.40],[0.504,0.38],[0.481,0.357],[0.502,0.383],[0.49,0.375],[0.493,0.379],[0.493,0.378],[0.478,0.371],[0.515,0.362]];
export const ZOOM = [1, 1, 1.12, 1, 1.12, 1, 1.1, 1, 1];
export const CUES = {
  layout: [[0,'card'],[2.35,'full'],[6.0,'hidden'],[9.0,'full'],[15.45,'card'],[25.7,'full'],[30.1,'card'],[34.6,'full'],[40.6,'hidden'],[44.3,'cardS'],[46.5,'hidden']],
  theme: [[0,0],[5.9,1],[29.9,0],[40.4,1],[44.1,0]],
  a1: [[{w:'Ayollar',t:0.05},{w:'bizga',t:0.73}],[{w:'dam olgani',t:1.26,hl:true}],[{w:'keladi',t:1.79}]], a1out: 2.25,
  a2chips: [{t0:3.0,x:270,y:300,rot:-7,text:'Uy ishlari'},{t0:3.35,x:800,y:430,rot:6,text:'Tashvishlar'},{t0:3.75,x:820,y:1130,rot:-5,text:'Charchoq'}], a2out: 5.9,
  caps: [
    {lines:[[{w:'Uydagi',t:2.55}],[{w:'tashvishlarini',t:3.05,hl:true}]],out:3.9},
    {lines:[[{w:'hammasini',t:3.96}],[{w:'unutish uchun',t:4.62,hl:true}]],out:5.85},
    {lines:[[{w:'Ko’p',t:9.2},{w:'kosmetologlar',t:9.5}]],out:10.45},
    {lines:[[{w:'mijozning',t:10.54}],[{w:'tashqi ko’rinishiga',t:11.42,hl:true}]],out:13.05},
    {lines:[[{w:'kiyimiga',t:13.13,hl:true},{w:'qarab',t:13.99}],[{w:'muomala qiladi',t:14.44}]],out:15.3},
    {lines:[[{w:'zo’r muomala',t:28.22,hl:true}],[{w:'qildim',t:28.88}]],out:29.95},
    {lines:[[{w:'Nima',t:38.95},{w:'demoqchiman?',t:39.24}]],out:40.45},
  ],
  b: [[{w:'O’zini',t:6.02}],[{w:'ayol',t:6.55,hl:true}],[{w:'his etish uchun',t:7.25}]], bout: 8.8,
  d: [
    {lines:[[{w:'Oldimga',t:16.0},{w:'bir',t:17.2}],[{w:'mijoz',t:17.51,hl:true},{w:'keldi',t:18.11}]],out:18.85},
    {lines:[[{w:'oddiy',t:18.95}],[{w:'qishloq ayoli',t:19.43,hl:true}]],out:21.15},
    {lines:[[{w:'egnida',t:21.24}],[{w:'oddiy kiyim',t:22.3,hl:true}]],out:25.5},
  ],
  dchips: [{t0:22.16,x:215,y:330,rot:-8,text:'Ro’mol',dark:false,size:54},{t0:23.03,x:860,y:640,rot:7,text:'Ko’ylak',dark:false,size:54},{t0:23.64,x:235,y:1040,rot:-5,text:'Ishton',dark:false,size:54}], dout: 25.5,
  ebub: [{t0:25.85,out:28.05,x:440,y:320,rot:-5,from:-600,text:'Kofe ichasizmi?'},{t0:27.05,out:28.2,x:650,y:500,rot:4,from:600,text:'Choy ichasizmi?'}],
  f: [
    {lines:[[{w:'Lekin',t:30.25}],[{w:'boy xotin',t:30.52,hl:true},{w:'ekan',t:31.18}]],out:31.9,y:1350,size:100},
    {lines:[[{w:'shunchaki',t:32.0}],[{w:'oddiy kiyimda',t:32.58,hl:true}]],out:34.4,y:1350,size:94},
  ],
  g: 35.55, gout: 38.45,
  h2: [[{w:'Tashqi',t:40.9}],[{w:'ko’rinishga',t:41.5},{w:'qarab',t:42.37}],[{w:'baho bermang',t:43.0,hl:true}]], h2out: 44.1,
  i: [[{w:'Qalb',t:44.5,hl:true},{w:'go’zal',t:44.92}],[{w:'bo’lishi kerak',t:45.34}]],
};
