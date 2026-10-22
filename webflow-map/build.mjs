// Builds one store-locations map per brand from the shared engine.
//   src/map.js + src/base.css          → shared engine and layout
//   brands/<id>/brand.mjs              → Sheet, columns, texts, pin sizes, map tint, script URL
//   brands/<id>/theme.css              → colors and fonts
//   brands/<id>/pin.svg                → pin shape (paths use .edm-pin-1 / .edm-pin-2)
//   brands/<id>/locations.json         → bundled store list (shown first, fallback if the Sheet fails)
//   brands/<id>/preview.html           → local test page; {{MAP}} is replaced by the map
// Output per brand:
//   public/<id>-map.js                 → hosted file (served by GitHub Pages)
//   paste/<id>/EMBED.html              → the single Embed pasted in Webflow
//   paste/<id>/preview.html            → serve webflow-map/ and open /paste/<id>/preview.html
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { minifySync } from "vite-plus";

const dir = new URL(".", import.meta.url);
const read = (p) => readFileSync(new URL(p, dir), "utf8");

const minifyCss = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();

async function buildBrand(id) {
  // Brand configs are ES modules so they can carry comments.
  const brand = (await import(new URL(`brands/${id}/brand.mjs`, dir).href)).default;
  if (brand.id !== id) throw new Error(`brands/${id}/brand.mjs has id "${brand.id}"`);

  const locations = JSON.parse(read(`brands/${id}/locations.json`));
  for (const l of locations) {
    for (const k of ["name", "address", "orderUrl"]) {
      if (!l[k]) throw new Error(`[${id}] Missing ${k} for ${JSON.stringify(l)}`);
    }
    if (!(l.lat > 24 && l.lat < 50 && l.lng > -125 && l.lng < -66))
      throw new Error(`[${id}] Bad coordinates for ${l.name}`);
  }
  const fallback = locations.map((l) => [l.name, l.address, l.lat, l.lng, l.orderUrl]);

  const svg = read(`brands/${id}/pin.svg`);
  const pin = {
    viewBox: svg.match(/viewBox="([^"]+)"/)[1],
    paths: svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>[\s\S]*$/g, "").trim(),
  };

  const css = minifyCss(read("src/base.css") + "\n" + read(`brands/${id}/theme.css`));
  const source = read("src/map.js")
    .replace("__BRAND__", () => JSON.stringify(brand))
    .replace("__CSS__", () => JSON.stringify(css))
    .replace("__FALLBACK__", () => JSON.stringify(fallback))
    .replace("__PIN__", () => JSON.stringify(pin));
  const bundle = minifySync(`${id}-map.js`, source).code.trim();
  writeFileSync(
    new URL(`public/${id}-map.js`, dir),
    `/* ${brand.name} locations map */\n${bundle}\n`,
  );

  const container = `<div id="${id}-map"></div>`;
  const embed = `${container}\n<script src="${brand.scriptUrl}" defer></script>`;
  mkdirSync(new URL(`paste/${id}/`, dir), { recursive: true });
  writeFileSync(new URL(`paste/${id}/EMBED.html`, dir), embed + "\n");
  writeFileSync(
    new URL(`paste/${id}/preview.html`, dir),
    read(`brands/${id}/preview.html`).replace(
      "{{MAP}}",
      `${container}\n    <script src="../../public/${id}-map.js" defer></script>`,
    ),
  );

  console.log(
    `${id.padEnd(10)} public/${id}-map.js ${(bundle.length / 1024).toFixed(1)} KB, ` +
      `${fallback.length} fallback stores, embed ${embed.length} chars`,
  );
}

const only = process.argv[2];
const ids = readdirSync(new URL("brands/", dir), { withFileTypes: true })
  .filter((d) => d.isDirectory() && (!only || d.name === only))
  .map((d) => d.name);
if (!ids.length) throw new Error(only ? `No brand "${only}" in brands/` : "No brands found");

mkdirSync(new URL("public/", dir), { recursive: true });
if (!only) rmSync(new URL("paste/", dir), { recursive: true, force: true });
for (const id of ids) await buildBrand(id);
