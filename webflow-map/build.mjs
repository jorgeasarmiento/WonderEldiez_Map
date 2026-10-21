// Builds the El Diez locations map.
//   webflow-map/public/eldiez-map.js  → hosted file (served by jsDelivr from GitHub)
//   webflow-map/paste/EMBED.html      → the single Embed pasted in Webflow
//   webflow-map/paste/preview.html    → local test page (serve webflow-map/ and open /paste/preview.html)
// Store data lives in the Google Sheet; locations.json is only the fallback / coordinate table.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { minifySync } from "vite-plus";

const dir = new URL(".", import.meta.url);
const read = (p) => readFileSync(new URL(p, dir), "utf8");

const SHEET_ID = "1TzDvvtenMzvmn6xlU-kiehZotL1nPmWW2yoGZYJ09gk";
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const CDN_URL =
  "https://cdn.jsdelivr.net/gh/jorgeasarmiento/WonderEldiez_Map@main/webflow-map/public/eldiez-map.js";

const locations = JSON.parse(read("locations.json"));
for (const l of locations) {
  for (const k of ["name", "address", "orderUrl"]) {
    if (!l[k]) throw new Error(`Missing ${k} for ${JSON.stringify(l)}`);
  }
  if (!(l.lat > 24 && l.lat < 50 && l.lng > -125 && l.lng < -66))
    throw new Error(`Bad coordinates for ${l.name}`);
}
const fallback = locations.map((l) => [l.name, l.address, l.lat, l.lng, l.orderUrl]);

const css = read("src/map.css")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();

const source = read("src/map.js")
  .replace("__CSS__", () => JSON.stringify(css))
  .replace("__FALLBACK__", () => JSON.stringify(fallback))
  .replace("__SHEET__", () => JSON.stringify(SHEET_CSV));
const bundle = minifySync("eldiez-map.js", source).code.trim();

mkdirSync(new URL("public/", dir), { recursive: true });
writeFileSync(new URL("public/eldiez-map.js", dir), `/* El Diez locations map */\n${bundle}\n`);

const embed = `<div id="eldiez-map"></div>
<script src="${CDN_URL}" defer></script>`;

rmSync(new URL("paste/", dir), { recursive: true, force: true });
mkdirSync(new URL("paste/", dir), { recursive: true });
writeFileSync(new URL("paste/EMBED.html", dir), embed + "\n");

// Preview: page chrome similar to eldiezmexican.com, with the site's own fonts.
const fontCdn = "https://cdn.prod.website-files.com/698a4478458090608a9619fd/";
const section = (html) =>
  `<section style="padding:60px 40px;background:#FDF2EA;font-family:Taybenditos,sans-serif;color:#008FF5">${html}</section>`;
writeFileSync(
  new URL("paste/preview.html", dir),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>El Diez Map Preview</title>
<style>
@font-face{font-family:Taybenditos;src:url(${fontCdn}698bcb2a13df46b7e0b992c2_TAYBenditos.otf) format("opentype")}
@font-face{font-family:"Salsa Grande";src:url(${fontCdn}698bcb2a228adc2e2917e687_Salsa-Grande-Regular.otf) format("opentype")}
body{margin:0;background:#FDF2EA}
</style></head><body>
${section('<div style="font-size:64px;line-height:1">MUNCH FIRST,<br>TALK LATER!</div><div style="font-size:30px;color:#FF151A;margin-top:12px">DELIVERY OR PICKUP AT WONDER</div>')}
<div id="eldiez-map"></div>
<script src="../public/eldiez-map.js" defer></script>
${section('<div style="font-size:40px;color:#FF151A">OR FIND US AT:</div>')}
${section('<div style="height:60vh"></div>')}
</body></html>
`,
);

console.log(
  `public/eldiez-map.js  ${(bundle.length / 1024).toFixed(1)} KB, ${fallback.length} fallback stores`,
);
console.log(`paste/EMBED.html      ${embed.length} chars`);
