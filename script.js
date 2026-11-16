/**
 * ============================================================================
 * Under The Tuba Tree, Full Homepage Script
 * Moonlit Night Theme · Vanilla JS · Canvas Leaves · Intro Timeline
 * ============================================================================
 */

(function () {
  'use strict';

  // Domain configuration (update here when moving to custom domain)
  const SITE_URL = 'https://underthetubatree.vercel.app';
  window.SITE_URL = SITE_URL;

  // ==========================================================================
  // FALLING LEAVES CONFIGURATION (Hero Background Tuning)
  // Expose leaf tuning parameters cleanly at the top of script.js
  // ==========================================================================
  const LEAVES_CONFIG = {
    leafCountDesktop: 28,      // Total leaves on desktop (28)
    leafCountMobile: 12,       // Total leaves on mobile (12: clipped to visible right stage)
    fallSpeedMultiplier: 1.3,  // Fall speed multiplier (+30% natural fall speed)
    startDelay: 400,           // Delay in ms before leaves begin (0.4s = 400ms)
    // Canopy foliage spawn zones in stage percentages (x: 30-98%, y: 5-34%)
    // Covers the natural foliage arch and branch canopy across the artwork
    spawnZones: [
      { xMin: 30, xMax: 54, yMin: 8, yMax: 26 },  // Left canopy bough
      { xMin: 48, xMax: 78, yMin: 5, yMax: 32 },  // Center blossoms & high canopy
      { xMin: 72, xMax: 98, yMin: 6, yMax: 34 }   // Right bough & outer canopy
    ]
  };
  const { leafCountDesktop, leafCountMobile, fallSpeedMultiplier, startDelay } = LEAVES_CONFIG;

  // ==========================================================================
  // HERO ARTWORK & MOBILE POSITIONING CONFIGURATION (max-width: 899px)
  // • posX: horizontal focal point (28% centers main trunk & lantern branch on right half)
  // • posY: vertical focal point (60%)
  // • heightMobile: viewport coverage min(88svh, 760px)
  // ==========================================================================
  const HERO_MOBILE_CONFIG = {
    posX: '28%',
    posY: '60%',
    heightMobile: 'min(88svh, 760px)'
  };

  const HERO_ARTWORK_CONFIG = {
    heightMobile: HERO_MOBILE_CONFIG.heightMobile
  };

  const READER_CONFIG = {
    desktop: {
      right: 1.5,   // Distance from stage right edge (1.5%)
      bottom: 'calc(72px + 24px)', // Distance from stage bottom edge: ends at least 24px above 72px wave
      left: 'auto', // Left auto
      width: 20.0   // Width as % of stage width (20%)
    },
    mobile: {
      right: '14px',  // At least 12px margin on the right, fully visible, uncropped
      bottom: '58px', // Clears bottom wave with >= 22px buffer
      left: 'auto',
      width: 'clamp(140px, 38vw, 195px)'
    },
    introDelayMs: 3800
  };

  // ==========================================================================
  // NEWSLETTER CONFIGURATION (MailerLite / Email Provider Integration)
  // Plug in your MailerLite form endpoint URL here when ready.
  // While endpoint is empty, the form runs safely in demo mode.
  // ==========================================================================
  const NEWSLETTER_CONFIG = {
    provider: "MailerLite",
    endpoint: "",
    method: "POST"
  };

  // ==========================================================================
  // CONTACT FORM CONFIGURATION
  // Connect your form service endpoint here that delivers to hello@underthetubatree.com.
  // While endpoint is empty, the form runs safely in demo mode with prefilled mailto fallback.
  // ==========================================================================
  const CONTACT_CONFIG = {
    endpoint: "",
    method: "POST"
  };

  // ==========================================================================
  // 1. SITE CONTENT OBJECT
  // All editable texts, links, badges, and placeholders live here
  // ==========================================================================
  const SITE_CONTENT = {
    topBar: {
      tagline: 'Stories • Dreams • Deen',
      ctaText: 'Get notified',
      ctaHref: '#story-circle'
    },
    navigation: [
      { label: 'Books', href: '#explore' },
      { label: 'Story Garden', href: '#story-garden' },
      { label: 'About', href: '#author' },
      { label: 'Contact', href: '#contact' }
    ],
    hero: {
      showIntroLine: false,
      introLine: 'Every leaf holds a story...',
      headline: 'Where Stories Take Root',
      brand: 'Under The Tuba Tree',
      tagline: 'Stories that grow from the heart.',
      intro: 'Picture books rooted in faith, family and Pakistani heritage, for little hearts who need to feel seen.',
      btnExploreText: 'Explore Our Stories',
      btnExploreHref: '#explore',
      btnAuthorText: 'Meet the Author',
      btnAuthorHref: '#author'
    },
    explore: {
      heading: 'Explore Our Stories',
      intro: 'Every story has a little something to share. Discover stories that nurture hearts, celebrate our roots and bring imagination to life.',
      cards: [
        {
          id: 'heartfelt-stories',
          title: 'Heartfelt Stories',
          desc: 'Stories about love, family, hope, loss and the feelings that connect us.',
          featuring: 'Featuring Whispers from Jannah',
          badge: 'Our first book',
          badgeType: 'published',
          href: '#featured-book',
          image: 'assets/heartfelt-stories.webp',
          imageAlt: 'A mother and her little girl hugging in a golden garden',
          imageContain: false,
          imgWidth: 800,
          imgHeight: 600
        },
        {
          id: 'little-roots',
          title: 'Little Roots',
          desc: 'Pakistani childhood, cousin adventures, family traditions and imaginative tales.',
          badge: 'In development',
          badgeType: 'upcoming',
          href: '#little-roots',
          image: 'assets/images/little-roots.png',
          imageAlt: 'Children playing in a sunny Pakistani courtyard under a mango tree',
          imageContain: false,
          imgWidth: 800,
          imgHeight: 600
        },
        {
          id: 'dreams-deen',
          title: 'Dreams \u0026 Deen',
          desc: 'Stories inspired by faith, kindness, Islamic values and childhood imagination.',
          badge: 'A future direction',
          badgeType: 'upcoming',
          href: '#story-garden',
          image: 'assets/images/dreams-deen.png',
          imageAlt: 'Books and a glowing lantern on a prayer mat under a moonlit sky',
          imageContain: false,
          imgWidth: 800,
          imgHeight: 600
        }
      ]
    },
    featuredBook: {
      label: 'Featured book',
      heading: 'Our First Little Story',
      title: 'Whispers from Jannah',
      coverImage: 'assets/cover.jpg',
      coverAlt: 'Whispers from Jannah book cover',
      paragraphs: [
        'A tender story of love, loss, faith and hope. Whispers from Jannah offers a gentle perspective on the comfort of knowing our loved ones are safe in Jannah.',
        'A heartfelt story created to offer comfort and open meaningful conversations about love, loss and remembrance.'
      ],
      themesLabel: 'Themes explored',
      themes: ['Love', 'Loss', 'Faith', 'Hope', 'Remembrance'],
      audienceLabel: 'Who it is for',
      audienceText: 'A gentle, heartfelt story that can help families approach difficult emotions and conversations. Ages 4 to 8, also ideal for parent or caregiver read-aloud.',
      buyUrl: '',
      btnCopyText: 'Get your copy',
      statusText: 'Growing quietly, and almost ready to share.',
      btnNotifyText: 'Get notified',
      btnInsideText: 'Look inside',
      lookInsideHeading: 'A glimpse inside Whispers from Jannah',
      lookInsideNote: 'Preview artwork. The full story is in the book.',
      lookInsideImages: [
        {
          src: 'assets/look-inside-1.webp',
          alt: 'Whispers from Jannah book cover'
        },
        {
          src: 'assets/look-inside-2.webp',
          alt: 'Mother and daughter by a river with a palace in the distance'
        },
        {
          src: 'assets/look-inside-3.webp',
          alt: 'A glowing palace made of clouds in the sky'
        },
        {
          src: 'assets/look-inside-4.webp',
          alt: 'Mother and daughter walking hand in hand toward a sunset palace'
        }
      ]
    },
    storyGarden: {
      heading: "What\u2019s Growing Beneath Our Tree?",
      subtitle: 'Every story begins with a seed. Here\u2019s what we\u2019re nurturing.'
    },
    littleRoots: {
      label: 'Pakistani Stories Collection',
      heading: 'Little Roots',
      tagline: 'The Pakistani childhood you remember, in picture-book form.',
      question: 'What does growing up Pakistani feel like?',
      paragraph1: 'It\'s endless cousin adventures, summer afternoons beneath mango trees, family gatherings filled with laughter, familiar traditions and whispered stories that make bedtime a little more magical.',
      paragraph2: 'Little Roots is a growing collection celebrating the beauty of Pakistani childhood through stories filled with culture, family, imagination and faith.',
      exploreTitle: 'The collection may explore:',
      exploreItems: [
        'Pakistani childhood memories',
        'Cousin adventures',
        'Family traditions',
        'Imaginative jinn tales',
        'Cultural celebrations',
        'Islamic values woven into everyday stories'
      ],
      badge: 'In Development',
      statusLine: 'In Development',
      btnText: 'Get notified',
      btnHref: '#story-circle',
      image: 'assets/little-roots.webp',
      imageAlt: 'Children playing beneath a mango tree in a warm Pakistani courtyard'
    },
    author: {
      heading: 'Meet Tuba Seyal',
      tagline: 'Author. Storyteller. Dreamer.',
      image: 'assets/author.webp',
      imageAlt: 'Tuba Seyal',
      greeting: 'Welcome beneath my tree!',
      p1: "I'm Tuba Seyal, the author behind Under The Tuba Tree, a little world created from a love of stories, meaningful connections and the magic of childhood.",
      p2: 'My hope is to create stories that reach beyond the pages, stories that nurture imagination, celebrate cultural roots, explore faith and offer comfort to little hearts.',
      p3: 'From heartfelt stories like Whispers from Jannah to the adventures taking root in Little Roots, I believe every child deserves stories that make them feel seen, connected and inspired.',
      p4: 'Thank you for being part of this growing story.',
      signature: 'With love, Tuba.',
      btnStoryText: 'Read My Story',
      btnStoryHref: 'author.html'
    },
    storyCircle: {
      heading: 'Get notified.',
      subtitle: "Let's grow a little garden of stories together.",
      paragraph: 'Be the first to hear about new books, upcoming collections, behind-the-scenes moments and little announcements from beneath our tree.',
      buttonText: 'Subscribe',
      consentText: 'I agree to receive emails from Under The Tuba Tree. I can unsubscribe at any time. Read our Privacy Policy.',
      privacyNote: 'We respect your privacy. We will never share your email.',
      successMessage: 'Thank you, and welcome to the Story Circle! Please check your inbox to confirm your subscription.',
      errorMessage: 'Please enter a valid email address.'
    },
    social: {
      instagram: 'https://instagram.com/underthetubatree',
      facebook: ''
    },
    footer: {
      tagline: 'Stories that grow from the heart.',
      email: 'hello@underthetubatree.com',
      closingLine: 'Thank you for spending a little time beneath our tree.',
      copyright: '© 2026 Tuba Seyal. All rights reserved.',
      privacyPolicy: 'Privacy Policy'
    }
  };

  // ==========================================================================
  // 2. CONFIGURATION OBJECT, Animation, stage and particle values
  // ==========================================================================
  const CONFIG = {
    newsletter: NEWSLETTER_CONFIG,
    contact: CONTACT_CONFIG,
    // ------------------------------------------------------------------------
    // Falling Leaves Tuning Parameters (mapped from top-level LEAVES_CONFIG):
    // • leafCountDesktop:    Total leaves on desktop (28)
    // • leafCountMobile:     Total leaves on mobile (14)
    // • fallSpeedMultiplier: Speed multiplier for falling leaves (1.3 = +30%)
    // • startDelay:          Start delay in ms before leaves appear (400 = 0.4s)
    // ------------------------------------------------------------------------
    leafCountDesktop: LEAVES_CONFIG.leafCountDesktop,
    leafCountMobile: LEAVES_CONFIG.leafCountMobile,
    fallSpeedMultiplier: LEAVES_CONFIG.fallSpeedMultiplier,
    startDelay: LEAVES_CONFIG.startDelay,

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
    reader: READER_CONFIG,

    // 8 leaf sprites, distribution rules applied in LeafParticle.reset()
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
      leavesStartMs:    400,
      headlineMs:       1200,
      brandMs:          2000,
      readerMs:         2400,
      taglineMs:        2600,
      introParaMs:      3200,
      buttonMs:         3800,
      introEndMs:       4400
    },

    firefliesCount: 18,
    storageKeyIntro: 'under_tuba_tree_intro_played'
  };

  const STORY_GARDEN_LEAVES = SITE_CONTENT.storyGarden.leaves;
  const EXPLORE_CARDS = SITE_CONTENT.explore.cards;

  // ==========================================================================
  // 3. DOM ELEMENTS & STATE
  // ==========================================================================
  const stage            = document.getElementById('stage');
  const heroBg           = document.getElementById('heroBg');
  const readerCharacter  = document.getElementById('readerCharacter');
  const leavesCanvas     = document.getElementById('leavesCanvas');
  const firefliesLayer   = document.getElementById('firefliesLayer');

  const heroHeadline     = document.getElementById('heroHeadline');
  const heroBrand        = document.getElementById('heroBrand');
  const heroTagline      = document.getElementById('heroTagline');
  const heroIntro        = document.getElementById('heroIntro');
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
    const isDesktop = window.innerWidth >= 900;
    const pos = isDesktop ? CONFIG.reader.desktop : CONFIG.reader.mobile;

    if (pos.right !== undefined && pos.right !== null) {
      readerCharacter.style.right = (typeof pos.right === 'number') ? `${pos.right}%` : pos.right;
      readerCharacter.style.left  = (pos.left !== undefined) ? ((typeof pos.left === 'number') ? `${pos.left}%` : pos.left) : 'auto';
    } else {
      readerCharacter.style.left  = `${pos.left}%`;
      readerCharacter.style.right = 'auto';
    }
    readerCharacter.style.bottom = (typeof pos.bottom === 'number') ? `${pos.bottom}%` : pos.bottom;
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
    constructor(slotIndex = 0, initialDelayMs = 0, preSeed = false) {
      this.slotIndex = slotIndex;
      this.delay = initialDelayMs;
      this.active = preSeed;
      this.reset(preSeed);
    }

    reset(preSeed = false) {
      this.depth = Math.random();
      const isMobile = window.innerWidth <= 768;

      // Curated palette: plum is rare (~10%), balanced with warm golds, ambers and olives
      const LEAF_PALETTE = [
        'gold',       // Warm gold
        'olive',      // Soft olive
        'amber',      // Autumn amber
        'olive2',     // Fresh olive
        'plum',       // Deep plum (rare: 10%)
        'gold',       // Warm gold
        'green',      // Forest green
        'amber',      // Warm amber
        'olive-dark', // Earthy dark olive
        'gold'        // Radiant gold
      ];

      const type = (this.slotIndex !== undefined)
        ? LEAF_PALETTE[this.slotIndex % LEAF_PALETTE.length]
        : LEAF_PALETTE[Math.floor(Math.random() * LEAF_PALETTE.length)];

      this.type = type;
      this.img = loadedSprites[type] || loadedSprites['gold'];

      // Size calculation with depth perspective: far leaves small, near leaves larger
      const minSize = isMobile ? 18 : CONFIG.leafSizeRange.min;
      const maxSize = isMobile ? 28 : CONFIG.leafSizeRange.max;
      const targetSize = minSize + this.depth * (maxSize - minSize);
      const aspect = (this.img && this.img.naturalHeight)
        ? (this.img.naturalWidth / this.img.naturalHeight) : 1;

      this.width = targetSize * aspect;
      this.height = targetSize;

      // Pick random spawn point from LEAVES_CONFIG.spawnZones
      const zones = (LEAVES_CONFIG.spawnZones && LEAVES_CONFIG.spawnZones.length > 0)
        ? LEAVES_CONFIG.spawnZones
        : [{ xMin: 30, xMax: 98, yMin: 5, yMax: 34 }];
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const spawnXPct = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
      // At least 4 percent below the top edge
      const spawnYPct = Math.max(4, zone.yMin + Math.random() * (zone.yMax - zone.yMin));

      const w = canvasW || window.innerWidth || 1200;
      const h = canvasH || window.innerHeight || 800;

      if (preSeed) {
        // Pre-seeded leaves at page load: placed inside the zones or below them (never above tree or in empty sky at left)
        this.x = (spawnXPct / 100) * w;
        // From spawn point down to lower canopy / drift corridor (max 72% of stage height)
        const preSeedYPct = spawnYPct + Math.random() * (72 - spawnYPct);
        this.y = (Math.max(4, preSeedYPct) / 100) * h;
        this.scale = 1.0;
        this.alpha = (type === 'plum') ? 0.85 : (0.42 + this.depth * 0.46);
        this.fadeIn = false;
        this.active = true;
        this.growElapsed = 900;
      } else {
        // Detaches from foliage: starts at random point inside zone, at least 4% below top
        this.x = (spawnXPct / 100) * w;
        this.y = (spawnYPct / 100) * h;
        // Starts at opacity 0 and scale 0.6
        this.alpha = 0;
        this.scale = 0.6;
        this.fadeIn = true;
        this.growElapsed = 0;
      }

      // Vertical velocity with 30% speed boost (LEAVES_CONFIG.fallSpeedMultiplier = 1.3)
      const baseVy = (0.22 + this.depth * 0.26) * (0.90 + Math.random() * 0.22);
      this.vy = baseVy * (LEAVES_CONFIG.fallSpeedMultiplier || 1.3);

      // Horizontal drift with gentle branch bias and natural breeze
      const swayBias = (spawnXPct < 60) ? -0.25 : 0.25;
      this.vx = (swayBias * (0.06 + Math.random() * 0.08)) + (Math.random() - 0.5) * 0.06;

      // Gentle, natural sway & 3D Flip
      this.swayAngle = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.006 + Math.random() * 0.007;
      this.swayAmp   = 12 + this.depth * 14;

      this.flipAngle = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.007 + Math.random() * 0.010;

      this.rotation = (Math.random() - 0.5) * 0.45;
      this.rotSpeed = (Math.random() - 0.5) * 0.004;

      // Opacity: far leaves are more transparent, plum leaf is deep and visible
      this.baseAlpha = (type === 'plum')
        ? 0.85
        : (0.42 + this.depth * 0.48);
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

      // Over about 0.9s (900ms), fades in to full opacity and grows to full size (scale 0.6 -> 1.0)
      if (this.fadeIn) {
        this.growElapsed += dt * 16.666;
        const progress = Math.min(1, this.growElapsed / 900);
        this.scale = 0.6 + 0.4 * progress;
        this.alpha = this.baseAlpha * progress;
        if (progress >= 1) {
          this.scale = 1.0;
          this.alpha = this.baseAlpha;
          this.fadeIn = false;
        }
      }

      // Ground fade out as leaves settle near roots / moss
      const groundLine = (canvasH || 600) * 0.88;
      if (this.y > groundLine) {
        const fadeProgress = (this.y - groundLine) / ((canvasH || 600) * 0.12);
        this.alpha = Math.max(0, this.baseAlpha * (1 - fadeProgress));
      }

      // When a leaf leaves the stage or reaches the ground line it fades out and respawns inside the zones
      if (this.y > (canvasH || 600) + 30 || this.x < -60 || this.x > (canvasW || 800) + 60 || (this.alpha <= 0 && this.y > groundLine)) {
        this.reset(false);
        // Quicker respawns: at most 0.5s (50ms to 450ms, no long waiting times)
        this.delay = 50 + Math.random() * 400;
        this.active = false;
      }
    }

    render(ctx) {
      if (!this.active || !this.img || this.alpha <= 0) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);

      // Cosine 3D flip, swap to slim sprite when edge-on
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
    const targetCount = isMobile ? LEAVES_CONFIG.leafCountMobile : LEAVES_CONFIG.leafCountDesktop;
    leaves = [];

    // Pre-seed 40% of leaves right away across upper 2/3 of stage
    const preSeedCount = Math.floor(targetCount * 0.40);

    for (let i = 0; i < targetCount; i++) {
      if (i < preSeedCount) {
        // Pre-seeded: immediately active and placed in upper 2/3
        leaves.push(new LeafParticle(i, 0, true));
      } else {
        // Remaining 60%: start within 1.5 seconds (0.1s to 1.5s staggered)
        const delayMs = ((i - preSeedCount) / Math.max(1, targetCount - preSeedCount)) * 1500;
        leaves.push(new LeafParticle(i, delayMs, false));
      }
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

      // ?debug mode: draw translucent rectangles for canopy spawn zones on stage
      const isDebug = window.location.search.includes('debug');
      if (isDebug) {
        ctx.save();
        const zones = (LEAVES_CONFIG.spawnZones && LEAVES_CONFIG.spawnZones.length > 0)
          ? LEAVES_CONFIG.spawnZones
          : [{ xMin: 30, xMax: 98, yMin: 5, yMax: 34 }];
        zones.forEach((z, idx) => {
          const zx = (z.xMin / 100) * canvasW;
          const zy = (z.yMin / 100) * canvasH;
          const zw = ((z.xMax - z.xMin) / 100) * canvasW;
          const zh = ((z.yMax - z.yMin) / 100) * canvasH;
          ctx.fillStyle = 'rgba(232, 211, 161, 0.22)';
          ctx.fillRect(zx, zy, zw, zh);
          ctx.strokeStyle = 'rgba(255, 225, 140, 0.85)';
          ctx.lineWidth = 2;
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.fillStyle = '#FFF9F2';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Canopy Zone ${idx + 1}: x[${z.xMin}-${z.xMax}%] y[${z.yMin}-${z.yMax}%]`, zx + 8, zy + 18);
        });
        ctx.restore();
      }
    }

    requestAnimationFrame(animateLeaves);
  }

  // ==========================================================================
  // 8. THE STORY GARDEN: 3 GROWTH CARDS (Bloom, Sprout, Seed)
  // ==========================================================================
  // Client Content & Config (exposed at the top of the section script)
  const gardenItems = [
    {
      stage: 'bloom',
      badge: 'Our first book',
      title: 'Whispers from Jannah',
      text: 'A heartfelt story about love, loss, faith and hope.',
      buttonLabel: 'Learn about the book',
      href: '#featured-book',
      alt: 'A blossoming tree glowing with lanterns beneath a crescent moon, our first book'
    },
    {
      stage: 'sprout',
      badge: 'In development',
      title: 'Little Roots: Pakistani Stories Collection',
      text: 'A growing collection celebrating the beauty of Pakistani childhood.',
      buttonLabel: 'Discover Little Roots',
      href: '#little-roots',
      alt: 'A young mango sapling in a sunlit Pakistani courtyard, a collection in development'
    },
    {
      stage: 'seed',
      badge: 'Future ideas',
      title: 'More Stories Under the Tree',
      text: 'New adventures, meaningful lessons and imaginative worlds waiting to grow.',
      buttonLabel: 'Get notified',
      href: '#story-circle',
      alt: 'A golden seed glowing in the soil beneath a twilight sky, future story ideas'
    }
  ];

  // Expose configuration globally for fine-tuning without touching markup
  window.gardenItems = gardenItems;

  function initStoryGardenCards() {
    const grid = document.getElementById('sgCardsGrid');
    const fallingLeavesContainer = document.getElementById('sgFallingLeaves');

    // 1. Decorative slow drifting leaves (at most 5 on desktop, 3 on mobile; z-index lower than cards)
    if (fallingLeavesContainer) {
      fallingLeavesContainer.innerHTML = '';
      const isMobile = window.innerWidth <= 899;
      const count = isMobile ? 3 : 5;
      const driftSprites = ['assets/leaf-gold.png', 'assets/leaf-green.png', 'assets/leaf-plum.png'];
      for (let i = 0; i < count; i++) {
        const leaf = document.createElement('img');
        leaf.src = driftSprites[i % driftSprites.length];
        leaf.className = 'sg-drift-leaf';
        leaf.alt = '';
        leaf.setAttribute('aria-hidden', 'true');
        leaf.style.left = `${12 + i * (isMobile ? 36 : 18)}%`;
        leaf.style.top = `${-20 + (i % 3) * 10}px`;
        leaf.style.width = `${isMobile ? 22 : 28}px`;
        leaf.style.height = 'auto';
        leaf.style.animationDuration = `${9 + i * 2.5}s`;
        leaf.style.animationDelay = `${i * 1.8}s`;
        fallingLeavesContainer.appendChild(leaf);
      }
    }

    if (!grid) return;

    // 2. Render cards from gardenItems config
    const items = window.gardenItems || gardenItems;
    grid.innerHTML = items.map((item) => {
      const btnMarkup = item.buttonLabel && item.href
        ? `<a href="${item.href}" class="sg-card__btn">${item.buttonLabel}</a>`
        : `<div class="sg-card__spacer" aria-hidden="true"></div>`;

      return `
        <article class="sg-card sg-card--${item.stage}" aria-label="${item.title}">
          <div class="sg-card__visual">
            <img class="sg-card__img"
                 srcset="assets/garden-${item.stage}-900.webp 900w, assets/garden-${item.stage}-1400.webp 1400w"
                 sizes="(min-width: 900px) 360px, calc(100vw - 40px)"
                 src="assets/garden-${item.stage}-900.webp"
                 width="1774"
                 height="887"
                 loading="lazy"
                 decoding="async"
                 alt="${item.alt}">
          </div>
          <div class="sg-card__body">
            <div class="sg-card__badge-wrap">
              <span class="sg-card__badge sg-card__badge--${item.stage}">${item.badge}</span>
            </div>
            <h3 class="sg-card__title">${item.title}</h3>
            <p class="sg-card__text">${item.text}</p>
            ${btnMarkup}
          </div>
        </article>
      `;
    }).join('');

    // 3. Scroll Reveal: cards fade in and rise 16px in sequence (80ms apart)
    const cards = grid.querySelectorAll('.sg-card');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showCard(card) {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }

    if (prefersReduced || !('IntersectionObserver' in window)) {
      cards.forEach(showCard);
      return;
    }

    // Check if section is already in the viewport on load
    const section = document.getElementById('story-garden');
    const rect = section ? section.getBoundingClientRect() : null;
    const isAlreadyInView = rect && (rect.top < window.innerHeight && rect.bottom > 0);

    if (isAlreadyInView) {
      cards.forEach((card, idx) => {
        setTimeout(() => showCard(card), idx * 80);
      });
    } else {
      // Initially prepare for reveal
      cards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease, box-shadow 250ms ease';
      });

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            cards.forEach((card, idx) => {
              setTimeout(() => showCard(card), idx * 80);
            });
            obs.disconnect();
          }
        });
      }, { threshold: 0.15 });

      observer.observe(grid);
    }
  }

  // ==========================================================================
  // 8b. EXPLORE ILLUSTRATED CARDS GENERATOR
  // ==========================================================================
  function renderExploreCards() {
    const container = document.getElementById('exploreCards');
    if (!container) return;

    // Seed icon SVG for upcoming badges
    const seedIcon = '<svg class="explore-card__seed-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22V12"/><path d="M12 12c-3 0-5-2-5-5s2-4 3.5-4c.8 0 1.2.4 1.5.8.3-.4.7-.8 1.5-.8C15 3 17 4 17 7s-2 5-5 5z"/></svg>';

    container.innerHTML = EXPLORE_CARDS.map(card => {
      const isUpcoming = card.badgeType === 'upcoming';
      const badgeClass = isUpcoming ? 'explore-card__badge--upcoming' : 'explore-card__badge--published';
      const badgeContent = isUpcoming ? `${seedIcon} ${card.badge}` : card.badge;
      const imageClass = card.imageContain ? ' explore-card__img--contain' : '';
      const featuringLine = card.featuring ? `<p class="explore-card__featuring">${card.featuring}</p>` : '';

      return `
        <a href="${card.href}" class="explore-card reveal-on-scroll${isUpcoming ? ' explore-card--upcoming' : ''}">
          <div class="explore-card__img-wrap${card.imageContain ? ' explore-card__img-wrap--sage' : ''}">
            <img
              src="${card.image}"
              alt="${card.imageAlt}"
              class="explore-card__img${imageClass}"
              width="${card.imgWidth}"
              height="${card.imgHeight}"
              loading="lazy"
            />
          </div>
          <div class="explore-card__body">
            <span class="explore-card__badge ${badgeClass}">${badgeContent}</span>
            <h3 class="explore-card__title">${card.title}</h3>
            <p class="explore-card__desc">${card.desc}</p>
            ${featuringLine}
          </div>
        </a>`;
    }).join('');
  }

  // ==========================================================================
  // 8c. FEATURED BOOK: BUY BUTTON STATE + LOOK INSIDE LIGHTBOX
  // ==========================================================================
  function initFeaturedBook() {
    const fb = SITE_CONTENT.featuredBook;
    const buyWrap = document.getElementById('featuredBookBuyWrap');

    // Dynamic buy button: if buyUrl is filled, show active gold link; otherwise anchor to #story-circle
    if (buyWrap) {
      if (fb.buyUrl && fb.buyUrl.trim() !== '') {
        buyWrap.innerHTML = `<a href="${fb.buyUrl}" class="btn-gold" target="_blank" rel="noopener">${fb.btnCopyText}</a>`;
      } else {
        buyWrap.innerHTML = `<a href="#story-circle" class="btn-gold" id="featuredBookBuyBtn" aria-label="Get notified when Whispers from Jannah is ready">Get notified</a>`;
      }
    }

    // ---- Look Inside Lightbox ----
    const lightbox = document.getElementById('lookInsideLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lookInsideBtn = document.getElementById('lookInsideBtn');
    const images = fb.lookInsideImages || [];
    let currentIndex = 0;
    let lastFocusBeforeLightbox = null;
    let touchStartX = 0;
    let touchEndX = 0;

    function updateSlide(idx) {
      currentIndex = idx;
      const item = images[currentIndex];
      if (lightboxImg && item) {
        lightboxImg.src = typeof item === 'string' ? item : item.src;
        lightboxImg.alt = (typeof item === 'object' && item.alt) ? item.alt : `Whispers from Jannah preview page ${currentIndex + 1}`;
      }
      if (lightboxCounter) {
        lightboxCounter.textContent = `Page ${currentIndex + 1} of ${images.length}`;
      }
    }

    function openLightbox() {
      if (!lightbox || images.length === 0) return;
      lastFocusBeforeLightbox = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      updateSlide(0);

      // Focus the close button after opening
      setTimeout(() => {
        if (lightboxClose) lightboxClose.focus();
      }, 100);

      document.addEventListener('keydown', handleLightboxKeydown);
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleLightboxKeydown);
      if (lastFocusBeforeLightbox) {
        lastFocusBeforeLightbox.focus();
      }
    }

    function goNext() {
      updateSlide((currentIndex + 1) % images.length);
    }

    function goPrev() {
      updateSlide((currentIndex - 1 + images.length) % images.length);
    }

    function handleLightboxKeydown(e) {
      if (e.key === 'Escape') {
        closeLightbox();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
        return;
      }
      // Focus trap: Tab cycles through lightbox controls only
      if (e.key === 'Tab') {
        const focusable = lightbox.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
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

    if (lookInsideBtn) {
      lookInsideBtn.addEventListener('click', openLightbox);
    }
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener('click', closeLightbox);
    }
    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', goPrev);
    }
    if (lightboxNext) {
      lightboxNext.addEventListener('click', goNext);
    }

    // Swipe support
    if (lightbox) {
      lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) goNext();
          else goPrev();
        }
      }, { passive: true });
    }
  }

  

  // ==========================================================================
  // 8d. NEWSLETTER FORM (Story Circle Signup with MailerLite / Demo Integration)
  // ==========================================================================
  function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');
    const submitBtn = document.getElementById('newsletterSubmitBtn') || (form ? form.querySelector('button[type="submit"]') : null);
    const consentCheckbox = document.getElementById('newsletterConsent');
    const hpInput = document.getElementById('newsletterHp');
    const successMsg = document.getElementById('newsletterSuccess');
    const errorMsg = document.getElementById('newsletterError');
    if (!form || !emailInput) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check honeypot field (anti-spam)
      if (hpInput && hpInput.value.trim() !== '') {
        // Silently ignore bots
        return;
      }

      // Hide previous messages
      if (successMsg) successMsg.hidden = true;
      if (errorMsg) {
        errorMsg.hidden = true;
        errorMsg.textContent = '';
      }

      const emailVal = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailVal || !emailRegex.test(emailVal)) {
        if (errorMsg) {
          errorMsg.textContent = 'Please enter a valid email address.';
          errorMsg.hidden = false;
        }
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
      }

      if (consentCheckbox && !consentCheckbox.checked) {
        if (errorMsg) {
          errorMsg.textContent = 'Please check the box to agree to receive emails.';
          errorMsg.hidden = false;
        }
        consentCheckbox.focus();
        return;
      }

      emailInput.setAttribute('aria-invalid', 'false');

      // Disable the button while sending
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Subscribe';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const endpoint = NEWSLETTER_CONFIG && NEWSLETTER_CONFIG.endpoint ? NEWSLETTER_CONFIG.endpoint.trim() : '';

      try {
        if (!endpoint) {
          // Demo mode: simulate natural sending delay and display confirmation message
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (successMsg) {
            successMsg.textContent = 'Thank you, and welcome to the Story Circle! Please check your inbox to confirm your subscription.';
            successMsg.hidden = false;
          }
          form.reset();
        } else {
          // Live mode: send to MailerLite endpoint via fetch
          const formData = new FormData(form);
          const response = await fetch(endpoint, {
            method: (NEWSLETTER_CONFIG && NEWSLETTER_CONFIG.method) || 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            if (successMsg) {
              successMsg.textContent = 'Thank you, and welcome to the Story Circle! Please check your inbox to confirm your subscription.';
              successMsg.hidden = false;
            }
            form.reset();
          } else {
            throw new Error('Network response was not ok');
          }
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = 'Something went wrong while connecting. Please try again in a few moments.';
          errorMsg.hidden = false;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // ==========================================================================
  // 8e. CONTACT FORM (Let's Connect with Form Service / Mailto Demo Fallback)
  // ==========================================================================
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const reasonSelect = document.getElementById('contactReason');
    const messageInput = document.getElementById('contactMessage');
    const consentCheckbox = document.getElementById('contactConsent');
    const hpInput = document.getElementById('contactHp');
    const submitBtn = document.getElementById('contactSubmitBtn');
    const successMsg = document.getElementById('contactSuccess');
    const errorMsg = document.getElementById('contactError');
    const mailtoWrap = document.getElementById('contactMailtoFallback');
    const mailtoLink = document.getElementById('contactMailtoLink');

    const nameErr = document.getElementById('contactNameError');
    const emailErr = document.getElementById('contactEmailError');
    const reasonErr = document.getElementById('contactReasonError');
    const messageErr = document.getElementById('contactMessageError');
    const consentErr = document.getElementById('contactConsentError');

    function clearErrors() {
      if (nameErr) nameErr.hidden = true;
      if (emailErr) emailErr.hidden = true;
      if (reasonErr) reasonErr.hidden = true;
      if (messageErr) messageErr.hidden = true;
      if (consentErr) consentErr.hidden = true;
      if (successMsg) successMsg.hidden = true;
      if (errorMsg) errorMsg.hidden = true;
      if (mailtoWrap) mailtoWrap.hidden = true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check honeypot
      if (hpInput && hpInput.value.trim() !== '') {
        return;
      }

      clearErrors();

      let hasError = false;

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const reasonVal = reasonSelect ? reasonSelect.value : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!nameVal) {
        if (nameErr) nameErr.hidden = false;
        if (!hasError && nameInput) nameInput.focus();
        hasError = true;
      }

      if (!emailVal || !emailRegex.test(emailVal)) {
        if (emailErr) emailErr.hidden = false;
        if (!hasError && emailInput) emailInput.focus();
        hasError = true;
      }

      if (!reasonVal) {
        if (reasonErr) reasonErr.hidden = false;
        if (!hasError && reasonSelect) reasonSelect.focus();
        hasError = true;
      }

      if (!messageVal) {
        if (messageErr) messageErr.hidden = false;
        if (!hasError && messageInput) messageInput.focus();
        hasError = true;
      }

      if (consentCheckbox && !consentCheckbox.checked) {
        if (consentErr) consentErr.hidden = false;
        if (!hasError) consentCheckbox.focus();
        hasError = true;
      }

      if (hasError) return;

      const originalBtnText = submitBtn ? submitBtn.textContent : 'Send message';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const endpoint = CONTACT_CONFIG && CONTACT_CONFIG.endpoint ? CONTACT_CONFIG.endpoint.trim() : '';

      try {
        if (!endpoint) {
          // Demo mode: simulate natural sending delay and display success + mailto fallback button
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (successMsg) {
            successMsg.textContent = "Thank you, your message is on its way. I'll reply as soon as I can.";
            successMsg.hidden = false;
          }

          // Build prefilled mailto link
          const subject = encodeURIComponent(`Message from ${nameVal} [${reasonVal}]`);
          const bodyText = encodeURIComponent(`Name: ${nameVal}\nEmail: ${emailVal}\nContacting as: ${reasonVal}\n\nMessage:\n${messageVal}`);
          const mailtoUrl = `mailto:hello@underthetubatree.com?subject=${subject}&body=${bodyText}`;

          if (mailtoLink) {
            mailtoLink.href = mailtoUrl;
          }
          if (mailtoWrap) {
            mailtoWrap.hidden = false;
          }

          form.reset();
        } else {
          // Live mode: send via fetch to configured endpoint
          const formData = new FormData(form);
          const response = await fetch(endpoint, {
            method: (CONTACT_CONFIG && CONTACT_CONFIG.method) || 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            if (successMsg) {
              successMsg.textContent = "Thank you, your message is on its way. I'll reply as soon as I can.";
              successMsg.hidden = false;
            }
            form.reset();
          } else {
            throw new Error('Form service submission failed');
          }
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.hidden = false;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
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
    if (!stage && !heroBg) return;
    clearAllIntroTimers();
    document.body.classList.remove('intro-ready', 'skip-intro-active');
    document.body.classList.add('intro-running');

    // Reset overlay elements
    if (heroHeadline)    heroHeadline.classList.remove('in');
    if (heroBrand)       heroBrand.classList.remove('in');
    if (heroTagline)     heroTagline.classList.remove('in');
    if (heroIntro)       heroIntro.classList.remove('in');
    if (readerCharacter) readerCharacter.classList.remove('in');
    if (heroAction)      heroAction.classList.remove('in');
    leafGenerationRamp = 0; // Starts at 0 until startDelay (0.4s)

    // Background slides to final scale (from 1.03 to 1), ALWAYS visible
    introTimers.push(setTimeout(() => {
      document.body.classList.add('intro-bg-settle');
    }, 120));

    // 0.4s (startDelay): Leaves active with full opacity, no slow ramp
    introTimers.push(setTimeout(() => {
      leafGenerationRamp = 1;
    }, LEAVES_CONFIG.startDelay || 400));

    // 1.2s: H1 headline
    introTimers.push(setTimeout(() => {
      if (heroHeadline) heroHeadline.classList.add('in');
    }, CONFIG.stage.headlineMs));

    // 2.0s: Brand name in script
    introTimers.push(setTimeout(() => {
      if (heroBrand) heroBrand.classList.add('in');
    }, CONFIG.stage.brandMs));

    // 2.4s: Reader character
    introTimers.push(setTimeout(() => {
      if (readerCharacter) readerCharacter.classList.add('in');
    }, CONFIG.stage.readerMs));

    // 2.6s: Tagline in italic serif
    introTimers.push(setTimeout(() => {
      if (heroTagline) heroTagline.classList.add('in');
    }, CONFIG.stage.taglineMs));

    // 3.2s: Intro paragraph
    introTimers.push(setTimeout(() => {
      if (heroIntro) heroIntro.classList.add('in');
    }, CONFIG.stage.introParaMs));

    // 3.8s: Action buttons
    introTimers.push(setTimeout(() => {
      if (heroAction) heroAction.classList.add('in');
    }, CONFIG.stage.buttonMs));

    // 4.4s: Done
    introTimers.push(setTimeout(() => {
      document.body.classList.remove('intro-running');
      sessionStorage.setItem(CONFIG.storageKeyIntro, 'true');
    }, CONFIG.stage.introEndMs));
  }

  function skipToFinalState() {
    if (!stage && !heroBg) return;
    clearAllIntroTimers();
    document.body.classList.remove('intro-running');
    document.body.classList.add('skip-intro-active', 'intro-ready');
    leafGenerationRamp = 1;

    if (heroHeadline)    heroHeadline.classList.add('in');
    if (heroBrand)       heroBrand.classList.add('in');
    if (heroTagline)     heroTagline.classList.add('in');
    if (heroIntro)       heroIntro.classList.add('in');
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
  // 11. MOBILE DRAWER ,  Full-height panel from right with focus trap
  // ==========================================================================
  let lastFocusedElement = null;

  function openDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const toggle = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('drawerClose');
    if (!drawer) return;
    lastFocusedElement = document.activeElement;

    drawer.hidden = false;
    // Force reflow before adding open class for transition
    void drawer.offsetHeight;
    drawer.classList.add('open');
    document.body.classList.add('drawer-open');
    if (toggle) {
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
    }

    // Focus the close button
    setTimeout(() => {
      if (closeBtn) closeBtn.focus();
    }, 100);

    // Listeners
    document.addEventListener('keydown', handleDrawerKeydown);
  }

  function closeDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const toggle = document.getElementById('menuToggle');
    if (!drawer) return;
    drawer.classList.remove('open');
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.documentElement.style.position = '';
    if (toggle) {
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }

    // After transition ends, hide
    setTimeout(() => {
      if (!drawer.classList.contains('open')) {
        drawer.hidden = true;
      }
    }, 350);

    document.removeEventListener('keydown', handleDrawerKeydown);

    // Return focus
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
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
    const drawer = document.getElementById('mobileDrawer');
    const panel = document.getElementById('drawerPanel');
    if (e.key === 'Tab' && panel && drawer && drawer.classList.contains('open')) {
      const focusable = panel.querySelectorAll(
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
    const toggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('mobileDrawer');
    const closeBtn = document.getElementById('drawerClose');
    const backdrop = document.getElementById('drawerBackdrop');
    const panel = document.getElementById('drawerPanel');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDrawer();
      });
    }

    // Backdrop click to close
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDrawer();
      });
    }

    // Close on link click
    drawer.querySelectorAll('.mobile-drawer__link, .mobile-drawer__cta').forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Close on click outside the panel
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('open')) {
        if (panel && !panel.contains(e.target) && !toggle.contains(e.target)) {
          closeDrawer();
        }
      }
    });

    // Close on window resize above 899px
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 900 && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  // ==========================================================================
  // 11b. DYNAMIC HEADER HEIGHT & STICKY SHADOW
  // ==========================================================================
  function updateHeaderHeight() {
    const topBar = document.getElementById('topBar');
    const nav = document.getElementById('mainNav');
    const tbH = topBar ? topBar.offsetHeight : 0;
    const navH = nav ? nav.offsetHeight : 0;
    const total = tbH + navH;
    if (total > 0) {
      document.documentElement.style.setProperty('--header-h', `${total}px`);
      document.documentElement.style.setProperty('--header-total-height', `${total}px`);
    }
  }

  function initHeaderHeightWatcher() {
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
    window.addEventListener('load', updateHeaderHeight, { passive: true });
  }

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
  // Ensures elements in or approaching view are immediately visible with zero blank gap
  // ==========================================================================
  function initScrollReveal() {
    const revealVisibleElements = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach(el => {
        const rect = el.getBoundingClientRect();
        // Immediately reveal if within or near viewport (buffer of 120px)
        if (rect.top <= vh + 120 && rect.bottom >= -60) {
          el.classList.add('is-revealed');
        }
      });
    };

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
      return;
    }

    // Immediate check on load & animation frames to ensure no blank gaps
    revealVisibleElements();
    requestAnimationFrame(revealVisibleElements);
    setTimeout(revealVisibleElements, 100);
    setTimeout(revealVisibleElements, 350);

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.01,
      rootMargin: '120px 0px 80px 0px'
    });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      if (!el.classList.contains('is-revealed')) {
        observer.observe(el);
      }
    });

    window.addEventListener('scroll', revealVisibleElements, { passive: true });
    window.addEventListener('resize', revealVisibleElements, { passive: true });
  }

  // ==========================================================================
  // 12c. PAGE MARGIN DRIFTING LEAVES
  // 3-4 subtle slow leaves drifting in margins only when sections are in view
  // ==========================================================================
  function initMarginDriftingLeaves() {
    const container = document.getElementById('marginLeaves');
    if (!container || prefersReducedMotion || window.innerWidth <= 899) return;

    // Fewer on mobile (2 on mobile, 4 on desktop)
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 2 : 4;
    const sprites = ['assets/leaf-gold.png', 'assets/leaf-plum.png', 'assets/leaf-amber.png', 'assets/leaf-olive.png', 'assets/leaf-green.png'];

    container.innerHTML = '';
    const leavesData = [];

    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.src = sprites[i % sprites.length];
      img.alt = '';
      img.className = 'margin-leaf';
      img.style.width = `${18 + Math.random() * 12}px`;
      img.style.height = 'auto';

      // Position in left or right margin (kept safely inside viewport bounds)
      const isLeft = i % 2 === 0;
      const xPercent = isLeft ? 2 + Math.random() * 4 : 88 + Math.random() * 4;
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
  // 12d. ACTIVE NAV SCROLL OBSERVER (IntersectionObserver with gold underline)
  // ==========================================================================
  function initActiveNavScrollObserver() {
    if (document.body.classList.contains('page-author')) {
      const desktopLinks = document.querySelectorAll('.nav-link');
      const drawerLinks = document.querySelectorAll('.mobile-drawer__link');
      desktopLinks.forEach(l => l.classList.remove('active'));
      drawerLinks.forEach(l => l.classList.remove('active'));
      const desktopAuthor = document.querySelector('.nav-link[href="author.html"], .nav-link[href$="author.html"]');
      const drawerAuthor = document.querySelector('.mobile-drawer__link[href="author.html"], .mobile-drawer__link[href$="author.html"]');
      if (desktopAuthor) desktopAuthor.classList.add('active');
      if (drawerAuthor) drawerAuthor.classList.add('active');
      return;
    }

    const sectionToNavMap = {
      'top': null,
      'explore': 'explore',
      'featured-book': 'explore',
      'story-garden': 'story-garden',
      'little-roots': 'story-garden',
      'author': 'author',
      'story-circle': 'contact',
      'contact': 'contact'
    };

    const navSections = [
      document.getElementById('top') || document.querySelector('.hero-section'),
      document.getElementById('explore'),
      document.getElementById('featured-book'),
      document.getElementById('story-garden'),
      document.getElementById('little-roots'),
      document.getElementById('author'),
      document.getElementById('story-circle'),
      document.getElementById('contact')
    ].filter(Boolean);

    const desktopLinks = document.querySelectorAll('.nav-link');
    const drawerLinks = document.querySelectorAll('.mobile-drawer__link');

    function setActive(targetId) {
      const mappedId = sectionToNavMap[targetId];
      desktopLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (mappedId && href === `#${mappedId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      drawerLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (mappedId && href === `#${mappedId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    if (!('IntersectionObserver' in window)) {
      setActive('explore');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id || 'top';
          setActive(id);
        }
      });
    }, {
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0
    });

    navSections.forEach(sec => observer.observe(sec));
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
    const targetCount = isMobile ? LEAVES_CONFIG.leafCountMobile : LEAVES_CONFIG.leafCountDesktop;
    if (leaves.length !== targetCount) {
      initLeaves();
    }
  });

  // ==========================================================================
  // 13B. FOOTER INITIALIZATION
  // ==========================================================================
  function initFooter() {
    const fbLink = document.getElementById('footerFacebookLink');
    if (fbLink) {
      if (SITE_CONTENT.social && SITE_CONTENT.social.facebook && SITE_CONTENT.social.facebook.trim() !== '') {
        fbLink.href = SITE_CONTENT.social.facebook;
        fbLink.style.display = 'inline-flex';
      } else {
        fbLink.style.display = 'none';
      }
    }
  }

  function initPrivacyToc() {
    const toc = document.getElementById('privacyToc');
    if (toc && window.innerWidth <= 600) {
      toc.removeAttribute('open');
    }
  }

  // ==========================================================================
  // 14. INITIALIZATION
  // ==========================================================================
  function onHeroBgReady(callback) {
    if (!stage && !heroBg) return;
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
    initHeaderHeightWatcher();
    // Seamless fallback for mobile portrait source until client supplies the file
    const mobilePortraitSource = document.querySelector('source[srcset*="hero-bg-mobile.jpg"]');
    if (mobilePortraitSource) {
      const probe = new Image();
      probe.src = 'assets/hero-bg-mobile.jpg';
      probe.onerror = () => {
        if (mobilePortraitSource && mobilePortraitSource.parentNode) {
          mobilePortraitSource.remove();
        }
      };
    }

    initMobileDrawer();
    initScrollShadow();
    initPrivacyToc();
    initFireflies();
    initParallax();
    initSmoothScroll();
    applyReaderPosition();
    initStoryGardenCards();
    renderExploreCards();
    initFeaturedBook();
    initActiveNavScrollObserver();
    initNewsletterForm();
    initContactForm();
    initFooter();
    initScrollReveal();
    initMarginDriftingLeaves();

    // Hero intro: only runs if hero elements are present
    if (stage || heroBg) {
      onHeroBgReady(() => {
        const hasPlayed = sessionStorage.getItem(CONFIG.storageKeyIntro) === 'true';

        if (prefersReducedMotion || hasPlayed) {
          skipToFinalState();
        } else {
          runIntroSequence();
        }
      });
    }

    // Load leaf sprites in parallel (never blocks intro) - only if canvas and stage exist
    if (leavesCanvas && stage) {
      preloadSprites(() => {
        resizeCanvas();
        initLeaves();
        requestAnimationFrame(animateLeaves);
      });
    }
  });

})();
