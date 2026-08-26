(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;

  const arrowIcon = () => `
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>`;

  function boot() {
    const delay = reducedMotion ? 0 : 1320;
    window.setTimeout(() => body.classList.add("is-booted"), delay);
  }

  function setupHeader() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");

    if (!header) return;

    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
      });

      nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
        }
      });
    }
  }

  function setupReveals() {
    const elements = [...document.querySelectorAll("[data-reveal]")];
    if (!elements.length) return;

    if (reducedMotion || !window.IntersectionObserver) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
  }

  class LivingWorld {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: false });
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.small = false;
      this.lowPower = (navigator.deviceMemory || 4) <= 2;
      this.pointerX = 0;
      this.pointerY = 0;
      this.parallaxX = 0;
      this.parallaxY = 0;
      this.scrollY = window.scrollY;
      this.scrollProgress = 0;
      this.activeScene = "genesis";
      this.visible = true;
      this.lastFrame = 0;
      this.raf = null;
      this.sceneRaf = null;
      this.stars = [];
      this.rain = [];
      this.buildings = [];
      this.neuralPoints = [];
      this.hud = document.querySelector("[data-world-status]");
      this.sceneElements = [...document.querySelectorAll("[data-world]")];
      this.palettes = {
        genesis: { label: "GENESIS CORE", primary: [82, 231, 255], secondary: [139, 103, 255], tertiary: [255, 62, 194], fog: [11, 7, 32] },
        forge: { label: "MACHINE FORGE", primary: [255, 52, 190], secondary: [104, 82, 255], tertiary: [84, 238, 255], fog: [24, 5, 31] },
        archive: { label: "MEMORY ARCHIVE", primary: [99, 237, 255], secondary: [51, 255, 176], tertiary: [160, 108, 255], fog: [4, 20, 27] },
        network: { label: "SYSTEM NETWORK", primary: [83, 225, 255], secondary: [159, 84, 255], tertiary: [255, 54, 175], fog: [8, 8, 31] },
        signal: { label: "SIGNAL ROUTE", primary: [255, 59, 199], secondary: [88, 227, 255], tertiary: [196, 255, 68], fog: [23, 6, 29] },
        city: { label: "BUILT SYSTEMS", primary: [255, 54, 185], secondary: [118, 78, 255], tertiary: [65, 239, 255], fog: [20, 5, 31] },
        kernel: { label: "ENGINEERING KERNEL", primary: [79, 237, 255], secondary: [192, 255, 68], tertiary: [140, 93, 255], fog: [4, 20, 25] },
        neural: { label: "NEURAL LAYER", primary: [255, 53, 184], secondary: [81, 224, 255], tertiary: [149, 84, 255], fog: [20, 5, 27] },
        owner: { label: "SOLO CONTROL", primary: [190, 255, 70], secondary: [76, 231, 255], tertiary: [255, 55, 183], fog: [9, 19, 18] },
        dream: { label: "INEVITABLE STATE", primary: [151, 83, 255], secondary: [255, 61, 193], tertiary: [77, 230, 255], fog: [15, 5, 30] },
        contact: { label: "DIRECT CHANNEL", primary: [255, 57, 189], secondary: [79, 231, 255], tertiary: [188, 255, 67], fog: [19, 5, 25] }
      };
      const initial = this.palettes.genesis;
      this.current = {
        primary: [...initial.primary],
        secondary: [...initial.secondary],
        tertiary: [...initial.tertiary],
        fog: [...initial.fog]
      };

      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onPointer = this.onPointer.bind(this);
      this.onVisibility = this.onVisibility.bind(this);

      this.resize();
      window.addEventListener("resize", this.resize, { passive: true });
      window.addEventListener("scroll", this.onScroll, { passive: true });
      document.addEventListener("visibilitychange", this.onVisibility);
      if (finePointer && !reducedMotion) {
        window.addEventListener("pointermove", this.onPointer, { passive: true });
      }
      this.measureScene();
      this.raf = requestAnimationFrame(this.tick);
    }

    rgba(color, alpha = 1) {
      return `rgba(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0}, ${alpha})`;
    }

    seeded(index, salt = 0) {
      const value = Math.sin(index * 913.73 + salt * 199.17) * 43758.5453;
      return value - Math.floor(value);
    }

    resize() {
      this.width = Math.max(1, window.innerWidth);
      this.height = Math.max(1, window.innerHeight);
      this.small = this.width < 760;
      this.dpr = Math.min(window.devicePixelRatio || 1, this.small ? 1.25 : 1.55);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.createWorld();
      if (reducedMotion) this.draw(performance.now());
    }

    createWorld() {
      const starCount = reducedMotion ? 36 : this.small ? 58 : this.lowPower ? 80 : 132;
      const rainCount = reducedMotion ? 12 : this.small ? 22 : this.lowPower ? 34 : 58;
      const buildingCount = this.small ? 25 : 44;
      const neuralCount = this.small ? 18 : 30;

      this.stars = Array.from({ length: starCount }, (_, index) => ({
        x: this.seeded(index, 1),
        y: this.seeded(index, 2) * 0.68,
        z: 0.2 + this.seeded(index, 3) * 0.8,
        size: 0.35 + this.seeded(index, 4) * 1.2,
        phase: this.seeded(index, 5) * Math.PI * 2
      }));

      this.rain = Array.from({ length: rainCount }, (_, index) => ({
        x: this.seeded(index, 11),
        y: this.seeded(index, 12),
        speed: 0.06 + this.seeded(index, 13) * 0.14,
        length: 8 + this.seeded(index, 14) * 34,
        alpha: 0.08 + this.seeded(index, 15) * 0.28,
        color: index % 3
      }));

      this.buildings = Array.from({ length: buildingCount }, (_, index) => ({
        x: this.seeded(index, 21),
        width: 0.016 + this.seeded(index, 22) * (this.small ? 0.045 : 0.028),
        height: 0.04 + Math.pow(this.seeded(index, 23), 1.7) * 0.23,
        depth: this.seeded(index, 24),
        antenna: this.seeded(index, 25) > 0.7,
        phase: this.seeded(index, 26) * Math.PI * 2
      })).sort((a, b) => a.depth - b.depth);

      this.neuralPoints = Array.from({ length: neuralCount }, (_, index) => ({
        x: this.seeded(index, 31),
        y: 0.08 + this.seeded(index, 32) * 0.48,
        phase: this.seeded(index, 33) * Math.PI * 2,
        color: index % 3
      }));
    }

    onVisibility() {
      this.visible = !document.hidden;
      if (this.visible && !this.raf) this.raf = requestAnimationFrame(this.tick);
    }

    onPointer(event) {
      this.pointerX = event.clientX / this.width - 0.5;
      this.pointerY = event.clientY / this.height - 0.5;
    }

    onScroll() {
      this.scrollY = window.scrollY;
      const range = Math.max(1, document.documentElement.scrollHeight - this.height);
      this.scrollProgress = clamp(this.scrollY / range);
      if (!this.sceneRaf) {
        this.sceneRaf = requestAnimationFrame(() => {
          this.sceneRaf = null;
          this.measureScene();
        });
      }
    }

    measureScene() {
      if (!this.sceneElements.length) return;
      const focus = this.height * 0.48;
      let closest = this.sceneElements[0];
      let distance = Infinity;
      this.sceneElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= focus && rect.bottom >= focus) {
          closest = element;
          distance = 0;
          return;
        }
        const current = Math.min(Math.abs(rect.top - focus), Math.abs(rect.bottom - focus));
        if (current < distance) {
          distance = current;
          closest = element;
        }
      });
      const scene = closest.dataset.world;
      if (scene && this.palettes[scene] && scene !== this.activeScene) {
        this.activeScene = scene;
        if (this.hud) this.hud.textContent = `SECTOR / ${this.palettes[scene].label}`;
      }
    }

    blendPalette() {
      const target = this.palettes[this.activeScene] || this.palettes.genesis;
      for (const key of ["primary", "secondary", "tertiary", "fog"]) {
        for (let channel = 0; channel < 3; channel += 1) {
          this.current[key][channel] = lerp(this.current[key][channel], target[key][channel], reducedMotion ? 1 : 0.028);
        }
      }
    }

    drawSky(time) {
      const ctx = this.context;
      const { width, height } = this;
      const horizon = height * (this.small ? 0.61 : 0.64);
      const fog = this.current.fog;
      const primary = this.current.primary;
      const secondary = this.current.secondary;
      const tertiary = this.current.tertiary;

      const base = ctx.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, this.rgba([2, 2, 9], 1));
      base.addColorStop(0.44, this.rgba(fog, 0.96));
      base.addColorStop(0.7, this.rgba([3, 3, 9], 1));
      base.addColorStop(1, "#020205");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const glowX = width * (0.63 + this.parallaxX * 0.08);
      const glowY = height * (0.26 + this.parallaxY * 0.04);
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(width, height) * 0.68);
      glow.addColorStop(0, this.rgba(secondary, 0.14));
      glow.addColorStop(0.28, this.rgba(tertiary, 0.065));
      glow.addColorStop(1, this.rgba(primary, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let ribbon = 0; ribbon < 3; ribbon += 1) {
        const color = ribbon === 0 ? primary : ribbon === 1 ? secondary : tertiary;
        ctx.beginPath();
        const baseY = height * (0.13 + ribbon * 0.09);
        for (let x = -30; x <= width + 30; x += 24) {
          const wave = Math.sin(x * 0.006 + time * (0.00012 + ribbon * 0.00003) + ribbon * 1.8);
          const y = baseY + wave * height * (0.035 + ribbon * 0.009) + this.parallaxY * 18;
          if (x === -30) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = this.small ? 22 : 42;
        ctx.strokeStyle = this.rgba(color, 0.018 + ribbon * 0.006);
        ctx.shadowBlur = 34;
        ctx.shadowColor = this.rgba(color, 0.18);
        ctx.stroke();
      }
      ctx.restore();
      ctx.shadowBlur = 0;

      return horizon;
    }

    drawStars(time) {
      const ctx = this.context;
      const colors = [this.current.primary, this.current.secondary, this.current.tertiary];
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      this.stars.forEach((star, index) => {
        const drift = (time * 0.000004 * star.z + this.scrollProgress * 0.06) % 1;
        const x = ((star.x + drift + this.parallaxX * 0.018 * star.z) % 1) * this.width;
        const y = (star.y + this.parallaxY * 0.012 * star.z) * this.height;
        const alpha = 0.16 + (Math.sin(time * 0.0014 + star.phase) + 1) * 0.16;
        const color = colors[index % 3];
        ctx.fillStyle = this.rgba(color, alpha * star.z);
        ctx.beginPath();
        ctx.arc(x, y, star.size * star.z, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    drawNeuralSky(time) {
      const ctx = this.context;
      const colors = [this.current.primary, this.current.secondary, this.current.tertiary];
      const points = this.neuralPoints.map((point) => ({
        ...point,
        px: (point.x + Math.sin(time * 0.00018 + point.phase) * 0.018 + this.parallaxX * 0.025) * this.width,
        py: (point.y + Math.cos(time * 0.00015 + point.phase) * 0.012 + this.parallaxY * 0.018) * this.height
      }));
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 0.55;
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const distance = Math.hypot(a.px - b.px, a.py - b.py);
          const max = this.small ? 105 : 150;
          if (distance > max) continue;
          ctx.strokeStyle = this.rgba(colors[a.color], (1 - distance / max) * 0.1);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }
      }
      points.forEach((point, index) => {
        const pulse = 0.45 + Math.sin(time * 0.0012 + point.phase) * 0.35;
        ctx.fillStyle = this.rgba(colors[point.color], pulse * 0.48);
        ctx.shadowBlur = index % 5 === 0 ? 12 : 0;
        ctx.shadowColor = this.rgba(colors[point.color], 0.7);
        ctx.beginPath();
        ctx.arc(point.px, point.py, index % 5 === 0 ? 1.7 : 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    drawCity(time, horizon) {
      const ctx = this.context;
      const colors = [this.current.primary, this.current.secondary, this.current.tertiary];
      ctx.save();
      this.buildings.forEach((building, index) => {
        const depthScale = 0.64 + building.depth * 0.62;
        const width = building.width * this.width * depthScale;
        const height = building.height * this.height * depthScale;
        const x = building.x * this.width + this.parallaxX * (8 + building.depth * 16);
        const y = horizon - height;
        const color = colors[index % 3];
        const alpha = 0.07 + building.depth * 0.15;

        const buildingFill = ctx.createLinearGradient(x, y, x + width, horizon);
        buildingFill.addColorStop(0, this.rgba(color, alpha * 0.52));
        buildingFill.addColorStop(1, "rgba(2, 3, 8, .88)");
        ctx.fillStyle = buildingFill;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.rgba(color, alpha);
        ctx.lineWidth = 0.65;
        ctx.strokeRect(x, y, width, height);

        const rows = Math.max(1, Math.floor(height / 14));
        const columns = Math.max(1, Math.floor(width / 10));
        for (let row = 1; row < rows; row += 1) {
          for (let column = 1; column < columns; column += 1) {
            const lit = this.seeded(index * 80 + row * 9 + column, 41) > 0.76;
            if (!lit) continue;
            const flicker = Math.sin(time * 0.001 + building.phase + row * column) > -0.8;
            if (!flicker) continue;
            ctx.fillStyle = this.rgba(colors[(index + row) % 3], 0.18 + building.depth * 0.2);
            ctx.fillRect(x + column * 8, y + row * 12, 1.4, 3);
          }
        }

        if (building.antenna) {
          ctx.strokeStyle = this.rgba(color, 0.24);
          ctx.beginPath();
          ctx.moveTo(x + width * 0.5, y);
          ctx.lineTo(x + width * 0.5, y - height * 0.18);
          ctx.stroke();
          ctx.fillStyle = this.rgba(this.current.tertiary, 0.7);
          ctx.beginPath();
          ctx.arc(x + width * 0.5, y - height * 0.18, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const cityGlow = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 55);
      cityGlow.addColorStop(0, this.rgba(this.current.primary, 0));
      cityGlow.addColorStop(0.5, this.rgba(this.current.primary, 0.15));
      cityGlow.addColorStop(1, this.rgba(this.current.secondary, 0));
      ctx.fillStyle = cityGlow;
      ctx.fillRect(0, horizon - 30, this.width, 85);
      ctx.restore();
    }

    drawGrid(time, horizon) {
      const ctx = this.context;
      const vanishX = this.width * (0.5 + this.parallaxX * 0.04);
      const bottom = this.height + 1;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 0.65;

      const columns = this.small ? 12 : 22;
      for (let index = -columns; index <= columns; index += 1) {
        const bottomX = vanishX + index * (this.width / columns) * 0.86;
        const color = index % 4 === 0 ? this.current.tertiary : this.current.primary;
        ctx.strokeStyle = this.rgba(color, index % 4 === 0 ? 0.13 : 0.07);
        ctx.beginPath();
        ctx.moveTo(vanishX, horizon);
        ctx.lineTo(bottomX, bottom);
        ctx.stroke();
      }

      const speed = reducedMotion ? 0 : (time * 0.00011 + this.scrollY * 0.00038) % 1;
      const rows = this.small ? 12 : 18;
      for (let row = 0; row < rows; row += 1) {
        const normalized = (row + speed) / rows;
        const eased = normalized * normalized;
        const y = horizon + eased * (bottom - horizon);
        const color = row % 5 === 0 ? this.current.secondary : this.current.primary;
        ctx.strokeStyle = this.rgba(color, 0.05 + eased * 0.11);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }

      const laneY = horizon + (bottom - horizon) * 0.22;
      const traffic = (time * 0.08) % (this.width + 240) - 120;
      const trafficGradient = ctx.createLinearGradient(traffic - 110, 0, traffic + 110, 0);
      trafficGradient.addColorStop(0, this.rgba(this.current.tertiary, 0));
      trafficGradient.addColorStop(0.5, this.rgba(this.current.tertiary, 0.75));
      trafficGradient.addColorStop(1, this.rgba(this.current.primary, 0));
      ctx.strokeStyle = trafficGradient;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(traffic - 110, laneY);
      ctx.lineTo(traffic + 110, laneY);
      ctx.stroke();
      ctx.restore();
    }

    drawCore(time) {
      const ctx = this.context;
      const x = this.width * (this.small ? 0.76 : 0.81) + this.parallaxX * 28;
      const y = this.height * (this.small ? 0.22 : 0.29) + this.parallaxY * 20;
      const radius = Math.min(this.width, this.height) * (this.small ? 0.07 : 0.09);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 0.00008 + this.scrollProgress * Math.PI);
      ctx.globalCompositeOperation = "screen";
      for (let ring = 0; ring < 3; ring += 1) {
        const color = ring === 0 ? this.current.primary : ring === 1 ? this.current.secondary : this.current.tertiary;
        ctx.strokeStyle = this.rgba(color, 0.1 + ring * 0.025);
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3 + ring * 4, 7 + ring * 3]);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * (1 + ring * 0.43), radius * (0.35 + ring * 0.16), ring * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.9);
      core.addColorStop(0, this.rgba(this.current.primary, 0.48));
      core.addColorStop(0.15, this.rgba(this.current.tertiary, 0.18));
      core.addColorStop(1, this.rgba(this.current.primary, 0));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawRain(time) {
      if (reducedMotion) return;
      const ctx = this.context;
      const colors = [this.current.primary, this.current.secondary, this.current.tertiary];
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 0.55;
      this.rain.forEach((drop) => {
        const y = ((drop.y + time * 0.0001 * drop.speed + this.scrollProgress * 0.18) % 1.2) * this.height - this.height * 0.1;
        const x = ((drop.x + time * 0.000004 * drop.speed) % 1) * this.width;
        ctx.strokeStyle = this.rgba(colors[drop.color], drop.alpha);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - drop.length * 0.18, y + drop.length);
        ctx.stroke();
      });
      ctx.restore();
    }

    draw(time) {
      this.blendPalette();
      this.parallaxX = lerp(this.parallaxX, this.pointerX, 0.025);
      this.parallaxY = lerp(this.parallaxY, this.pointerY, 0.025);
      const horizon = this.drawSky(time);
      this.drawStars(time);
      this.drawNeuralSky(time);
      this.drawCity(time, horizon);
      this.drawGrid(time, horizon);
      this.drawCore(time);
      this.drawRain(time);
    }

    tick(time) {
      this.raf = null;
      if (!this.visible) return;
      const frameInterval = this.small || this.lowPower ? 1000 / 32 : 1000 / 55;
      if (!reducedMotion && time - this.lastFrame < frameInterval) {
        this.raf = requestAnimationFrame(this.tick);
        return;
      }
      this.lastFrame = time;
      this.draw(time);
      if (!reducedMotion) this.raf = requestAnimationFrame(this.tick);
    }
  }

  class HeroNetwork {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      this.points = [];
      this.projected = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.pointerX = 0;
      this.pointerY = 0;
      this.rotationX = -0.08;
      this.rotationY = 0.18;
      this.targetRotationX = -0.08;
      this.targetRotationY = 0.18;
      this.scrollProgress = 0;
      this.visible = true;
      this.raf = null;
      this.lastTime = 0;
      this.handleResize = this.resize.bind(this);
      this.handlePointer = this.onPointer.bind(this);
      this.tick = this.tick.bind(this);

      this.resize();
      this.createPoints();
      window.addEventListener("resize", this.handleResize, { passive: true });
      if (finePointer && !reducedMotion) {
        window.addEventListener("pointermove", this.handlePointer, { passive: true });
      }

      if (window.IntersectionObserver) {
        this.observer = new IntersectionObserver(([entry]) => {
          this.visible = entry.isIntersecting;
          if (this.visible && !this.raf) this.raf = requestAnimationFrame(this.tick);
        });
        this.observer.observe(canvas);
      }

      this.raf = requestAnimationFrame(this.tick);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.points.length) this.createPoints();
    }

    createPoints() {
      const memory = navigator.deviceMemory || 4;
      const small = this.width < 760;
      const count = reducedMotion ? 58 : small ? 72 : memory <= 2 ? 96 : 148;
      const radius = Math.min(this.width, this.height) * (small ? 0.62 : 0.72);
      this.points = Array.from({ length: count }, (_, index) => {
        const phi = Math.acos(1 - 2 * ((index + 0.5) / count));
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        const layer = 0.52 + Math.random() * 0.48;
        return {
          x: Math.sin(phi) * Math.cos(theta) * radius * layer,
          y: Math.cos(phi) * radius * layer,
          z: Math.sin(phi) * Math.sin(theta) * radius * layer,
          size: 0.65 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 0.00018
        };
      });
    }

    onPointer(event) {
      this.pointerX = event.clientX / window.innerWidth - 0.5;
      this.pointerY = event.clientY / window.innerHeight - 0.5;
      this.targetRotationY = 0.18 + this.pointerX * 0.12;
      this.targetRotationX = -0.08 - this.pointerY * 0.08;
    }

    setScroll(progress) {
      this.scrollProgress = clamp(progress);
    }

    rotate(point, rx, ry) {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = point.x * cosY - point.z * sinY;
      const z1 = point.x * sinY + point.z * cosY;
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      return {
        x: x1,
        y: point.y * cosX - z1 * sinX,
        z: point.y * sinX + z1 * cosX
      };
    }

    draw(time) {
      const ctx = this.context;
      const width = this.width;
      const height = this.height;
      const small = width < 760;
      const centerX = small ? width * 0.55 : width * 0.72;
      const centerY = small ? height * 0.34 : height * 0.48;
      const focal = Math.min(width, height) * 0.92;
      const camera = focal * (1.45 - this.scrollProgress * 0.34);

      ctx.clearRect(0, 0, width, height);
      this.rotationX = lerp(this.rotationX, this.targetRotationX + this.scrollProgress * 0.17, 0.035);
      this.rotationY = lerp(this.rotationY, this.targetRotationY + this.scrollProgress * 0.92, 0.03);

      this.projected = this.points.map((point, index) => {
        if (!reducedMotion) point.phase += point.drift * 16;
        const drifted = {
          x: point.x * (1 + Math.sin(time * 0.00035 + point.phase) * 0.018),
          y: point.y * (1 + Math.cos(time * 0.00028 + point.phase) * 0.018),
          z: point.z
        };
        const rotated = this.rotate(drifted, this.rotationX, this.rotationY);
        const depth = Math.max(80, rotated.z + camera);
        const scale = focal / depth;
        return {
          index,
          x: centerX + rotated.x * scale,
          y: centerY + rotated.y * scale,
          z: rotated.z,
          scale,
          alpha: clamp((rotated.z + camera * 0.9) / (camera * 1.65), 0.08, 0.82)
        };
      });

      const threshold = small ? 62 : 86;
      ctx.lineWidth = 0.55;
      for (let i = 0; i < this.projected.length; i += 1) {
        const a = this.projected[i];
        for (let j = i + 1; j < this.projected.length; j += 1) {
          const b = this.projected[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > threshold) continue;
          const alpha = (1 - distance / threshold) * Math.min(a.alpha, b.alpha) * 0.34;
          ctx.strokeStyle = `rgba(114, 228, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      const pulse = (time * 0.000085) % 1;
      const pulseIndex = Math.floor(pulse * Math.max(1, this.projected.length - 1));

      [...this.projected]
        .sort((a, b) => a.z - b.z)
        .forEach((point) => {
          const source = this.points[point.index];
          const active = Math.abs(point.index - pulseIndex) < 2;
          const size = source.size * clamp(point.scale, 0.5, 2.2) * (active ? 1.8 : 1);
          ctx.fillStyle = active
            ? `rgba(225, 251, 255, ${Math.min(1, point.alpha + 0.35)})`
            : `rgba(145, 227, 246, ${point.alpha})`;
          if (active) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = "rgba(114, 228, 255, .85)";
          }
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

      const coreRadius = 7 + Math.sin(time * 0.002) * 1.5;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 5);
      coreGradient.addColorStop(0, "rgba(235, 253, 255, .95)");
      coreGradient.addColorStop(0.17, "rgba(114, 228, 255, .55)");
      coreGradient.addColorStop(1, "rgba(114, 228, 255, 0)");
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    tick(time) {
      this.raf = null;
      if (!this.visible || document.hidden) return;
      if (reducedMotion && this.lastTime) return;
      this.lastTime = time;
      this.draw(time);
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  class YearsParticles {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.particles = [];
      this.start = 0;
      this.visible = false;
      this.done = false;
      this.raf = null;
      this.tick = this.tick.bind(this);
      this.resize = this.resize.bind(this);
      window.addEventListener("resize", this.resize, { passive: true });
      this.resize();

      if (window.IntersectionObserver) {
        this.observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !this.visible) {
              this.visible = true;
              this.start = performance.now();
              this.raf = requestAnimationFrame(this.tick);
            }
          },
          { threshold: 0.28 }
        );
        this.observer.observe(canvas);
      } else {
        this.visible = true;
        this.start = performance.now();
        this.raf = requestAnimationFrame(this.tick);
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.createParticles();
      if (this.done || reducedMotion) this.draw(1, performance.now());
    }

    createParticles() {
      const offscreen = document.createElement("canvas");
      offscreen.width = Math.max(320, Math.round(this.width));
      offscreen.height = Math.max(320, Math.round(this.height));
      const ctx = offscreen.getContext("2d");
      const fontSize = Math.min(offscreen.width * 0.57, offscreen.height * 0.78);
      ctx.clearRect(0, 0, offscreen.width, offscreen.height);
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("22", offscreen.width * 0.49, offscreen.height * 0.46);

      const data = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const step = this.width < 680 ? 10 : 8;
      const targets = [];
      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          if (data[(y * offscreen.width + x) * 4 + 3] > 140 && Math.random() > 0.26) {
            targets.push({ x, y });
          }
        }
      }

      const max = this.width < 680 ? 620 : 1150;
      const sampled = targets.length > max
        ? targets.filter((_, index) => index % Math.ceil(targets.length / max) === 0)
        : targets;

      this.particles = sampled.map((target) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(this.width, this.height) * (0.25 + Math.random() * 0.65);
        return {
          sx: this.width / 2 + Math.cos(angle) * distance,
          sy: this.height / 2 + Math.sin(angle) * distance,
          tx: target.x,
          ty: target.y,
          size: 0.5 + Math.random() * 1.35,
          delay: Math.random() * 0.22,
          phase: Math.random() * Math.PI * 2
        };
      });
    }

    draw(progress, time) {
      const ctx = this.context;
      ctx.clearRect(0, 0, this.width, this.height);
      this.particles.forEach((particle) => {
        const local = clamp((progress - particle.delay) / (1 - particle.delay));
        const eased = 1 - Math.pow(1 - local, 3);
        const jitter = local > 0.94 && !reducedMotion
          ? Math.sin(time * 0.002 + particle.phase) * 0.45
          : 0;
        const x = lerp(particle.sx, particle.tx, eased) + jitter;
        const y = lerp(particle.sy, particle.ty, eased) + jitter;
        const alpha = clamp(local * 1.25, 0.05, 0.9);
        ctx.fillStyle = `rgba(129, 229, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    tick(time) {
      this.raf = null;
      if (!this.visible || document.hidden) return;
      const duration = reducedMotion ? 1 : 1800;
      const progress = clamp((time - this.start) / duration);
      this.draw(progress, time);
      this.done = progress >= 1;
      if (!this.done || !reducedMotion) this.raf = requestAnimationFrame(this.tick);
    }
  }

  function setupSystemMap() {
    const map = document.querySelector(".system-map");
    if (!map) return;
    const nodes = [...map.querySelectorAll(".map-node")];
    const title = map.querySelector(".map-detail-title");
    const copy = map.querySelector(".map-detail-copy");
    const orbit = map.querySelector(".map-orbit");

    const activate = (node) => {
      nodes.forEach((candidate) => candidate.classList.toggle("is-active", candidate === node));
      if (title) title.textContent = node.dataset.title || node.textContent.trim();
      if (copy) copy.textContent = node.dataset.detail || "Wszystkie warstwy pracują jako jeden produkt.";
    };

    nodes.forEach((node) => {
      node.addEventListener("click", () => activate(node));
      node.addEventListener("focus", () => activate(node));
      if (finePointer) node.addEventListener("mouseenter", () => activate(node));
    });

    if (finePointer && orbit && !reducedMotion) {
      map.addEventListener("pointermove", (event) => {
        const rect = map.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        orbit.style.transform = `rotateX(${64 - y * 6}deg) rotateZ(${-8 + x * 7}deg)`;
      }, { passive: true });
      map.addEventListener("pointerleave", () => {
        orbit.style.transform = "rotateX(64deg) rotateZ(-8deg)";
      });
    }
  }

  function setupCursor() {
    if (!finePointer || reducedMotion) return;
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    body.classList.add("has-cursor");
    let mouseX = -50;
    let mouseY = -50;
    let ringX = -50;
    let ringY = -50;

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    }, { passive: true });

    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.16);
      ringY = lerp(ringY, mouseY, 0.16);
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    document.addEventListener("pointerover", (event) => {
      const interactive = event.target.closest("a, button, input, textarea, select, label");
      const project = event.target.closest("[data-cursor='view']");
      ring.classList.toggle("is-hovering", Boolean(interactive));
      ring.classList.toggle("is-viewing", Boolean(project));
      ring.textContent = project ? "VIEW" : "";
    });
  }

  function setupPageTransitions() {
    if (reducedMotion) return;
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      event.preventDefault();
      body.classList.add("is-leaving");
      window.setTimeout(() => { window.location.href = url.href; }, 470);
    });
  }

  function setupAuditForm() {
    const form = document.querySelector("[data-audit-form]");
    if (!form) return;
    const status = form.querySelector(".form-status");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const values = {};
      for (const [key, value] of data.entries()) {
        if (values[key]) values[key] = `${values[key]}, ${value}`;
        else values[key] = value;
      }

      const lines = [
        "MINI AUDYT — OSATechGPT",
        "",
        `Firma / marka: ${values.company || "—"}`,
        `E-mail: ${values.email || "—"}`,
        `Strona: ${values.website || "—"}`,
        `Branża: ${values.industry || "—"}`,
        "",
        `Największe wąskie gardło: ${values.bottleneck || "—"}`,
        `Co ma się poprawić: ${values.outcome || "—"}`,
        `Zakres: ${values.scope || "—"}`,
        `Obecne narzędzia: ${values.tools || "—"}`,
        `Termin: ${values.timeline || "—"}`
      ];

      const subject = encodeURIComponent(`Mini audyt — ${values.company || "nowy projekt"}`);
      const message = encodeURIComponent(lines.join("\n"));
      if (status) status.textContent = "Otwieram gotową wiadomość e-mail…";
      window.location.href = `mailto:osabarca@gmail.com?subject=${subject}&body=${message}`;
    });
  }

  function setupScrollStory(heroNetwork) {
    const manifest = document.querySelector(".manifest");
    const manifestPhrases = manifest ? [...manifest.querySelectorAll(".manifest-copy span")] : [];
    const timeline = document.querySelector(".timeline");
    const timelineItems = timeline ? [...timeline.querySelectorAll(".timeline-item")] : [];
    const philosophy = document.querySelector(".philosophy");
    const philosophyLines = philosophy ? [...philosophy.querySelectorAll(".philosophy-line")] : [];
    const projects = [...document.querySelectorAll(".project-scene")];
    let ticking = false;

    const sectionProgress = (element) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      return clamp(-rect.top / distance);
    };

    const update = () => {
      ticking = false;
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      root.style.setProperty("--scroll-progress", String(clamp(window.scrollY / scrollRange)));

      if (heroNetwork) {
        const hero = document.querySelector(".hero");
        const heroProgress = hero ? clamp(window.scrollY / Math.max(1, hero.offsetHeight)) : 0;
        heroNetwork.setScroll(heroProgress);
      }

      if (manifest && manifestPhrases.length) {
        const progress = sectionProgress(manifest);
        manifest.style.setProperty("--manifest-progress", String(progress));
        const index = Math.min(manifestPhrases.length - 1, Math.floor(progress * manifestPhrases.length));
        manifestPhrases.forEach((phrase, phraseIndex) => phrase.classList.toggle("is-active", phraseIndex <= index));
      }

      if (timeline && timelineItems.length) {
        const rect = timeline.getBoundingClientRect();
        const progress = clamp((window.innerHeight * 0.58 - rect.top) / Math.max(1, rect.height));
        timeline.style.setProperty("--timeline-progress", String(progress));
        timelineItems.forEach((item) => {
          const itemRect = item.getBoundingClientRect();
          const active = itemRect.top < window.innerHeight * 0.7 && itemRect.bottom > window.innerHeight * 0.22;
          item.classList.toggle("is-active", active);
        });
      }

      if (philosophy && philosophyLines.length) {
        const progress = sectionProgress(philosophy);
        const index = Math.min(philosophyLines.length - 1, Math.floor(progress * philosophyLines.length));
        philosophyLines.forEach((line, lineIndex) => line.classList.toggle("is-active", lineIndex === index));
      }

      if (!reducedMotion && window.innerWidth > 680) {
        projects.forEach((project, index) => {
          const rect = project.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const relative = clamp((center - window.innerHeight / 2) / window.innerHeight, -1, 1);
          project.style.setProperty("--project-tilt", `${-5 + relative * 7 + (index % 2 ? 2 : 0)}deg`);
        });
      }
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  function enhanceButtons() {
    document.querySelectorAll(".button, .link-arrow").forEach((button) => {
      if (!button.querySelector("svg")) button.insertAdjacentHTML("beforeend", arrowIcon());
    });
  }

  function init() {
    boot();
    setupHeader();
    setupReveals();
    setupSystemMap();
    setupCursor();
    setupPageTransitions();
    setupAuditForm();
    enhanceButtons();

    const worldCanvas = document.querySelector(".world-canvas");
    if (worldCanvas) new LivingWorld(worldCanvas);
    const heroCanvas = document.querySelector(".hero-canvas");
    const heroNetwork = heroCanvas ? new HeroNetwork(heroCanvas) : null;
    const yearsCanvas = document.querySelector(".years-canvas");
    if (yearsCanvas) new YearsParticles(yearsCanvas);
    setupScrollStory(heroNetwork);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
