/**
 * ============================================================================
 * Under The Tuba Tree - Hero Section Script
 * Vanilla JS, Canvas Leaves, Intro Timeline, Parallax & Responsive Management
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION OBJECT
  // ==========================================================================
  const CONFIG = {
    mouseParallaxMaxPx: 8,

    // Lantern Glow Positions (% of stage coordinate space)
    lanterns: [
      { left: 50.0, top: 31.0 },
      { left: 71.5, top: 22.0 },
      { left: 78.0, top: 24.0 },
      { left: 72.0, top: 42.0 },
      { left: 93.0, top: 44.0 }
    ],

    // Decorative Reader Character (% of stage coordinate space — tune here)
    reader: {
      desktop: { left: 62, bottom: 4, width: 33 },
      mobile:  { left: 69, bottom: 5, width: 26 }, // below 768px (shifted right, clears left text)
      introDelayMs: 3800
    },

    // Falling Leaves Particle Count
    leafCounts: {
      desktop: 12,
      mobile: 6
    },

    // Sprites configuration
    sprites: [
      { id: 'gold',   src: 'assets/leaf-gold.png' },
      { id: 'olive',  src: 'assets/leaf-olive.png' },
      { id: 'olive2', src: 'assets/leaf-olive2.png' },
      { id: 'amber',  src: 'assets/leaf-amber.png' },
      { id: 'slim',   src: 'assets/leaf-slim.png' }
    ],

    // Delicate sizing in screen pixels
    leafSizeRange: {
      min: 16,
      max: 30
    },

    firefliesCount: 20,
    storageKeyIntro: 'under_tuba_tree_intro_played'
  };

  // ==========================================================================
  // 2. DOM ELEMENTS & STATE
  // ==========================================================================
  const stage = document.getElementById('stage');
  const readerCharacter = document.getElementById('readerCharacter');
  const leavesCanvas = document.getElementById('leavesCanvas');
  const firefliesLayer = document.getElementById('firefliesLayer');

  const heroTagline = document.getElementById('heroTagline');
  const heroTitle = document.getElementById('heroTitle');
  const heroAction = document.getElementById('heroAction');

  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  let ctx = null;
  let canvasW = 0;
  let canvasH = 0;
  let dpr = 1;

  let loadedSprites = {};
  let leaves = [];
  let leafGenerationRamp = 0;
  let isPageVisible = true;
  let lastFrameTime = performance.now();
  let introTimers = [];

  // Gentle wind
  let windTime = 0;
  let gustForce = 0;
  let gustDecay = 0.99;
  let nextGustTime = 5000;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================================
  // 3. ASSET PRELOADER
  // ==========================================================================
  function preloadSprites(callback) {
    let loadedCount = 0;
    const total = CONFIG.sprites.length;

    CONFIG.sprites.forEach(item => {
      const img = new Image();
      img.src = item.src;
      img.onload = () => {
        loadedSprites[item.id] = img;
        loadedCount++;
        if (loadedCount === total && typeof callback === 'function') {
          callback();
        }
      };
      img.onerror = () => {
        console.warn(`[TubaTree] Leaf sprite failed: ${item.src}`);
        loadedCount++;
        if (loadedCount === total && typeof callback === 'function') {
          callback();
        }
      };
    });
  }

  // ==========================================================================
  // 4. FIREFLIES GENERATION (positioned inside the stage)
  // ==========================================================================
  function initFireflies() {
    if (!firefliesLayer) return;
    firefliesLayer.innerHTML = '';

    for (let i = 0; i < CONFIG.firefliesCount; i++) {
      const fly = document.createElement('div');
      fly.className = 'firefly';
      // Keep fireflies in the lower two-thirds of the stage
      const top = 30 + Math.random() * 60;
      const left = 15 + Math.random() * 80;
      const delay = Math.random() * 5;
      const duration = 4.5 + Math.random() * 4;

      fly.style.top = `${top}%`;
      fly.style.left = `${left}%`;
      fly.style.animationDelay = `${delay}s`;
      fly.style.animationDuration = `${duration}s`;

      firefliesLayer.appendChild(fly);
    }
  }

  // ==========================================================================
  // 4B. READER CHARACTER POSITIONING (Percentage-locked inside .stage)
  // ==========================================================================
  function applyReaderPosition() {
    if (!readerCharacter || !CONFIG.reader) return;
    const isMobile = window.innerWidth < 768;
    const pos = isMobile ? CONFIG.reader.mobile : CONFIG.reader.desktop;

    readerCharacter.style.left = `${pos.left}%`;
    readerCharacter.style.bottom = `${pos.bottom}%`;
    readerCharacter.style.width = `${pos.width}%`;
  }

  // ==========================================================================
  // 5. CANVAS & LEAF SIMULATION
  //    Canvas is sized to the .stage element (not full hero).
  //    Leaves spawn from the canopy area (upper right of stage).
  // ==========================================================================
  class LeafParticle {
    constructor(isFirstSpawn = false) {
      this.reset(isFirstSpawn);
    }

    reset(initial = false) {
      const baseTypes = ['gold', 'olive', 'olive2', 'amber'];
      this.type = baseTypes[Math.floor(Math.random() * baseTypes.length)];
      this.img = loadedSprites[this.type];

      this.depth = Math.random();

      const targetSize = CONFIG.leafSizeRange.min + this.depth * (CONFIG.leafSizeRange.max - CONFIG.leafSizeRange.min);

      const aspect = (this.img && this.img.naturalHeight)
        ? (this.img.naturalWidth / this.img.naturalHeight)
        : 1;

      this.width = targetSize * aspect;
      this.height = targetSize;

      // Spawn from canopy area (upper-right of stage: roughly x 45%-95%, y -10% to 10%)
      this.x = (canvasW * 0.45) + Math.random() * (canvasW * 0.50);
      this.y = initial ? Math.random() * (canvasH * 0.7) : -this.height - Math.random() * 60;

      // Slow gentle drift
      this.vy = (0.20 + this.depth * 0.35) * (0.85 + Math.random() * 0.3);
      this.vx = (Math.random() - 0.50) * 0.22;

      // Sway & 3D Flip
      this.swayAngle = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.007 + Math.random() * 0.011;
      this.swayAmp = 14 + this.depth * 16;

      this.flipAngle = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.009 + Math.random() * 0.014;

      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.007;

      this.baseAlpha = 0.50 + this.depth * 0.45;
      this.alpha = 0;
      this.fadeIn = true;
    }

    update(dt, windX) {
      this.swayAngle += this.swaySpeed * dt;
      this.flipAngle += this.flipSpeed * dt;
      this.rotation += this.rotSpeed * dt;

      const swayOffset = Math.sin(this.swayAngle) * (this.swayAmp * 0.018);
      this.x += (this.vx + swayOffset + windX) * dt;
      this.y += this.vy * dt;

      if (this.fadeIn) {
        this.alpha += 0.02 * dt;
        if (this.alpha >= this.baseAlpha) {
          this.alpha = this.baseAlpha;
          this.fadeIn = false;
        }
      }

      // Ground fade out
      const groundLine = canvasH * 0.85;
      if (this.y > groundLine) {
        const fadeProgress = (this.y - groundLine) / (canvasH * 0.15);
        this.alpha = Math.max(0, this.baseAlpha * (1 - fadeProgress));
      }

      if (this.y > canvasH + 40 || this.x < -80 || this.x > canvasW + 80 || (this.alpha <= 0 && this.y > groundLine)) {
        this.reset(false);
      }
    }

    render(ctx) {
      if (!this.img || this.alpha <= 0) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      const flipScale = Math.cos(this.flipAngle);
      ctx.scale(Math.abs(flipScale) < 0.15 ? 0.15 : flipScale, 1);

      let drawImg = this.img;
      if (Math.abs(flipScale) < 0.35 && loadedSprites['slim']) {
        drawImg = loadedSprites['slim'];
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha * leafGenerationRamp));
      ctx.drawImage(drawImg, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    }
  }

  function resizeCanvas() {
    if (!leavesCanvas || !stage) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Size canvas to the stage element (not the hero)
    const rect = stage.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;

    leavesCanvas.width = canvasW * dpr;
    leavesCanvas.height = canvasH * dpr;

    ctx = leavesCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function initLeaves() {
    const isMobile = window.innerWidth <= 768;
    const targetCount = isMobile ? CONFIG.leafCounts.mobile : CONFIG.leafCounts.desktop;

    leaves = [];
    for (let i = 0; i < targetCount; i++) {
      leaves.push(new LeafParticle(false));
    }
  }

  function animateLeaves(now) {
    if (!isPageVisible || prefersReducedMotion) {
      lastFrameTime = now;
      requestAnimationFrame(animateLeaves);
      return;
    }

    const delta = Math.min((now - lastFrameTime) / 16.666, 3);
    lastFrameTime = now;

    windTime += 0.005 * delta;
    const baseWind = Math.sin(windTime) * 0.18;

    nextGustTime -= 16.6 * delta;
    if (nextGustTime <= 0) {
      gustForce = (Math.random() - 0.4) * 0.6;
      nextGustTime = 6000 + Math.random() * 7000;
    }
    gustForce *= Math.pow(gustDecay, delta);
    const totalWind = baseWind + gustForce;

    if (ctx && canvasW && canvasH) {
      ctx.clearRect(0, 0, canvasW, canvasH);

      leaves.forEach(leaf => {
        leaf.update(delta, totalWind);
        leaf.render(ctx);
      });
    }

    requestAnimationFrame(animateLeaves);
  }

  // ==========================================================================
  // 6. ENCHANTED INTRO SEQUENCE TIMELINE (0s - 6s)
  // ==========================================================================
  function clearAllIntroTimers() {
    introTimers.forEach(id => clearTimeout(id));
    introTimers = [];
  }

  function runIntroSequence() {
    clearAllIntroTimers();
    document.body.classList.remove('intro-ready', 'skip-intro-active');
    document.body.classList.add('intro-running');

    if (heroTagline) heroTagline.classList.remove('in');
    if (readerCharacter) readerCharacter.classList.remove('in');
    if (heroTitle) heroTitle.classList.remove('in');
    if (heroAction) heroAction.classList.remove('in');
    leafGenerationRamp = 0;

    // 1. 0s to 3s: Background artwork fades in with subtle zoom-out
    introTimers.push(setTimeout(() => {
      document.body.classList.add('intro-ready');
    }, 120));

    // 2. 2.0s: Leaves start gently drifting (gradual ramp)
    introTimers.push(setTimeout(() => {
      const startTime = performance.now();
      const rampInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1600;
        leafGenerationRamp = Math.min(1, elapsed);
        if (leafGenerationRamp >= 1) clearInterval(rampInterval);
      }, 50);
    }, 2000));

    // 3. 3.2s: Tagline floats in smoothly
    introTimers.push(setTimeout(() => {
      if (heroTagline) heroTagline.classList.add('in');
    }, 3200));

    // 3b. 3.8s: Reader character fades in with tiny upward drift after tree appears
    introTimers.push(setTimeout(() => {
      if (readerCharacter) readerCharacter.classList.add('in');
    }, CONFIG.reader.introDelayMs));

    // 4. 4.6s: Brand Name in Great Vibes script
    introTimers.push(setTimeout(() => {
      if (heroTitle) heroTitle.classList.add('in');
    }, 4600));

    // 5. 6.0s: Button floats in
    introTimers.push(setTimeout(() => {
      if (heroAction) heroAction.classList.add('in');
      document.body.classList.remove('intro-running');

      sessionStorage.setItem(CONFIG.storageKeyIntro, 'true');
    }, 6000));
  }

  function skipToFinalState() {
    clearAllIntroTimers();
    document.body.classList.remove('intro-running');
    document.body.classList.add('skip-intro-active', 'intro-ready');

    leafGenerationRamp = 1;

    if (heroTagline) heroTagline.classList.add('in');
    if (readerCharacter) readerCharacter.classList.add('in');
    if (heroTitle) heroTitle.classList.add('in');
    if (heroAction) heroAction.classList.add('in');

    sessionStorage.setItem(CONFIG.storageKeyIntro, 'true');
  }

  // ==========================================================================
  // 7. DESKTOP MOUSE PARALLAX (Subtle 8px on stage)
  // ==========================================================================
  function initParallax() {
    if (window.innerWidth <= 768 || prefersReducedMotion) return;

    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      const px = -dx * CONFIG.mouseParallaxMaxPx;
      const py = -dy * (CONFIG.mouseParallaxMaxPx * 0.6);

      if (stage) {
        stage.style.transform = `translateX(${px}px) translateY(${py}px)`;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // 8. MOBILE HAMBURGER MENU
  // ==========================================================================
  function initMobileMenu() {
    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen.toString());
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================================================
  // 9. EVENT LISTENERS & LIFECYCLE
  // ==========================================================================
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    applyReaderPosition();
    const isMobile = window.innerWidth <= 768;
    const targetCount = isMobile ? CONFIG.leafCounts.mobile : CONFIG.leafCounts.desktop;
    if (leaves.length !== targetCount) {
      initLeaves();
    }
  });

  const exploreBtn = document.getElementById('exploreBtn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('story-garden');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ==========================================================================
  // 10. INITIALIZATION
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initFireflies();
    initParallax();
    applyReaderPosition();

    preloadSprites(() => {
      resizeCanvas();
      initLeaves();
      requestAnimationFrame(animateLeaves);

      const hasPlayed = sessionStorage.getItem(CONFIG.storageKeyIntro) === 'true';

      if (prefersReducedMotion || hasPlayed) {
        skipToFinalState();
      } else {
        runIntroSequence();
      }
    });
  });

})();
