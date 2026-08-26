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
