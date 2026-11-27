// usage: node stills.mjs OUT_DIR t1 t2 ... (seconds) — one bundle, many stills at half scale
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [out, ...ts] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({serveUrl, id: 'GymBrat', browserExecutable});
for (const t of ts) {
  await renderStill({serveUrl, composition, frame: Math.round(Number(t) * 30), output: `${out}/s_${t}.png`, scale: 0.5, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  console.log('still', t);
}
