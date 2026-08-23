import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const scriptPath = new URL("../script.js", import.meta.url);

class ElementMock {
  getBoundingClientRect() {
    return { left: 670, right: 770, top: 360, bottom: 500, width: 100, height: 140 };
  }
}

class CanvasMock extends ElementMock {
  constructor(world = false, logs = []) {
    super();
    this.world = world;
    this.logs = logs;
    this.width = 0;
    this.height = 0;
    this.context = new ContextMock(this, logs);
  }

  getContext() {
    return this.context;
  }

  getBoundingClientRect() {
    return { left: 0, right: 1440, top: 0, bottom: 1000, width: 1440, height: 1000 };
  }
}

class ContextMock {
  constructor(canvas, logs) {
    this.canvas = canvas;
    this.logs = logs;
    this.fillStyle = "";
    this.globalAlpha = 1;
  }

  measureText(text) {
    return { width: String(text).length * 6 };
  }

  createRadialGradient() {
    return { addColorStop() {} };
  }

  createLinearGradient() {
    return { addColorStop() {} };
  }

  fillText(text, x, y) {
    this.logs.push({ text: String(text), x, y, world: this.canvas.world });
  }

  setTransform() {}
  fillRect() {}
  clearRect() {}
  drawImage() {}
  save() {}
  restore() {}
  beginPath() {}
  rect() {}
  clip() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  strokeRect() {}
}

async function renderAt(time) {
  const logs = [];
  const callbacks = [];
  const canvas = new CanvasMock(true, logs);
  const textCanvas = new CanvasMock(true, logs);
  const threshold = new ElementMock();
  const reduceMotion = { matches: false, addEventListener() {} };
  const document = {
    hidden: false,
    querySelector(selector) {
      if (selector === "[data-world]") return canvas;
      if (selector === "[data-text-world]") return textCanvas;
      return threshold;
    },
    createElement(tag) {
      assert.equal(tag, "canvas");
      return new CanvasMock(false, logs);
    },
    addEventListener() {},
  };
  const window = {
    devicePixelRatio: 1,
    matchMedia() {
      return reduceMotion;
    },
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
  };
  class ResizeObserverMock {
    observe() {}
  }
  const context = vm.createContext({
    console,
    document,
    window,
    performance: { now: () => 0 },
    HTMLCanvasElement: CanvasMock,
    HTMLElement: ElementMock,
    ResizeObserver: ResizeObserverMock,
    requestAnimationFrame(callback) {
      callbacks.push(callback);
      return callbacks.length;
    },
    cancelAnimationFrame() {},
  });

  vm.runInContext(await readFile(scriptPath, "utf8"), context, { filename: "script.js" });
  assert.ok(callbacks.length > 0, "animation did not schedule a frame");
  callbacks.shift()(time);
  return logs;
}

test("feature scramble occupies a real row in the static background", async () => {
  const target = "CONNECT AGENTS TO ONE LOCAL ENDPOINT";
  const logs = await renderAt(3400);
  const overlay = logs.findLast((entry) => entry.world && entry.text.length === target.length);
  assert.ok(overlay, "feature overlay was not drawn");

  const background = logs.findLast(
    (entry) => !entry.world && entry.y === overlay.y && entry.text.length > target.length,
  );
  assert.ok(background, "matching background row was not drawn");

  const characterWidth = 6;
  const start = Math.round((overlay.x - background.x) / characterWidth);
  const source = background.text.slice(start, start + target.length);
  assert.equal(overlay.text.length, source.length);
  assert.notEqual(overlay.text, source);
  for (let index = 0; index < target.length; index += 1) {
    if (target[index] === " ") assert.equal(overlay.text[index], " ");
  }
});

test("feature copy finishes as the authored phrase", async () => {
  const target = "CONNECT AGENTS TO ONE LOCAL ENDPOINT";
  const logs = await renderAt(8800);
  const overlay = logs.findLast((entry) => entry.world && entry.text.length === target.length);
  assert.equal(overlay?.text, target);
});

test("feature copy decodes slowly and deterministically on its own canvas", async () => {
  const source = await readFile(scriptPath, "utf8");

  assert.match(source, /duration: 7200/);
  assert.match(source, /characterStep: 140/);
  assert.match(source, /textContext\.clearRect/);
  assert.match(source, /seededRandom\(activeIndex \* 7919 \+ frame \* 104729 \+ 17\)/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("feature copy does not repeat the centered Tokoro identity and headline", async () => {
  const source = await readFile(scriptPath, "utf8");
  assert.doesNotMatch(source, /A PLACE FOR LOCAL MODELS/);
});
