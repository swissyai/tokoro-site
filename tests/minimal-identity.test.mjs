import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../index.html", import.meta.url);
const cssPath = new URL("../styles.css", import.meta.url);
const scriptPath = new URL("../script.js", import.meta.url);
const headersPath = new URL("../_headers", import.meta.url);

test("the signature connects the fixed threshold directly to the wordmark", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(html, /class="terminal-label"/);
  assert.match(html, /class="threshold-bar"/);
  const signatureStart = html.indexOf('<div class="signature">');
  const signatureEnd = html.indexOf('<p class="tagline">');
  assert.ok(signatureStart >= 0 && signatureEnd > signatureStart, "connected signature wrapper is missing");
  const signature = html.slice(signatureStart, signatureEnd);
  const mark = signature.indexOf('class="threshold-mark"');
  const bar = signature.indexOf('class="threshold-bar"');
  const wordmark = signature.indexOf('id="tokoro-title"');
  assert.ok(mark >= 0 && mark < bar && bar < wordmark, "signature geometry is out of order");
  assert.match(html, /<h1 id="tokoro-title">TOKORO<\/h1>/);
  assert.match(html, /<p class="tagline">A place for local models\.<\/p>/);
  assert.match(html, /<p class="japanese-line" lang="ja">デジタルの自由を。<\/p>/);
  assert.match(html, /<span>GitHub<\/span>/);
  assert.equal((html.match(/<a\b/g) || []).length, 1);
});

test("scrambled feature text occupies a separate layer above the static field", async () => {
  const [html, css] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  const field = html.indexOf('class="world-canvas"');
  const text = html.indexOf('class="text-canvas"');
  const identity = html.indexOf('class="center-stage"');
  assert.ok(field >= 0 && field < text && text < identity, "canvas layer order is incorrect");
  assert.match(css, /\.world-canvas \{[\s\S]*?z-index: 0;/);
  assert.match(css, /\.text-canvas \{[\s\S]*?z-index: 1;[\s\S]*?background: transparent;/);
  assert.match(css, /\.center-stage \{[\s\S]*?z-index: 2;/);
});

test("the cursor only loads bottom-to-top and keeps fixed dimensions", async () => {
  const [html, css] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.doesNotMatch(css, /\.threshold-mark::after/);
  assert.doesNotMatch(css, /@keyframes katana-cut/);
  assert.doesNotMatch(css, /@keyframes door-carve/);
  assert.doesNotMatch(html, /class="threshold-cursor"/);
  assert.match(css, /@keyframes cursor-load/);
  assert.match(css, /\.threshold-mark \{[\s\S]*?width: 4\.5rem;[\s\S]*?height: 6\.75rem;/);
  assert.doesNotMatch(css, /\.threshold-mark \{[\s\S]*?width: clamp\(/);
});

test("spacing, Japanese typography, and CTA occlusion follow explicit contracts", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /--space-1: 0\.25rem;/);
  assert.match(css, /--space-2: 0\.5rem;/);
  assert.match(css, /--space-3: 0\.75rem;/);
  assert.match(css, /--space-4: 1rem;/);
  assert.match(css, /--jp-sans: "Noto Sans JP"/);
  assert.match(css, /\.japanese-line \{[\s\S]*?font-family: var\(--jp-sans\);[\s\S]*?font-size: 1rem;[\s\S]*?line-height: 1\.5;[\s\S]*?letter-spacing: 0;/);
  assert.match(css, /\.github-link \{[\s\S]*?background: var\(--black\);/);
});

test("visual milestones use the Ion cut timing contract", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /--ion-ignition: 910ms;/);
  assert.match(css, /--ion-contact: 1000ms;/);
  assert.match(css, /--ion-impact: 1820ms;/);
  assert.match(css, /--ion-load-duration: 820ms;/);
  assert.match(css, /\.threshold-door \{[\s\S]*?clip-path: inset\(100% 0 0\);[\s\S]*?var\(--ion-contact\)[\s\S]*?forwards;/);
  assert.match(css, /\.threshold-mark::before \{[\s\S]*?var\(--ion-impact\)[\s\S]*?forwards;/);
  assert.match(css, /@keyframes cyan-afterglow/);
  assert.match(css, /\.threshold-bar \{[\s\S]*?var\(--ion-impact\)[\s\S]*?forwards;/);
  assert.match(css, /@keyframes horizon-grow/);
  assert.doesNotMatch(css, /bounce/);
});

test("the growing cursor clears glyphs and crackles only in white", async () => {
  const [html, css, script] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(cssPath, "utf8"),
    readFile(scriptPath, "utf8"),
  ]);
  const cursorLoad = css.slice(css.indexOf("@keyframes cursor-load"), css.indexOf("@keyframes cyan-afterglow"));
  const cueStart = script.indexOf("function drawInferenceCue(time)");
  const carveStart = script.indexOf("function drawCarvingField(time)");
  const carveEnd = script.indexOf("\n  function draw(elapsed", carveStart);
  const cue = script.slice(cueStart, carveStart);
  const carve = script.slice(carveStart, carveEnd);

  assert.match(html, /threshold-bar/);
  assert.doesNotMatch(css, /@keyframes carving-edge/);
  assert.doesNotMatch(cursorLoad, /89 217 232/);
  assert.ok(cueStart >= 0 && carveStart > cueStart, "inference cue is missing");
  assert.doesNotMatch(cue, /context\.fillText\("(?:ATTN|KV)"/);
  assert.match(cue, /column <= row/);
  assert.match(cue, /context\.strokeRect\(pageX, pageY/);
  assert.doesNotMatch(cue, /COLORS\.cyan/);
  assert.match(carve, /const crackleCount = 1;/);
  assert.doesNotMatch(carve, /const glowCount/);
  assert.doesNotMatch(carve, /const points/);
  assert.match(carve, /context\.strokeStyle = rgba\(COLORS\.white/);
  assert.match(carve, /carvedChannel\.addColorStop\(0\.5, rgba\(COLORS\.black, 0\.9\)\)/);
  assert.match(carve, /context\.globalCompositeOperation = "screen";/);
  assert.doesNotMatch(carve, /COLORS\.cyan/);
  assert.match(script, /drawInferenceCue\(time\);[\s\S]*?drawCarvingField\(time\);/);
});

test("the background never tracks or reacts to pointer movement", async () => {
  const script = await readFile(scriptPath, "utf8");

  assert.doesNotMatch(script, /pointerLens|POINTER_LENS|POINTER_MODES/);
  assert.doesNotMatch(script, /addEventListener\?\.\("pointermove"/);
  assert.doesNotMatch(script, /drawInferenceLens|stepPointerLens|updatePointerLens/);
});

test("the production page makes no audio or analytics request", async () => {
  const [html, script, headers] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(scriptPath, "utf8"),
    readFile(headersPath, "utf8"),
  ]);

  assert.doesNotMatch(html, /<audio\b/i);
  assert.doesNotMatch(script, /new Audio\(|HTMLAudioElement|audio\.play\(|gtag|analytics/i);
  assert.match(headers, /connect-src 'none'/);
  assert.match(headers, /script-src 'self'/);
  assert.doesNotMatch(headers, /cloudflareinsights|beacon/i);
});
