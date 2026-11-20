// Captura cada proyecto de src/data/projects.json y guarda en src/shots:
//   <slug>.webp         portada (1280×800)
//   <slug>-full.webp    página completa de escritorio
//   <slug>-mobile.webp  página completa en teléfono
//   <slug>-phone.webp   parte alta en teléfono (tarjeta de la baraja)
//
// Uso:  node scripts/shots.mjs            (todos)
//       node scripts/shots.mjs potted faded   (solo esos slugs)
//
// Necesita playwright y sharp:  npm install --no-save playwright sharp
//                               npx playwright install chromium
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url);
const OUT = fileURLToPath(new URL('src/shots/', ROOT));
const projects = JSON.parse(await readFile(new URL('src/data/projects.json', ROOT), 'utf8'));
const only = process.argv.slice(2).filter(Boolean);
// Los proyectos con "shotSkip": true solo se capturan si se piden por su slug.
const list = only.length ? projects.filter((p) => only.includes(p.slug)) : projects.filter((p) => !p.shotSkip);

// Botones típicos de ventanas de edad, cookies y avisos.
const GATE =
  "^(hell |oh |heck )?(yes|sí|si|enter|entrar|i am (over )?(18|21)|i'm (over )?(18|21)|i am of legal age|yes,? i am|over (18|21)|21\\+|18\\+|i agree|agree|accept|accept all|allow all|aceptar|acepto|confirm|continue|continuar|got it|ok|soy mayor|tengo)";

// Para webs cuyo aviso no se puede cerrar con un clic: oculta lo que tape la pantalla.
async function hideOverlays(page) {
  await page
    .evaluate(() => {
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.position !== 'fixed' && el.tagName !== 'DIALOG') continue;
        const r = el.getBoundingClientRect();
        if (r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.8) el.style.setProperty('display', 'none', 'important');
      }
      for (const el of [document.documentElement, document.body]) {
        el.style.setProperty('overflow', 'visible', 'important');
        el.style.setProperty('height', 'auto', 'important');
      }
    })
    .catch(() => {});
}

async function dismiss(page, extra = [], gate = 'click') {
  if (gate === 'hide') return hideOverlays(page);
  for (const sel of extra) {
    try {
      await page.locator(sel).first().click({ timeout: 2500 });
      await page.waitForTimeout(700);
    } catch {
      /* el selector no apareció */
    }
  }
  for (let round = 0; round < 3; round++) {
    const clicked = await page
      .evaluate((src) => {
        const re = new RegExp(src, 'i');
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.top < innerHeight && r.bottom > 0;
        };
        // "Superpuesto": dentro de un diálogo o de algo fijo que no sea la cabecera del sitio.
        const inOverlay = (el) => {
          let fixed = false;
          for (let n = el; n && n !== document.body; n = n.parentElement) {
            if (n.tagName === 'HEADER' || n.tagName === 'NAV') return false;
            if (n.tagName === 'DIALOG' || n.getAttribute('role') === 'dialog') fixed = true;
            if (getComputedStyle(n).position === 'fixed') fixed = true;
          }
          return fixed;
        };
        // Casillas de confirmación (aunque el input real esté oculto tras uno dibujado).
        for (const box of document.querySelectorAll('input[type=checkbox], input[type=radio]')) {
          if (inOverlay(box) && !box.checked && !box.disabled) box.click();
        }
        for (const box of document.querySelectorAll('[role=checkbox][aria-checked=false], [role=switch][aria-checked=false]')) {
          if (inOverlay(box) && visible(box)) box.click();
        }
        for (const el of document.querySelectorAll('button, a, [role=button], input[type=button], input[type=submit]')) {
          const text = (el.innerText || el.value || '').trim();
          if (!text || text.length > 40 || !re.test(text) || !visible(el) || !inOverlay(el)) continue;
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
          el.click();
          return `${text}${el.tagName === 'A' && el.getAttribute('href') ? ` → ${el.getAttribute('href')}` : ''}`;
        }
        return null;
      }, GATE)
      .catch(() => null);
    if (!clicked) break;
    console.log(`    · pulsado: "${clicked}"`);
    await page.waitForTimeout(1000);
  }
}

async function settle(page, p) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await dismiss(page, p.shotClicks, p.shotGate);
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  // Recorre la página para disparar imágenes diferidas y animaciones de entrada.
  await page
    .evaluate(async () => {
      const step = innerHeight * 0.8;
      const max = Math.min(document.documentElement.scrollHeight, 9000);
      for (let y = 0; y < max; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 180));
      }
      scrollTo(0, 0);
    })
    .catch(() => {});
  await page.waitForTimeout(1200);
  await dismiss(page, [], p.shotGate);
  console.log(`    página final: ${page.url()} · "${(await page.title().catch(() => '')).slice(0, 70)}"`);
}

async function pageHeight(page, cap) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight).catch(() => 0);
  return Math.max(400, Math.min(h || 0, cap));
}

async function capture(browser, p) {
  console.log(`\n▸ ${p.name}  ${p.url}`);
  // Escritorio
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US' });
  try {
    const page = await desk.newPage();
    const res = await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const status = res?.status() ?? 0;
    console.log(`    estado ${status}`);
    if (status >= 400) throw new Error(`el sitio respondió ${status}`);
    await settle(page, p);
    const hero = await page.screenshot({ type: 'png' });
    await sharp(hero).resize(1280, 800, { fit: 'cover', position: 'top' }).webp({ quality: 80 }).toFile(`${OUT}${p.slug}.webp`);
    const h = await pageHeight(page, 7200);
    const full = await page.screenshot({ type: 'png', fullPage: true, clip: { x: 0, y: 0, width: 1440, height: h } });
    await sharp(full).resize({ width: 1280 }).webp({ quality: 70 }).toFile(`${OUT}${p.slug}-full.webp`);
    console.log(`    ✓ escritorio (${h}px de alto)`);
  } finally {
    await desk.close();
  }
  // Teléfono
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  try {
    const page = await phone.newPage();
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await settle(page, p);
    const h = await pageHeight(page, 844 * 5);
    const shot = await page.screenshot({ type: 'png', fullPage: true, clip: { x: 0, y: 0, width: 390, height: h } });
    await sharp(shot).resize({ width: 780 }).webp({ quality: 70 }).toFile(`${OUT}${p.slug}-mobile.webp`);
    // Recorte de la parte alta para la baraja de teléfono (ligero: se cargan varios a la vez).
    await sharp(shot)
      .extract({ left: 0, top: 0, width: 780, height: Math.min(1131, h * 2) })
      .resize({ width: 660 })
      .webp({ quality: 80 })
      .toFile(`${OUT}${p.slug}-phone.webp`);
    console.log('    ✓ teléfono');
  } finally {
    await phone.close();
  }
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const failed = [];
for (const p of list) {
  try {
    await capture(browser, p);
  } catch (err) {
    failed.push(p.slug);
    console.log(`    ✗ ${String(err.message || err).split('\n')[0]}`);
  }
}
await browser.close();
console.log(`\nListo: ${list.length - failed.length} de ${list.length} proyectos capturados.`);
if (failed.length) console.log(`Sin captura (se mostrará la portada generada): ${failed.join(', ')}`);
