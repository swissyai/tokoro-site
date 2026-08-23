import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, "dist");
const files = ["index.html", "styles.css", "script.js", "_headers"];

await rm(output, { recursive: true, force: true });
await mkdir(join(output, "assets"), { recursive: true });
for (const file of files) {
  await cp(join(root, file), join(output, file));
}
await cp(join(root, "assets", "favicon.svg"), join(output, "assets", "favicon.svg"));

const html = await readFile(join(output, "index.html"), "utf8");
if (!html.includes("A place for local models.")) {
  throw new Error("production headline is missing");
}
if (/studio|variants\.html|sound-lab/i.test(html)) {
  throw new Error("production HTML references a local design lab");
}
await writeFile(join(output, "404.html"), html);

console.log(`built ${output}`);
