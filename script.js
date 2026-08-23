(() => {
  "use strict";

  const canvas = document.querySelector("[data-world]");
  const textCanvas = document.querySelector("[data-text-world]");
  const threshold = document.querySelector("[data-threshold]");
  const thresholdDoor = document.querySelector(".threshold-door");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (
    !(canvas instanceof HTMLCanvasElement) ||
    !(textCanvas instanceof HTMLCanvasElement) ||
    !(threshold instanceof HTMLElement) ||
    !(thresholdDoor instanceof HTMLElement)
  ) return;

  const context = canvas.getContext("2d", { alpha: false });
  const textContext = textCanvas.getContext("2d");
  if (!context || !textContext) return;

  const COLORS = {
    black: "#030506",
    white: "#f4f7f7",
    cyan: "#59d9e8",
  };
  const MONO = '"SFMono-Regular", "Cascadia Mono", "Liberation Mono", Menlo, Consolas, monospace';
  const FEATURES = [
    "FIND LOCAL MODELS THAT FIT THIS MACHINE",
    "START A MODEL AND KNOW WHEN IT IS READY",
    "CONNECT AGENTS TO ONE LOCAL ENDPOINT",
    "SEE PREFILL DECODE QUEUE AND CACHE PRESSURE",
    "KEEP PROMPTS AND RESPONSES ON THIS MACHINE",
    "COMPARE MODELS WITH THE SAME LOCAL WORKLOAD",
    "LET AGENTS READ TYPED LOCAL STATUS",
    "OWN THE MODEL OWN THE MEMORY OWN THE PROCESS",
  ];
  const ASCII = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:+_-/\\[]<>|";
  const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const ION_TIMELINE = {
    contact: 1000,
    impact: 1820,
    loadDuration: 820,
  };
  const SCRAMBLE_TIMELINE = {
    start: 3200,
    duration: 7200,
    characterStep: 140,
  };

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let fieldCanvas = document.createElement("canvas");
  let fieldFontSize = 8;
  let featureSlots = [];
  let doorBox = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
  let startedAt = performance.now();
  let animationFrame = 0;
  let resizeTimer = 0;

  function clamp(value, minimum = 0, maximum = 1) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function smooth(value) {
    const bounded = clamp(value);
    return bounded * bounded * (3 - 2 * bounded);
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function rgba(hex, alpha) {
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha)})`;
  }

  function setFont(target, size, weight = 400) {
    target.font = `${weight} ${size}px ${MONO}`;
    target.textBaseline = "middle";
  }

  function refreshThresholdBox() {
    const doorBounds = thresholdDoor.getBoundingClientRect();
    doorBox = {
      left: doorBounds.left,
      right: doorBounds.right,
      top: doorBounds.top,
      bottom: doorBounds.bottom,
      width: doorBounds.width,
      height: doorBounds.height,
    };
  }

  function buildField() {
    fieldCanvas = document.createElement("canvas");
    fieldCanvas.width = Math.round(width * pixelRatio);
    fieldCanvas.height = Math.round(height * pixelRatio);
    const field = fieldCanvas.getContext("2d");
    if (!field) return;
    field.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    field.fillStyle = COLORS.black;
    field.fillRect(0, 0, width, height);

    const random = seededRandom(Math.round(width) * 911 + Math.round(height) * 353 + 92601);
    fieldFontSize = clamp(Math.floor(Math.min(width / 145, height / 86)), 7, 10);
    const lineHeight = fieldFontSize * 1.72;
    const rows = Math.ceil(height / lineHeight) + 2;
    setFont(field, fieldFontSize, 400);
    const characterWidth = field.measureText("M").width || fieldFontSize * 0.62;
    featureSlots = [];

    for (let row = 0; row < rows; row += 1) {
      const y = row * lineHeight;
      let stream = "";
      while (field.measureText(stream).width < width * 1.08) {
        stream += random() < 0.22 ? " " : ASCII[Math.floor(random() * ASCII.length)];
      }
      const offset = -fieldFontSize * Math.floor(random() * 8);
      field.fillStyle = rgba(COLORS.white, 0.095);
      field.fillText(stream, offset, y);

      if (row % 6 === 2) {
        const text = FEATURES[Math.floor(row / 6) % FEATURES.length];
        const start = Math.max(2, Math.floor((stream.length - text.length) * random()));
        featureSlots.push({
          x: offset + start * characterWidth,
          y,
          text,
          source: stream.slice(start, start + text.length),
          width: text.length * characterWidth,
        });
      }
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(320, bounds.width);
    height = Math.max(448, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    textCanvas.width = Math.round(width * pixelRatio);
    textCanvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    textContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    refreshThresholdBox();
    buildField();
    if (reduceMotion.matches) draw(3200);
  }

  function drawFeatureScramble(time) {
    textContext.clearRect(0, 0, width, height);
    if (!featureSlots.length || time < SCRAMBLE_TIMELINE.start) return;

    if (reduceMotion.matches) {
      const slot = featureSlots[Math.min(2, featureSlots.length - 1)];
      textContext.fillStyle = rgba(COLORS.black, 0.92);
      textContext.fillRect(
        slot.x - 1,
        slot.y - fieldFontSize,
        slot.width + 2,
        fieldFontSize * 2,
      );
      setFont(textContext, fieldFontSize, 400);
      textContext.fillStyle = rgba(COLORS.cyan, 0.62);
      textContext.fillText(slot.text, slot.x, slot.y);
      return;
    }

    const cycleTime = time - SCRAMBLE_TIMELINE.start;
    const activeIndex =
      (Math.floor(cycleTime / SCRAMBLE_TIMELINE.duration) + 2) % featureSlots.length;
    const progress = (cycleTime % SCRAMBLE_TIMELINE.duration) / SCRAMBLE_TIMELINE.duration;
    const slot = featureSlots[activeIndex];
    const reveal = smooth((progress - 0.08) / 0.66);
    const enter = smooth(progress / 0.08);
    const exit = 1 - smooth((progress - 0.88) / 0.12);
    const visibility = enter * exit;
    const frame = Math.floor(cycleTime / SCRAMBLE_TIMELINE.characterStep);
    const random = seededRandom(activeIndex * 7919 + frame * 104729 + 17);
    const resolvedCharacters = Math.floor(reveal * slot.text.length);
    const text = Array.from(slot.text, (character, index) => {
      if (character === " ") return " ";
      if (index < resolvedCharacters) return character;
      return SCRAMBLE_CHARS[Math.floor(random() * SCRAMBLE_CHARS.length)];
    }).join("");

    textContext.fillStyle = rgba(COLORS.black, 0.92 * visibility);
    textContext.fillRect(
      slot.x - 1,
      slot.y - fieldFontSize,
      slot.width + 2,
      fieldFontSize * 2,
    );
    setFont(textContext, fieldFontSize, 400);
    textContext.fillStyle = rgba(COLORS.white, 0.16 * visibility);
    textContext.fillText(text, slot.x, slot.y);

    if (resolvedCharacters > 0) {
      textContext.save();
      textContext.beginPath();
      textContext.rect(
        slot.x,
        slot.y - fieldFontSize,
        slot.width * reveal,
        fieldFontSize * 2,
      );
      textContext.clip();
      textContext.fillStyle = rgba(COLORS.cyan, 0.78 * visibility);
      textContext.fillText(text, slot.x, slot.y);
      textContext.restore();
    }
  }

  function drawInferenceCue(time) {
    const load = clamp((time - ION_TIMELINE.contact) / ION_TIMELINE.loadDuration);
    if (load <= 0 || load >= 1) return;

    const enter = smooth(load / 0.16);
    const exit = 1 - smooth((load - 0.82) / 0.18);
    const visibility = enter * exit;
    const centerY = doorBox.top + doorBox.height * 0.44;
    const matrixX = doorBox.left - 21;
    const matrixY = centerY - 8;
    const cacheX = doorBox.right + 5;
    const gap = 4;

    context.save();
    context.globalCompositeOperation = "screen";

    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column <= row; column += 1) {
        const resolved = clamp(load * 1.55 - (row + column) * 0.055);
        context.fillStyle = rgba(COLORS.white, visibility * (0.22 + resolved * 0.58));
        context.fillRect(matrixX + column * gap, matrixY + row * gap, 1.75, 1.75);
      }
    }

    for (let row = 0; row < 5; row += 1) {
      const pageY = matrixY + (4 - row) * gap;
      const populated = clamp(load * 5 - row);
      for (let column = 0; column < 2; column += 1) {
        const pageX = cacheX + column * 4.75;
        context.strokeStyle = rgba(COLORS.white, 0.3 * visibility);
        context.lineWidth = 0.65;
        context.strokeRect(pageX, pageY, 3.25, 2.25);
        if (populated > 0) {
          context.fillStyle = rgba(COLORS.white, visibility * populated * 0.78);
          context.fillRect(pageX, pageY, 3.25, 2.25);
        }
      }
    }

    context.restore();
  }

  function drawCarvingField(time) {
    const load = clamp((time - ION_TIMELINE.contact) / ION_TIMELINE.loadDuration);
    if (load <= 0 || load >= 1) return;

    const progress = smooth(load);
    const centerX = (doorBox.left + doorBox.right) / 2;
    const edgeY = doorBox.bottom - doorBox.height * progress;
    const loadedHeight = Math.max(2, doorBox.bottom - edgeY);
    const energy = Math.sin(load * Math.PI);
    const channelRadius = 20 + 4 * energy;

    context.save();

    const carvedChannel = context.createLinearGradient(
      centerX - channelRadius,
      0,
      centerX + channelRadius,
      0,
    );
    carvedChannel.addColorStop(0, rgba(COLORS.black, 0));
    carvedChannel.addColorStop(0.34, rgba(COLORS.black, 0.32));
    carvedChannel.addColorStop(0.5, rgba(COLORS.black, 0.9));
    carvedChannel.addColorStop(0.66, rgba(COLORS.black, 0.32));
    carvedChannel.addColorStop(1, rgba(COLORS.black, 0));
    context.fillStyle = carvedChannel;
    context.fillRect(
      centerX - channelRadius,
      edgeY - 4,
      channelRadius * 2,
      loadedHeight + 8,
    );

    context.globalCompositeOperation = "screen";
    const radius = 11 + 5 * energy;
    const glow = context.createRadialGradient(centerX, edgeY, 0, centerX, edgeY, radius);
    glow.addColorStop(0, rgba(COLORS.white, 0.22 + energy * 0.18));
    glow.addColorStop(0.4, rgba(COLORS.white, 0.08 + energy * 0.08));
    glow.addColorStop(1, rgba(COLORS.white, 0));
    context.fillStyle = glow;
    context.fillRect(centerX - radius, edgeY - radius, radius * 2, radius * 2);

    const frame = Math.floor((time - ION_TIMELINE.contact) / 80);
    const random = seededRandom(frame * 131 + Math.round(width) * 17 + Math.round(height) * 29);
    const crackleCount = 1;
    for (let index = 0; index < crackleCount; index += 1) {
      const side = random() < 0.5 ? -1 : 1;
      const startX = side < 0 ? doorBox.left : doorBox.right;
      const startY = edgeY + (random() - 0.5) * 4;
      const reach = 2 + random() * (3 + 3 * energy);
      const segments = 2 + Math.floor(random() * 2);

      context.beginPath();
      context.moveTo(startX, startY);
      for (let segment = 1; segment <= segments; segment += 1) {
        const amount = segment / segments;
        context.lineTo(
          startX + side * reach * amount,
          startY + (random() - 0.5) * (3 + 2 * energy) * amount,
        );
      }
      context.lineWidth = 0.45 + random() * 0.35;
      context.strokeStyle = rgba(COLORS.white, 0.28 + random() * 0.34);
      context.stroke();
    }

    context.restore();
  }

  function draw(elapsed = 3200) {
    const time = reduceMotion.matches ? 3200 : elapsed;
    context.fillStyle = COLORS.black;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = reduceMotion.matches ? 1 : smooth(time / 950);
    context.drawImage(fieldCanvas, 0, 0, width, height);
    context.globalAlpha = 1;
    drawInferenceCue(time);
    drawCarvingField(time);
    drawFeatureScramble(time);
  }

  function animate(now) {
    draw(now - startedAt);
    animationFrame = requestAnimationFrame(animate);
  }

  function startAnimation() {
    cancelAnimationFrame(animationFrame);
    if (reduceMotion.matches || document.hidden) {
      draw(3200);
      return;
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function restartLaunch() {
    startedAt = performance.now();
    for (const animation of document.getAnimations()) {
      const target = animation.effect?.target;
      if (target?.closest?.(".center-stage")) {
        animation.cancel();
        animation.play();
      }
    }
    draw(0);
    startAnimation();
  }

  const previewOrigins = new Set(["http://127.0.0.1:8129", "http://localhost:8129"]);
  window.addEventListener?.("message", event => {
    if (event.data?.type === "tokoro:load" && previewOrigins.has(event.origin)) restartLaunch();
  });

  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 80);
  });
  resizeObserver.observe(canvas);

  reduceMotion.addEventListener("change", startAnimation);
  document.addEventListener("visibilitychange", startAnimation);
  window.setTimeout(refreshThresholdBox, 1200);

  resize();
  startAnimation();
})();
