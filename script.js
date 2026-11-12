/**
 * ============================================================================
 * Under The Tuba Tree — Full Homepage Script
 * Moonlit Night Theme · Vanilla JS · Canvas Leaves · Intro Timeline
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION OBJECT — Tune all values here
  // ==========================================================================
  const CONFIG = {
    mouseParallaxMaxPx: 8,

    // Lantern Glow Positions (% of stage coordinate space)
    lanterns: [
      { left: 50.0, top: 31.0 },
      { left: 72.0, top: 20.0 },
      { left: 79.5, top: 25.0 },
      { left: 71.5, top: 41.0 },
      { left: 92.5, top: 43.0 }
    ],

    // Reader Character (% of stage coordinate space)
    reader: {
      desktop: { left: 66, bottom: 4, width: 31 },
      mobile:  { left: 69, bottom: 8.5, width: 25 },
      introDelayMs: 3800
    },

    // Falling Leaves
    leafCounts: {
      desktop: 20,
      mobile: 13
    },

    // 8 leaf sprites — distribution rules applied in LeafParticle.reset()
    sprites: [
      { id: 'gold',       src: 'assets/leaf-gold.png',       dark: false },
      { id: 'olive',      src: 'assets/leaf-olive.png',      dark: false },
      { id: 'olive2',     src: 'assets/leaf-olive2.png',     dark: false },
      { id: 'amber',      src: 'assets/leaf-amber.png',      dark: false },
      { id: 'slim',       src: 'assets/leaf-slim.png',       dark: false },
      { id: 'plum',       src: 'assets/leaf-plum.png',       dark: true  },
      { id: 'green',      src: 'assets/leaf-green.png',      dark: true  },
      { id: 'olive-dark', src: 'assets/leaf-olive-dark.png', dark: true  }
    ],

    // Leaf size in screen pixels
    leafSizeRange: {
      min: 14,
      max: 26
    },

    // Intro timings (ms)
    stage: {
      leavesStartMs:    2000,
      taglineMs:        3200,
      readerMs:         3800,
      headlineMs:       4200,
      signatureMs:      4200,
      buttonMs:         5500,
      introEndMs:       6200
    },

    firefliesCount: 18,
    storageKeyIntro: 'under_tuba_tree_intro_played'
  };

  // ==========================================================================
  // 2. UPCOMING COLLECTIONS CONFIGURATION (The Story Garden)
  // Adding a new book or collection takes 30 seconds: just add one object here!
  // Properties: (id, title, badge, desc, tags, sprite, actionText, actionType, actionHref)
  // ==========================================================================
  const UPCOMING_COLLECTIONS = [
    {
      id: 'family-adventures',
      title: 'Family Adventures [to confirm]',
      badge: 'In Development',
      badgeClass: 'coming',
      desc: 'Heartwarming stories celebrating family bonds, sibling love, outdoor play, and the joyful everyday moments that turn into lifelong memories.',
      tags: ['Family bonds', 'Sibling adventures', 'Everyday joy'],
      sprite: 'assets/leaf-gold.png',
      actionText: 'Notify me when ready',
      actionType: 'notify',
      actionHref: ''
    },
    {
      id: 'islamic-storytelling',
      title: 'Islamic Storytelling [to confirm]',
      badge: 'In Development',
      badgeClass: 'coming',
      desc: 'Gentle, engaging stories rooted in Prophetic wisdom, compassion, thankfulness, and moral courage, crafted for curious young hearts.',
      tags: ['Islamic values', 'Prophetic wisdom', 'Kindness'],
      sprite: 'assets/leaf-green.png',
      actionText: 'Notify me when ready',
      actionType: 'notify',
      actionHref: ''
    },
    {
      id: 'imaginative-tales',
      title: 'Imaginative Tales [to confirm]',
      badge: 'In Development',
      badgeClass: 'coming',
      desc: 'Whimsical bedtime adventures filled with wonder, imagination, and gentle lessons that inspire sweet dreams and curiosity.',
      tags: ['Bedtime stories', 'Wonder', 'Creativity'],
      sprite: 'assets/leaf-plum.png',
      actionText: 'Notify me when ready',
      actionType: 'notify',
      actionHref: ''
    },
    {
      id: 'story-circle-seed',
      title: 'More Stories Growing',
      badge: 'The Story Circle',
      badgeClass: 'invite',
      desc: 'Our story tree is always blossoming with new ideas. Join our Story Circle to be the first to see manuscript previews, cover reveals and launch dates.',
      tags: ['Early previews', 'Author notes', 'New releases'],
      sprite: 'assets/leaf-amber.png',
      actionText: 'Join our Story Circle',
      actionType: 'link',
      actionHref: '#newsletter'
    }
  ];

  // ==========================================================================
  // 2b. EXPLORE NAVIGATION CARDS — Update titles/descriptions here
  // ==========================================================================
  const NAV_CARDS = [
    {
      title: 'Our Books',
      desc: 'Discover meaningful children\'s stories.',
      href: '#featured-book',
      // Book icon SVG
      icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C49A58" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>'
    },
    {
      title: 'The Story Garden',
      desc: 'Explore upcoming books and collections.',
      href: '#story-garden',
      // Tree icon SVG
      icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C49A58" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M8 22h8"/><path d="M12 12c-3.5 0-6-2.5-6-6 0-2.5 2-4 4-4 1 0 1.5.5 2 1 .5-.5 1-1 2-1 2 0 4 1.5 4 4 0 3.5-2.5 6-6 6z"/><path d="M8 14c-1.5.5-3 .5-4-1"/><path d="M16 14c1.5.5 3 .5 4-1"/></svg>'
    },
    {
      title: 'Meet the Author',
      desc: 'Learn about Tuba Seyal.',
      href: '#about',
      // Heart + feather icon SVG
      icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C49A58" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    },
    {
      title: 'Little Readers\' Corner',
      desc: 'Activities, reading resources and creative downloads.',
      href: '#readers-corner',
      // Star icon SVG
      icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C49A58" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    }
  ];

  // ==========================================================================
  // 2c. LITTLE READERS' CORNER DATA — Easy to update downloads and resources
  // ==========================================================================
  const READERS_CORNER_RESOURCES = [
    {
      id: 'coloring-pages',
      title: 'Free Coloring Pages',
      desc: 'Bring the stories to life with beautiful printable character and scene sheets designed for little hands.',
      status: 'download',
      badge: 'Free Download',
      buttonText: 'Download',
      buttonHref: '#',
      // Custom line illustration: Crayon and leaf (Gold #C49A58 and Deep Plum #542D45)
      illustration: `
        <svg class="readers-tile__svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Crayon in Deep Plum -->
          <path d="M22 60 L18 64 L20 54 L44 30 L52 38 Z" stroke="#542D45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M18 64 L22 60" stroke="#542D45" stroke-width="2.2"/>
          <path d="M40 34 L48 42" stroke="#542D45" stroke-width="1.8"/>
          <!-- Crayon tip stripes -->
          <path d="M27 47 L35 55" stroke="#C49A58" stroke-width="1.8" stroke-dasharray="2 2"/>
          <!-- Delicate leaf in Gold -->
          <path d="M38 46 C38 32 54 22 66 18 C64 30 56 46 42 46 Z" stroke="#C49A58" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M38 46 C48 38 56 30 66 18" stroke="#C49A58" stroke-width="1.8" stroke-linecap="round"/>
          <!-- Little decorative sparkles -->
          <circle cx="58" cy="46" r="1.5" fill="#C49A58"/>
          <circle cx="28" cy="24" r="1.5" fill="#C49A58"/>
        </svg>
      `
    },
    {
      id: 'reading-activities',
      title: 'Reading Activities',
      desc: 'Thoughtful guided questions, story maps and playful discussions to deepen connection with every book.',
      status: 'coming',
      badge: 'Coming Soon',
      buttonText: 'Coming Soon',
      buttonHref: '#',
      // Custom line illustration: Open book with a shining star (Gold #C49A58 and Deep Plum #542D45)
      illustration: `
        <svg class="readers-tile__svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Open book in Deep Plum -->
          <path d="M40 58 C32 54 22 54 14 56 L14 26 C22 24 32 24 40 28 C48 24 58 24 66 26 L66 56 C58 54 48 54 40 58 Z" stroke="#542D45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M40 28 L40 58" stroke="#542D45" stroke-width="2.2" stroke-linecap="round"/>
          <!-- Book page lines -->
          <path d="M20 34 C26 33 32 34 35 36" stroke="#542D45" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M20 42 C26 41 32 42 35 44" stroke="#542D45" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M45 36 C48 34 54 33 60 34" stroke="#542D45" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M45 44 C48 42 54 41 60 42" stroke="#542D45" stroke-width="1.5" stroke-linecap="round"/>
          <!-- Rising five-pointed star in Gold -->
          <path d="M40 10 L42.5 17 L50 17 L44 21.5 L46.5 28.5 L40 24 L33.5 28.5 L36 21.5 L30 17 L37.5 17 Z" stroke="#C49A58" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      `
    },
    {
      id: 'educator-resources',
      title: 'Parent and Educator Resources',
      desc: 'Gentle discussion guides, grief support tools and family reading prompts crafted for meaningful moments.',
      status: 'coming',
      badge: 'Coming Soon',
      buttonText: 'Coming Soon',
      buttonHref: '#',
      // Custom line illustration: Two caring figures and a shared book (Gold #C49A58 and Deep Plum #542D45)
      illustration: `
        <svg class="readers-tile__svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Parent figure (left) -->
          <circle cx="28" cy="22" r="5" stroke="#542D45" stroke-width="2.2"/>
          <path d="M18 42 C18 34 22 30 28 30 C31 30 33 31 35 33" stroke="#542D45" stroke-width="2.2" stroke-linecap="round"/>
          <!-- Child figure (right) -->
          <circle cx="48" cy="28" r="4.2" stroke="#C49A58" stroke-width="2"/>
          <path d="M41 44 C41 38 44 35 48 35 C52 35 55 38 55 44" stroke="#C49A58" stroke-width="2" stroke-linecap="round"/>
          <!-- Shared open book below in Gold and Plum -->
          <path d="M38 60 C30 56 22 56 16 58 L16 46 C22 44 30 44 38 48 C46 44 54 44 60 46 L60 58 C54 56 46 56 38 60 Z" stroke="#C49A58" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M38 48 L38 60" stroke="#C49A58" stroke-width="2.2"/>
          <path d="M28 30 C32 30 36 33 37 38" stroke="#542D45" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>
        </svg>
      `
    }
  ];

  // ==========================================================================
  // 3. DOM ELEMENTS & STATE
  // ==========================================================================
  const stage            = document.getElementById('stage');
  const heroBg           = document.getElementById('heroBg');
  const readerCharacter  = document.getElementById('readerCharacter');
  const leavesCanvas     = document.getElementById('leavesCanvas');
  const firefliesLayer   = document.getElementById('firefliesLayer');

  const heroTagline      = document.getElementById('heroTagline');
  const heroHeadline     = document.getElementById('heroHeadline');
  const heroSignature    = document.getElementById('heroSignature');
  const heroAction       = document.getElementById('heroAction');

  const menuToggle       = document.getElementById('menuToggle');
  const mainNav          = document.getElementById('mainNav');

  // Mobile Drawer elements
  const mobileDrawer     = document.getElementById('mobileDrawer');
  const drawerBackdrop   = document.getElementById('drawerBackdrop');
  const drawerClose      = document.getElementById('drawerClose');
  const drawerPanel      = document.getElementById('drawerPanel');

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
  // 4. ASSET PRELOADER
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
        if (loadedCount === total && typeof callback === 'function') callback();
      };
      img.onerror = () => {
        console.warn(`[TubaTree] Leaf sprite failed: ${item.src}`);
        loadedCount++;
        if (loadedCount === total && typeof callback === 'function') callback();
      };
    });
  }

  // ==========================================================================
  // 5. FIREFLIES (positioned inside the stage's lower two-thirds)
  // ==========================================================================
  function initFireflies() {
    if (!firefliesLayer) return;
    firefliesLayer.innerHTML = '';

    for (let i = 0; i < CONFIG.firefliesCount; i++) {
      const fly = document.createElement('div');
      fly.className = 'firefly';
      const top = 35 + Math.random() * 55;
      const left = 15 + Math.random() * 75;
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
  // 6. READER CHARACTER POSITIONING
  // ==========================================================================
  function applyReaderPosition() {
    if (!readerCharacter || !CONFIG.reader) return;
    const isMobile = window.innerWidth < 768;
    const pos = isMobile ? CONFIG.reader.mobile : CONFIG.reader.desktop;

    readerCharacter.style.left   = `${pos.left}%`;
    readerCharacter.style.bottom = `${pos.bottom}%`;
    readerCharacter.style.width  = `${pos.width}%`;
  }

  // ==========================================================================
  // 7. CANVAS & LEAF SIMULATION (Natural Staggered Branch Emitter)
  // ==========================================================================

  // Natural canopy branch release nodes across the tree artwork
  const DESKTOP_BRANCH_NODES = [
    { xRatio: 0.32, yRatio: -0.04, swayBias: -0.35, baseAngle: -0.30 }, // Left outer bough
    { xRatio: 0.44, yRatio: -0.06, swayBias: 0.25,  baseAngle: 0.20 },  // Mid-left canopy
    { xRatio: 0.54, yRatio: -0.08, swayBias: -0.20, baseAngle: -0.15 }, // High center blossoms
    { xRatio: 0.65, yRatio: -0.05, swayBias: 0.35,  baseAngle: 0.25 },  // Near center lantern
    { xRatio: 0.76, yRatio: -0.07, swayBias: -0.25, baseAngle: -0.20 }, // Right upper bough
    { xRatio: 0.86, yRatio: -0.03, swayBias: 0.40,  baseAngle: 0.35 }   // Right outer branch
  ];

  const MOBILE_BRANCH_NODES = [
    { xRatio: 0.22, yRatio: -0.04, swayBias: -0.35, baseAngle: -0.25 }, // Left blossoms
    { xRatio: 0.38, yRatio: -0.06, swayBias: 0.25,  baseAngle: 0.20 },  // Left-center canopy
    { xRatio: 0.52, yRatio: -0.08, swayBias: -0.15, baseAngle: -0.10 }, // High center blossoms
    { xRatio: 0.68, yRatio: -0.05, swayBias: 0.35,  baseAngle: 0.25 },  // Right lantern bough
    { xRatio: 0.82, yRatio: -0.03, swayBias: -0.25, baseAngle: -0.20 }  // Right outer canopy
  ];

  class LeafParticle {
    constructor(initialDelayMs = 0, slotIndex = 0) {
      this.slotIndex = slotIndex;
      this.delay = initialDelayMs;
      this.active = false;
      this.reset();
    }

    reset() {
      this.depth = Math.random();

      const isMobile = window.innerWidth <= 768;
      
      // USER PRIORITY: Significantly higher quantity of leaf-plum.png in BOTH desktop and mobile!
      // Guarantee alternating plum leaves plus random chance so ~60% of all leaves are deep plum
      let type;
      if (this.slotIndex % 2 === 0 || Math.random() < 0.35) {
        type = 'plum';
      } else {
        const otherTypes = ['gold', 'olive', 'olive2', 'amber', 'green'];
        type = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      }

      this.type = type;
      this.img = loadedSprites[type];

      const minSize = isMobile ? 18 : CONFIG.leafSizeRange.min;
      const maxSize = isMobile ? 30 : CONFIG.leafSizeRange.max;
      const targetSize = minSize + this.depth * (maxSize - minSize);
      const aspect = (this.img && this.img.naturalHeight)
        ? (this.img.naturalWidth / this.img.naturalHeight) : 1;

      this.width = targetSize * aspect;
      this.height = targetSize;

      // Pick branch node (staggered across canopy, avoiding identical positions)
      const nodes = isMobile ? MOBILE_BRANCH_NODES : DESKTOP_BRANCH_NODES;
      const nodeIndex = (this.slotIndex !== undefined)
        ? (this.slotIndex + Math.floor(Math.random() * (nodes.length - 1) + 1)) % nodes.length
        : Math.floor(Math.random() * nodes.length);
      const node = nodes[nodeIndex];

      // Natural jitter around branch tip
      const xJitter = (Math.random() - 0.5) * 0.08 * (canvasW || 800);
      const yJitter = (Math.random() - 0.5) * 26;
      this.x = ((canvasW || 800) * node.xRatio) + xJitter;
      this.y = ((canvasH || 600) * node.yRatio) + yJitter - this.height;

      // Gentle vertical velocity with subtle depth variance (prevents leaves lining up)
      this.vy = (0.19 + this.depth * 0.24) * (0.88 + Math.random() * 0.26);

      // Horizontal drift with gentle branch bias and natural breeze
      this.vx = (node.swayBias * (0.06 + Math.random() * 0.08)) + (Math.random() - 0.5) * 0.06;

      // Sway & 3D Flip (each leaf has its own independent cadence)
      this.swayAngle = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.006 + Math.random() * 0.007;
      this.swayAmp   = 12 + this.depth * 14;

      this.flipAngle = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.007 + Math.random() * 0.010;

      // Release at branch's natural angle with organic tilt
      this.rotation = node.baseAngle + (Math.random() - 0.5) * 0.35;
      this.rotSpeed = (Math.random() - 0.5) * 0.004;

      // Opacity: rich and solid for deep plum leaves so they stand out clearly
      this.baseAlpha = (type === 'plum')
        ? 0.82 + this.depth * 0.18
        : 0.55 + this.depth * 0.40;
      this.alpha = 0;
      this.fadeIn = true;
    }

    update(dt, windX) {
      if (this.delay > 0) {
        this.delay -= dt * 16.666;
        return;
      }
      this.active = true;

      this.swayAngle += this.swaySpeed * dt;
      this.flipAngle += this.flipSpeed * dt;
      this.rotation  += this.rotSpeed * dt;

      const swayOffset = Math.sin(this.swayAngle) * (this.swayAmp * 0.016);
      this.x += (this.vx + swayOffset + windX) * dt;
      this.y += this.vy * dt;

      if (this.fadeIn) {
        this.alpha += 0.016 * dt;
        if (this.alpha >= this.baseAlpha) {
          this.alpha = this.baseAlpha;
          this.fadeIn = false;
        }
      }

      // Ground fade out as leaves settle near roots / moss
      const groundLine = (canvasH || 600) * 0.86;
      if (this.y > groundLine) {
        const fadeProgress = (this.y - groundLine) / ((canvasH || 600) * 0.14);
        this.alpha = Math.max(0, this.baseAlpha * (1 - fadeProgress));
      }

      // Once landed or drifted out: reset with a random rest interval
      if (this.y > (canvasH || 600) + 30 || this.x < -60 || this.x > (canvasW || 800) + 60 || (this.alpha <= 0 && this.y > groundLine)) {
        this.reset();
        // Staggered rest interval: leaves fall one after another, never in synchronized batches
        this.delay = 1200 + Math.random() * 3800;
        this.active = false;
      }
    }

    render(ctx) {
      if (!this.active || !this.img || this.alpha <= 0) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // Cosine 3D flip — swap to slim sprite when edge-on
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

    const rect = stage.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;

    leavesCanvas.width  = canvasW * dpr;
    leavesCanvas.height = canvasH * dpr;

    ctx = leavesCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function initLeaves() {
    const isMobile = window.innerWidth <= 768;
    const targetCount = isMobile ? CONFIG.leafCounts.mobile : CONFIG.leafCounts.desktop;
    leaves = [];

    // First 3 or 4 leaves start falling sequentially from distinct branch points,
    // followed by staggered releases so leaves never drop in clustered batches
    for (let i = 0; i < targetCount; i++) {
      let initialDelay;
      if (i === 0) {
        initialDelay = 0;     // 1st leaf drops immediately from Branch 1
      } else if (i === 1) {
        initialDelay = 650;   // 2nd leaf drops from Branch 3
      } else if (i === 2) {
        initialDelay = 1500;  // 3rd leaf drops from Branch 5
      } else if (i === 3) {
        initialDelay = 2500;  // 4th leaf drops from Branch 2
      } else {
        // Subsequent leaves gently space out over time
        initialDelay = 3600 + (i - 4) * 1400 + Math.random() * 700;
      }
      leaves.push(new LeafParticle(initialDelay, i));
    }
    window.__tubaLeaves = leaves;
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
    const baseWind = Math.sin(windTime) * 0.16;

    nextGustTime -= 16.6 * delta;
    if (nextGustTime <= 0) {
      gustForce = (Math.random() - 0.4) * 0.55;
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
  // 8. THE STORY GARDEN — UPCOMING COLLECTIONS
  // Easily extensible: update or add entries to UPCOMING_COLLECTIONS array
  // ==========================================================================
  function renderStoryGardenUpcoming() {
    const grid = document.getElementById('sgCollectionsGrid');
    if (!grid || typeof UPCOMING_COLLECTIONS === 'undefined') return;

    grid.innerHTML = '';

    UPCOMING_COLLECTIONS.forEach(col => {
      const card = document.createElement('article');
      card.className = `sg-card ${col.badgeClass === 'invite' ? 'sg-card--invite' : ''}`;
      card.setAttribute('aria-label', col.title);

      const tagsHtml = (col.tags && col.tags.length > 0)
        ? `<div class="sg-card__tags">${col.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
        : '';

      const actionHtml = col.actionType === 'link'
        ? `<a href="${col.actionHref}" class="btn-gold">${col.actionText}</a>`
        : `<button type="button" class="btn-outline sg-notify-trigger" data-title="${encodeURIComponent(col.title)}">${col.actionText}</button>`;

      card.innerHTML = `
        <div class="sg-card__top">
          <div class="sg-card__header">
            <span class="sg-card__badge ${col.badgeClass === 'invite' ? 'sg-card__badge--invite' : ''}">${col.badge}</span>
            <img src="${col.sprite}" alt="" class="sg-card__leaf-icon" aria-hidden="true" width="32" height="32">
          </div>
          <h4 class="sg-card__title">${col.title}</h4>
          <p class="sg-card__desc">${col.desc}</p>
          ${tagsHtml}
        </div>
        <div class="sg-card__action">
          ${actionHtml}
        </div>
      `;

      grid.appendChild(card);
    });

    // Attach click listeners to all notify buttons in Section 5
    const notifyTriggers = document.querySelectorAll('.sg-notify-trigger');
    notifyTriggers.forEach(btn => {
      btn.addEventListener('click', () => {
        const title = decodeURIComponent(btn.dataset.title || 'Upcoming Stories');
        openNotifyModal(title);
      });
    });
  }

  // ==========================================================================
  // 8b. NOTIFY MODAL
  // ==========================================================================
  let lastFocusedBeforeModal = null;

  function openNotifyModal(bookTitle) {
    const modal = document.getElementById('notifyModal');
    const heading = document.getElementById('notifyHeading');
    const desc = document.getElementById('notifyDesc');
    const input = document.getElementById('notifyEmail');
    const successMsg = document.getElementById('notifySuccess');
    const form = document.getElementById('notifyForm');
    if (!modal) return;

    lastFocusedBeforeModal = document.activeElement;

    if (heading) heading.textContent = `Get Notified`;
    if (desc) desc.textContent = `We will let you know as soon as "${bookTitle}" is ready.`;
    if (input) {
      input.value = '';
    }
    if (successMsg) successMsg.hidden = true;
    if (form) form.hidden = false;

    modal.hidden = false;

    setTimeout(() => {
      if (input) input.focus();
    }, 50);

    document.addEventListener('keydown', handleNotifyModalKeydown);
  }

  function closeNotifyModal() {
    const modal = document.getElementById('notifyModal');
    if (!modal) return;
    modal.hidden = true;
    document.removeEventListener('keydown', handleNotifyModalKeydown);

    if (lastFocusedBeforeModal) {
      lastFocusedBeforeModal.focus();
      lastFocusedBeforeModal = null;
    }
  }

  function handleNotifyModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeNotifyModal();
      return;
    }

    if (e.key === 'Tab') {
      const card = document.getElementById('notifyCard');
      if (!card) return;
      const focusable = card.querySelectorAll('input, button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function initNotifyModal() {
    const modal = document.getElementById('notifyModal');
    const closeBtn = document.getElementById('notifyClose');
    const backdrop = document.getElementById('notifyBackdrop');
    const form = document.getElementById('notifyForm');
    const successMsg = document.getElementById('notifySuccess');

    if (closeBtn) closeBtn.addEventListener('click', closeNotifyModal);
    if (backdrop) backdrop.addEventListener('click', closeNotifyModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        form.hidden = true;
        if (successMsg) successMsg.hidden = false;
        setTimeout(() => {
          closeNotifyModal();
        }, 2200);
      });
    }
  }



  // ==========================================================================
  // 8b. EXPLORE NAVIGATION CARDS GENERATOR
  // ==========================================================================
  function renderExploreCards() {
    const container = document.getElementById('exploreCards');
    if (!container) return;

    container.innerHTML = NAV_CARDS.map(card => `
      <a href="${card.href}" class="explore-card">
        <div class="explore-card__icon">${card.icon}</div>
        <h3 class="explore-card__title">${card.title}</h3>
        <p class="explore-card__desc">${card.desc}</p>
      </a>
    `).join('');
  }

  // ==========================================================================
  // 8c. LITTLE READERS' CORNER GENERATOR
  // ==========================================================================
  function renderReadersCorner() {
    const container = document.getElementById('readersTiles');
    if (!container) return;

    container.innerHTML = READERS_CORNER_RESOURCES.map(res => {
      const isComingSoon = res.status === 'coming';
      const badgeClass = isComingSoon ? 'readers-tile__badge--coming' : 'readers-tile__badge--download';
      const buttonClass = isComingSoon ? 'btn-outline readers-tile__btn--disabled' : 'btn-gold';
      const buttonAttr = isComingSoon ? 'aria-disabled="true"' : '';

      return `
        <article class="readers-tile" aria-labelledby="readers-tile-title-${res.id}">
          <div class="readers-tile__header">
            <div class="readers-tile__illustration">
              ${res.illustration}
            </div>
            <span class="readers-tile__badge ${badgeClass}">${res.badge}</span>
          </div>
          <h3 class="readers-tile__title" id="readers-tile-title-${res.id}">${res.title}</h3>
          <p class="readers-tile__desc">${res.desc}</p>
          <div class="readers-tile__action">
            <a href="${res.buttonHref}" class="${buttonClass}" ${buttonAttr}>
              ${res.buttonText}
            </a>
          </div>
        </article>
      `;
    }).join('');
  }

  // ==========================================================================
  // 8d. NEWSLETTER FORM (Story Circle Signup with Validation & Feedback)
  // ==========================================================================
  function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');
    const hpInput = document.getElementById('newsletterHp');
    const successMsg = document.getElementById('newsletterSuccess');
    const errorMsg = document.getElementById('newsletterError');
    if (!form || !emailInput) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check honeypot field (anti-spam)
      if (hpInput && hpInput.value.trim() !== '') {
        // Silently ignore bots
        return;
      }

      const emailVal = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailVal || !emailRegex.test(emailVal)) {
        if (errorMsg) errorMsg.hidden = false;
        if (successMsg) successMsg.hidden = true;
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
      }

      // Valid placeholder submission
      emailInput.setAttribute('aria-invalid', 'false');
      if (errorMsg) errorMsg.hidden = true;
      if (successMsg) successMsg.hidden = false;
      emailInput.value = '';
    });
  }

  // ==========================================================================
  // 9. INTRO SEQUENCE TIMELINE
  //    Background NEVER fades from opacity 0. Only overlays animate.
  // ==========================================================================
  function clearAllIntroTimers() {
    introTimers.forEach(id => clearTimeout(id));
    introTimers = [];
  }

  function runIntroSequence() {
    clearAllIntroTimers();
    document.body.classList.remove('intro-ready', 'skip-intro-active');
    document.body.classList.add('intro-running');

    // Reset overlay elements
    if (heroTagline)   heroTagline.classList.remove('in');
    if (heroHeadline)  heroHeadline.classList.remove('in');
    if (heroSignature) heroSignature.classList.remove('in');
    if (readerCharacter) readerCharacter.classList.remove('in');
    if (heroAction)    heroAction.classList.remove('in');
    leafGenerationRamp = 0;

    // Background slides to final scale (from 1.03 to 1) — ALWAYS visible
    introTimers.push(setTimeout(() => {
      document.body.classList.add('intro-ready');
    }, 120));

    // 2.0s: Leaves start gradually
    introTimers.push(setTimeout(() => {
      const startTime = performance.now();
      const rampInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1600;
        leafGenerationRamp = Math.min(1, elapsed);
        if (leafGenerationRamp >= 1) clearInterval(rampInterval);
      }, 50);
    }, CONFIG.stage.leavesStartMs));

    // 3.2s: Tagline
    introTimers.push(setTimeout(() => {
      if (heroTagline) heroTagline.classList.add('in');
    }, CONFIG.stage.taglineMs));

    // 3.8s: Reader character
    introTimers.push(setTimeout(() => {
      if (readerCharacter) readerCharacter.classList.add('in');
    }, CONFIG.stage.readerMs));

    // 4.2s: Main headline + script signature
    introTimers.push(setTimeout(() => {
      if (heroHeadline) heroHeadline.classList.add('in');
      if (heroSignature) heroSignature.classList.add('in');
    }, CONFIG.stage.headlineMs));

    // 5.5s: Button
    introTimers.push(setTimeout(() => {
      if (heroAction) heroAction.classList.add('in');
    }, CONFIG.stage.buttonMs));

    // 6.2s: Done
    introTimers.push(setTimeout(() => {
      document.body.classList.remove('intro-running');
      sessionStorage.setItem(CONFIG.storageKeyIntro, 'true');
    }, CONFIG.stage.introEndMs));
  }

  function skipToFinalState() {
    clearAllIntroTimers();
    document.body.classList.remove('intro-running');
    document.body.classList.add('skip-intro-active', 'intro-ready');
    leafGenerationRamp = 1;

    if (heroTagline)     heroTagline.classList.add('in');
    if (heroHeadline)    heroHeadline.classList.add('in');
    if (heroSignature)   heroSignature.classList.add('in');
    if (readerCharacter) readerCharacter.classList.add('in');
    if (heroAction)      heroAction.classList.add('in');

    sessionStorage.setItem(CONFIG.storageKeyIntro, 'true');
  }

  // ==========================================================================
  // 10. PARALLAX (Desktop only)
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
  // 11. MOBILE DRAWER — Full-height panel from right with focus trap
  // ==========================================================================
  let lastFocusedElement = null;

  function openDrawer() {
    if (!mobileDrawer) return;
    lastFocusedElement = document.activeElement;

    mobileDrawer.hidden = false;
    // Force reflow before adding open class for transition
    void mobileDrawer.offsetHeight;
    mobileDrawer.classList.add('open');
    document.body.classList.add('drawer-open');
    menuToggle.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');

    // Focus the close button
    setTimeout(() => {
      if (drawerClose) drawerClose.focus();
    }, 100);

    // Listeners
    document.addEventListener('keydown', handleDrawerKeydown);
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    document.body.classList.remove('drawer-open');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');

    // After transition ends, hide
    setTimeout(() => {
      mobileDrawer.hidden = true;
    }, 350);

    document.removeEventListener('keydown', handleDrawerKeydown);

    // Return focus
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function handleDrawerKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
      return;
    }

    // Focus trap
    if (e.key === 'Tab' && drawerPanel) {
      const focusable = drawerPanel.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function initMobileDrawer() {
    if (!menuToggle || !mobileDrawer) return;

    menuToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close button
    if (drawerClose) {
      drawerClose.addEventListener('click', closeDrawer);
    }

    // Backdrop click to close
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeDrawer);
    }

    // Close on link click
    if (drawerPanel) {
      drawerPanel.querySelectorAll('.mobile-drawer__link, .mobile-drawer__cta').forEach(link => {
        link.addEventListener('click', () => {
          closeDrawer();
        });
      });
    }
  }

  // ==========================================================================
  // 11b. STICKY HEADER — Shadow on scroll
  // ==========================================================================
  function initScrollShadow() {
    if (!mainNav) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 10) {
            mainNav.classList.add('main-nav--scrolled');
          } else {
            mainNav.classList.remove('main-nav--scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // 12. SMOOTH SCROLL FOR ANCHOR LINKS (Accounting for Sticky Header)
  // ==========================================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          // Header offset calculation
          const headerHeight = (mainNav ? mainNav.offsetHeight : 76) + (document.getElementById('topBar') ? document.getElementById('topBar').offsetHeight : 38);
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Manage focus for accessibility
          if (target.getAttribute('tabindex') === null) {
            target.setAttribute('tabindex', '-1');
          }
          target.focus({ preventScroll: true });
        }
      });
    });
  }

  // ==========================================================================
  // 12b. SCROLL REVEAL (IntersectionObserver with 12px fade-up)
  // ==========================================================================
  function initScrollReveal() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
  }

  // ==========================================================================
  // 12c. PAGE MARGIN DRIFTING LEAVES
  // 3-4 subtle slow leaves drifting in margins only when sections are in view
  // ==========================================================================
  function initMarginDriftingLeaves() {
    const container = document.getElementById('marginLeaves');
    if (!container || prefersReducedMotion) return;

    // Fewer on mobile (2 on mobile, 4 on desktop)
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 2 : 4;
    const sprites = ['assets/leaf-plum.png', 'assets/leaf-gold.png', 'assets/leaf-plum.png', 'assets/leaf-amber.png'];

    container.innerHTML = '';
    const leavesData = [];

    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.src = sprites[i % sprites.length];
      img.alt = '';
      img.className = 'margin-leaf';
      img.style.width = `${18 + Math.random() * 12}px`;
      img.style.height = 'auto';

      // Position in left or right margin
      const isLeft = i % 2 === 0;
      const xPercent = isLeft ? 2 + Math.random() * 6 : 92 + Math.random() * 5;
      img.style.left = `${xPercent}vw`;
      img.style.top = `${15 + i * 22}vh`;

      container.appendChild(img);

      leavesData.push({
        el: img,
        baseY: 15 + i * 22,
        speed: 0.002 + Math.random() * 0.003,
        swayAmp: 10 + Math.random() * 15,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    // Monitor section visibility to toggle active state
    let isAnyContentVisible = false;
    const contentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isAnyContentVisible = true;
        }
      });
      leavesData.forEach(l => {
        if (isAnyContentVisible) {
          l.el.classList.add('is-active');
        } else {
          l.el.classList.remove('is-active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('section[id]').forEach(sec => contentObserver.observe(sec));

    // Gentle floating loop
    let startTime = performance.now();
    function animateMarginLeaves(now) {
      if (!isPageVisible || prefersReducedMotion) {
        requestAnimationFrame(animateMarginLeaves);
        return;
      }
      const elapsed = (now - startTime) * 0.001;

      leavesData.forEach((l, idx) => {
        const sway = Math.sin(elapsed * 0.8 + idx) * l.swayAmp;
        const driftY = Math.sin(elapsed * 0.5 + idx * 2) * 12;
        l.rot += l.rotSpeed;
        l.el.style.transform = `translate3d(${sway}px, ${driftY}px, 0) rotate(${l.rot}deg)`;
      });

      requestAnimationFrame(animateMarginLeaves);
    }
    requestAnimationFrame(animateMarginLeaves);
  }

  // ==========================================================================
  // 13. EVENT LISTENERS & LIFECYCLE
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

  // ==========================================================================
  // 14. INITIALIZATION
  // ==========================================================================
  function onHeroBgReady(callback) {
    let fired = false;
    const done = () => {
      if (fired) return;
      fired = true;
      document.body.classList.add('bg-loaded');
      callback();
    };

    if (!heroBg || (heroBg.complete && heroBg.naturalWidth > 0)) {
      done();
    } else {
      heroBg.addEventListener('load', done, { once: true });
      heroBg.addEventListener('error', done, { once: true });
      setTimeout(done, 3000);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileDrawer();
    initScrollShadow();
    initFireflies();
    initParallax();
    initSmoothScroll();
    applyReaderPosition();
    renderStoryGardenUpcoming();
    initNotifyModal();
    renderExploreCards();
    renderReadersCorner();
    initNewsletterForm();
    initScrollReveal();
    initMarginDriftingLeaves();

    // Hero intro — background is ALWAYS visible, never fades from opacity 0
    onHeroBgReady(() => {
      const hasPlayed = sessionStorage.getItem(CONFIG.storageKeyIntro) === 'true';

      if (prefersReducedMotion || hasPlayed) {
        skipToFinalState();
      } else {
        runIntroSequence();
      }
    });

    // Load leaf sprites in parallel (never blocks intro)
    preloadSprites(() => {
      resizeCanvas();
      initLeaves();
      requestAnimationFrame(animateLeaves);
    });
  });

})();
