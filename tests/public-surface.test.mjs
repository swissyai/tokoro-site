import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repositoryPath = fileURLToPath(new URL("../", import.meta.url));

test("the public repository tracks only its root README as Markdown", async () => {
  const { stdout } = await execFileAsync("git", ["ls-files"], {
    cwd: repositoryPath,
  });
  const markdown = stdout
    .split("\n")
    .filter((path) => path.toLowerCase().endsWith(".md"))
    .sort();

  assert.deepEqual(markdown, ["README.md"]);
});
