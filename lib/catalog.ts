/*
 * Mock catalogue — the shape mirrors the BRD's data model:
 * every physical stone is a unique SKU with its own custody record,
 * two certificates, published per-ratti and per-piece pricing, and an
 * honest scarcity flag. Designs carry Puranic stories and live piece counts.
 */

export type CustodyStep = {
  step: string;
  who: string;
  where: string;
  date: string;
  note?: string;
};

export type Stone = {
  sku: string;
  slug: string;
  gem: "pukhraj" | "manik" | "neelam" | "panna";
  gemName: string;
  english: string;
  planet: string;
  planetGlyph: string;
  purpose: string[];
  carat: number;
  ratti: number;
  origin: string;
  originDetail: string;
  treatment: "Natural · Unheated" | "Natural · Untreated";
  colour: string;
  clarity: string;
  cut: string;
  /** structured facets — one ratti value can exist in many shapes and shades */
  shape: string;
  shade: string;
  shadeHex: string;
  pricePerRatti: number;
  price: number;
  oneOfOne: boolean;
  /** house quality tier — Shuddh < Uttam < Maha-Uttam */
  grade?: "Shuddh" | "Uttam" | "Maha-Uttam";
  image: string;
  brings: string;
  custody: CustodyStep[];
};

export type Design = {
  slug: string;
  name: string;
  sanskrit: string;
  gloss: string;
  form: "Ring" | "Pendant" | "Bracelet";
  /** design language — lets the buyer narrow a large library */
  style?: "Temple" | "Heritage" | "Minimal" | "Statement";
  story: string;
  confers: string;
  metal: string;
  runSize: number;
  remaining: number; // 0 = archive
  image: string;
};

/* Per-family lore — planet line, brings and wearing ritual, carried over
   from the approved "The Stones" HTML chapters. */
export const GEMS = [
  {
    key: "pukhraj",
    quote:
      "Jupiter rules the 9th house of dharma \u2014 worn on a Thursday, in gold, touching the skin, Pukhraj activates the planet's blessings directly.",
    name: "Pukhraj",
    devanagari: "पुखराज",
    english: "Yellow Sapphire",
    planet: "Jupiter",
    planetLine: "Jupiter · Guru",
    image: "/gems/pukhraj.png",
    brings: "Wisdom, wealth and dharma — the blessing of Guru.",
    brings4: [
      { word: "Wisdom", note: "Sharper judgment, calmer decisions." },
      { word: "Wealth", note: "Steady, compounding prosperity." },
      { word: "Marriage", note: "Harmony and right partnership." },
      { word: "Fortune", note: "Doors that open on time." },
    ],
    ritual: {
      day: "Thursday",
      dayNote: "Jupiter's own day",
      metal: "Gold",
      metalNote: "Set touching the skin",
      finger: "Index",
      fingerNote: "The finger of Guru",
      mantra: "ॐ बृहस्पतये नमः",
      mantraRoman: "Om Brihaspataye Namah",
    },
  },
  {
    key: "manik",
    quote:
      "The Sun is the soul of the zodiac \u2014 Manik on the ring finger, on a Sunday, carries its authority to the wearer.",
    name: "Manik",
    devanagari: "माणिक",
    english: "Ruby",
    planet: "Sun",
    planetLine: "Sun · Surya",
    image: "/gems/manik.png",
    brings: "Authority, vitality and the courage of the Sun.",
    brings4: [
      { word: "Leadership", note: "The room turns when you speak." },
      { word: "Confidence", note: "A steadier inner ground." },
      { word: "Vitality", note: "The Sun's own strength." },
      { word: "Authority", note: "Recognition that holds." },
    ],
    ritual: {
      day: "Sunday",
      dayNote: "The Sun's own day",
      metal: "Gold",
      metalNote: "Set touching the skin",
      finger: "Ring finger",
      fingerNote: "The finger of Surya",
      mantra: "ॐ सूर्याय नमः",
      mantraRoman: "Om Suryaya Namah",
    },
  },
  {
    key: "neelam",
    quote:
      "Saturn rewards discipline swiftly \u2014 Neelam is always trialled first, for its power arrives faster than any other stone.",
    name: "Neelam",
    devanagari: "नीलम",
    english: "Blue Sapphire",
    planet: "Saturn",
    planetLine: "Saturn · Shani",
    image: "/gems/neelam.png",
    brings: "Discipline, focus and Saturn's swift rewards.",
    brings4: [
      { word: "Discipline", note: "Order where there was drift." },
      { word: "Career", note: "Acceleration, once aligned." },
      { word: "Justice", note: "What is owed arrives." },
      { word: "Clarity", note: "The long view, unclouded." },
    ],
    ritual: {
      day: "Saturday",
      dayNote: "Shani's own day",
      metal: "Panchdhatu",
      metalNote: "Five metals, as prescribed",
      finger: "Middle",
      fingerNote: "The finger of Shani",
      mantra: "ॐ शं शनैश्चराय नमः",
      mantraRoman: "Om Sham Shanaishcharaya Namah",
    },
  },
  {
    key: "panna",
    quote:
      "Mercury governs speech and trade \u2014 Panna on the little finger sharpens both, as the texts prescribe.",
    name: "Panna",
    devanagari: "पन्ना",
    english: "Emerald",
    planet: "Mercury",
    planetLine: "Mercury · Budha",
    image: "/gems/panna.png",
    brings: "Intellect, speech and Mercury's quick clarity.",
    brings4: [
      { word: "Intelligence", note: "Quickness with depth." },
      { word: "Communication", note: "Words that land as meant." },
      { word: "Business", note: "The trader's clear eye." },
      { word: "Creativity", note: "Ideas that arrive finished." },
    ],
    ritual: {
      day: "Wednesday",
      dayNote: "Budha's own day",
      metal: "Gold or Silver",
      metalNote: "Set touching the skin",
      finger: "Little finger",
      fingerNote: "The finger of Budha",
      mantra: "ॐ बुधाय नमः",
      mantraRoman: "Om Budhaya Namah",
    },
  },
] as const;

export type GemLore = (typeof GEMS)[number];

const custodyCeylon = (
  sku: string,
  sourced: string,
  assort: string,
  cut: string
): CustodyStep[] => [
  {
    step: "Sourced",
    who: "Ranjith Kumara",
    where: "Ratnapura riverbeds, Sri Lanka",
    date: sourced,
    note: "Hand-panned from living water; origin logged at the pit.",
  },
  {
    step: "Assorted",
    who: "M. Fernando",
    where: "Beruwala assortment house",
    date: assort,
    note: "Graded for colour, transparency and jyotish suitability.",
  },
  {
    step: "Cut & polished",
    who: "S. Jayasuriya",
    where: "Beruwala lapidary",
    date: cut,
    note: "Cut to keep the weight above the certified threshold, never below.",
  },
  {
    step: "Lab certified",
    who: "Independent accredited lab",
    where: "Colombo",
    date: cut,
    note: "Gemological authenticity — natural, treatment disclosed.",
  },
  {
    step: "Vaulted",
    who: "AstroLaabh stone vault",
    where: "Mumbai",
    date: cut,
    note: `In vault as ${sku}; sealed, photographed, awaiting its wearer.`,
  },
  {
    step: "Astro-gemologist assessment",
    who: "Pt. Sandeep Kochaar",
    where: "AstroLaabh house",
    date: cut,
    note: "Astrological Effectiveness Certificate issued — jyotish-grade.",
  },
];

const CURATED_STONES: Stone[] = [
  {
    sku: "AL-PKJ-0417",
    slug: "pukhraj-al-pkj-0417",
    gem: "pukhraj",
    gemName: "Pukhraj",
    english: "Yellow Sapphire",
    planet: "Jupiter",
    planetGlyph: "♃",
    purpose: ["Wealth", "Wisdom", "Marriage"],
    carat: 5.42,
    ratti: 5.96,
    origin: "Ceylon (Sri Lanka)",
    originDetail: "Ratnapura riverbeds — ancient alluvial gravel",
    treatment: "Natural · Unheated",
    colour: "Canary yellow, even saturation",
    clarity: "Eye-clean, VS",
    cut: "Oval mixed cut",
    shape: "Oval",
    shade: "Canary",
    shadeHex: "#F0C93B",
    pricePerRatti: 42000,
    price: 250320,
    oneOfOne: true,
    image: "/pukhraj/loose.jpg",
    brings:
      "A strong Jupiter stone for the 9th house of dharma — prescribed for wealth that compounds and judgment that steadies.",
    custody: custodyCeylon("AL-PKJ-0417", "12 Mar 2026", "26 Mar 2026", "14 Apr 2026"),
  },
  {
    sku: "AL-PKJ-0389",
    slug: "pukhraj-al-pkj-0389",
    gem: "pukhraj",
    gemName: "Pukhraj",
    english: "Yellow Sapphire",
    planet: "Jupiter",
    planetGlyph: "♃",
    purpose: ["Wealth", "Career"],
    carat: 3.18,
    ratti: 3.5,
    origin: "Ceylon (Sri Lanka)",
    originDetail: "Ratnapura riverbeds — ancient alluvial gravel",
    treatment: "Natural · Unheated",
    colour: "Light golden, high transparency",
    clarity: "Eye-clean, VVS",
    cut: "Cushion",
    shape: "Cushion",
    shade: "Light Lemon",
    shadeHex: "#F3E27A",
    pricePerRatti: 36000,
    price: 126000,
    oneOfOne: false,
    image: "/pukhraj/loose.jpg",
    brings:
      "An entry Jupiter stone with exceptional transparency — the quality tradition asks for before size.",
    custody: custodyCeylon("AL-PKJ-0389", "2 Feb 2026", "18 Feb 2026", "9 Mar 2026"),
  },
  {
    sku: "AL-MNK-0122",
    slug: "manik-al-mnk-0122",
    gem: "manik",
    gemName: "Manik",
    english: "Ruby",
    planet: "Sun",
    planetGlyph: "☉",
    purpose: ["Authority", "Health", "Career"],
    carat: 4.05,
    ratti: 4.46,
    origin: "Burma (Myanmar)",
    originDetail: "Mogok valley — marble-hosted",
    treatment: "Natural · Unheated",
    colour: "Pigeon-blood red",
    clarity: "Minor silk, VS",
    cut: "Oval",
    shape: "Oval",
    shade: "Pigeon Blood",
    shadeHex: "#8E0F23",
    pricePerRatti: 58000,
    price: 258680,
    oneOfOne: true,
    image: "/gems/manik.png",
    brings:
      "A Sun stone of rare Mogok saturation — prescribed for authority, recognition and the father's line.",
    custody: [
      {
        step: "Sourced",
        who: "U Thein Win",
        where: "Mogok valley, Myanmar",
        date: "20 Jan 2026",
        note: "Marble-hosted rough, origin logged at the mine head.",
      },
      ...custodyCeylon("AL-MNK-0122", "20 Jan 2026", "8 Feb 2026", "1 Mar 2026").slice(1),
    ],
  },
  {
    sku: "AL-NLM-0208",
    slug: "neelam-al-nlm-0208",
    gem: "neelam",
    gemName: "Neelam",
    english: "Blue Sapphire",
    planet: "Saturn",
    planetGlyph: "♄",
    purpose: ["Career", "Discipline", "Sade Sati"],
    carat: 4.88,
    ratti: 5.37,
    origin: "Ceylon (Sri Lanka)",
    originDetail: "Ratnapura riverbeds — ancient alluvial gravel",
    treatment: "Natural · Unheated",
    colour: "Cornflower blue",
    clarity: "Eye-clean, VS",
    cut: "Oval",
    shape: "Oval",
    shade: "Cornflower",
    shadeHex: "#3E5FA8",
    pricePerRatti: 48000,
    price: 257760,
    oneOfOne: true,
    image: "/gems/neelam.png",
    brings:
      "Saturn's stone — the fastest-acting in the tradition. Always trialled before permanent wearing; our astro-gemologist guides the trial.",
    custody: custodyCeylon("AL-NLM-0208", "28 Feb 2026", "12 Mar 2026", "30 Mar 2026"),
  },
  {
    sku: "AL-PNA-0301",
    slug: "panna-al-pna-0301",
    gem: "panna",
    gemName: "Panna",
    english: "Emerald",
    planet: "Mercury",
    planetGlyph: "☿",
    purpose: ["Intellect", "Speech", "Business"],
    carat: 3.62,
    ratti: 3.98,
    origin: "Colombia",
    originDetail: "Muzo mines — classic old-mine material",
    treatment: "Natural · Untreated",
    colour: "Vivid green, slight blue undertone",
    clarity: "Jardin visible, typical of origin",
    cut: "Emerald step cut",
    shape: "Emerald cut",
    shade: "Vivid Green",
    shadeHex: "#1F8A4C",
    pricePerRatti: 39000,
    price: 155220,
    oneOfOne: false,
    image: "/gems/panna.png",
    brings:
      "Mercury's stone for speech, trade and quick judgment — favoured by founders and advocates.",
    custody: [
      {
        step: "Sourced",
        who: "C. Restrepo",
        where: "Muzo, Colombia",
        date: "15 Dec 2025",
        note: "Old-mine rough, export-documented at origin.",
      },
      ...custodyCeylon("AL-PNA-0301", "15 Dec 2025", "10 Jan 2026", "2 Feb 2026").slice(1),
    ],
  },
  {
    sku: "AL-PKJ-0402",
    slug: "pukhraj-al-pkj-0402",
    gem: "pukhraj",
    gemName: "Pukhraj",
    english: "Yellow Sapphire",
    planet: "Jupiter",
    planetGlyph: "♃",
    purpose: ["Marriage", "Wisdom"],
    carat: 7.21,
    ratti: 7.93,
    origin: "Ceylon (Sri Lanka)",
    originDetail: "Ratnapura riverbeds — ancient alluvial gravel",
    treatment: "Natural · Unheated",
    colour: "Deep golden, exceptional fire",
    clarity: "Eye-clean, VS",
    cut: "Oval mixed cut",
    shape: "Oval",
    shade: "Deep Golden",
    shadeHex: "#C88A1B",
    pricePerRatti: 52000,
    price: 412360,
    oneOfOne: true,
    image: "/pukhraj/hero.jpg",
    brings:
      "A collector-grade Jupiter stone above seven ratti — the weight tradition reserves for a life's turning point.",
    custody: custodyCeylon("AL-PKJ-0402", "3 Mar 2026", "20 Mar 2026", "11 Apr 2026"),
  },
];

/* ————————————————————————————————————————————————————————————————
 * The vault at real scale — every family holds 100+ one-of-one SKUs.
 * Generation is DETERMINISTIC (seeded LCG, no Math.random) so server
 * and client always agree, and a SKU's ratti/price never shift between
 * builds. Curated flagship stones above keep their hand-written custody.
 * ———————————————————————————————————————————————————————————————— */

const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateIn2026 = (rng: () => number, monthMax: number) => {
  const m = Math.floor(rng() * monthMax);
  const d = 1 + Math.floor(rng() * 27);
  return `${d} ${MONTHS[m]} 2026`;
};

type Shade = { name: string; hex: string; note: string };

type FamilySpec = {
  gem: Stone["gem"];
  code: string;
  gemName: string;
  english: string;
  planet: string;
  planetGlyph: string;
  treatment: Stone["treatment"];
  purposes: string[][];
  origins: { origin: string; detail: string; sourcer: string }[];
  shades: Shade[];
  clarities: string[];
  shapes: string[];
  /** ₹/ratti by grade: [Shuddh, Uttam, Maha-Uttam] */
  ppr: [number, number, number];
  images: string[];
  brings: string;
};

const FAMILIES: FamilySpec[] = [
  {
    gem: "pukhraj", code: "PKJ", gemName: "Pukhraj", english: "Yellow Sapphire",
    planet: "Jupiter", planetGlyph: "♃", treatment: "Natural · Unheated",
    purposes: [["Wealth", "Wisdom"], ["Wealth", "Career"], ["Marriage", "Wisdom"], ["Wealth", "Marriage"], ["Career", "Intellect"]],
    origins: [
      { origin: "Ceylon (Sri Lanka)", detail: "Ratnapura riverbeds — ancient alluvial gravel", sourcer: "A. Fernando" },
      { origin: "Burma (Myanmar)", detail: "Mogok tract — old-mine material", sourcer: "U Thein Win" },
    ],
    shades: [
      { name: "Light Lemon", hex: "#F3E27A", note: "Light lemon, high transparency" },
      { name: "Canary", hex: "#F0C93B", note: "Canary yellow, even saturation" },
      { name: "Golden", hex: "#E4A92E", note: "Golden, lively fire" },
      { name: "Deep Golden", hex: "#C88A1B", note: "Deep golden, exceptional fire" },
    ],
    clarities: ["Eye-clean, VVS", "Eye-clean, VS", "Minor inclusions, SI"],
    shapes: ["Oval", "Cushion", "Round", "Pear", "Emerald cut"],
    ppr: [24000, 38000, 54000],
    // real stone photography (placeholder set — replace with house shots before launch)
    images: [
      "/pukhraj/stones/ys-01.png", "/pukhraj/stones/ys-02.png", "/pukhraj/stones/ys-03.png",
      "/pukhraj/stones/ys-04.png", "/pukhraj/stones/ys-05.png", "/pukhraj/stones/ys-06.png",
      "/pukhraj/stones/ys-07.png", "/pukhraj/stones/ys-08.png", "/pukhraj/stones/ys-09.png",
      "/pukhraj/stones/ys-10.png", "/pukhraj/stones/ys-11.png", "/pukhraj/stones/ys-12.png",
    ],
    brings: "A Jupiter stone for the 9th house of dharma — wealth that compounds, judgment that steadies.",
  },
  {
    gem: "manik", code: "MNK", gemName: "Manik", english: "Ruby",
    planet: "Sun", planetGlyph: "☉", treatment: "Natural · Unheated",
    purposes: [["Career", "Health"], ["Career", "Wealth"], ["Health", "Intellect"], ["Career", "Marriage"]],
    origins: [
      { origin: "Burma (Myanmar)", detail: "Mogok valley — marble-hosted", sourcer: "U Thein Win" },
      { origin: "Mozambique", detail: "Montepuez — vivid new-vein material", sourcer: "J. Machava" },
    ],
    shades: [
      { name: "Raspberry", hex: "#C43254", note: "Raspberry red, vivid" },
      { name: "Crimson", hex: "#A61E33", note: "Deep crimson, strong fluorescence" },
      { name: "Pigeon Blood", hex: "#8E0F23", note: "Pigeon-blood red" },
    ],
    clarities: ["Minor silk, VS", "Eye-clean, VS", "Silk visible, SI"],
    shapes: ["Oval", "Cushion", "Round", "Pear"],
    ppr: [30000, 48000, 72000],
    images: ["/gems/manik.png"],
    brings: "A Sun stone — authority, recognition and the father's line.",
  },
  {
    gem: "neelam", code: "NLM", gemName: "Neelam", english: "Blue Sapphire",
    planet: "Saturn", planetGlyph: "♄", treatment: "Natural · Unheated",
    purposes: [["Career", "Intellect"], ["Career", "Wealth"], ["Health", "Career"], ["Career", "Marriage"]],
    origins: [
      { origin: "Ceylon (Sri Lanka)", detail: "Ratnapura riverbeds — ancient alluvial gravel", sourcer: "A. Fernando" },
      { origin: "Madagascar", detail: "Ilakaka fields — clean crystal", sourcer: "H. Rakoto" },
    ],
    shades: [
      { name: "Steel Blue", hex: "#5C7FB8", note: "Steel blue, brilliant" },
      { name: "Cornflower", hex: "#3E5FA8", note: "Cornflower blue" },
      { name: "Royal Blue", hex: "#23388F", note: "Royal blue, velvety" },
    ],
    clarities: ["Eye-clean, VVS", "Eye-clean, VS", "Fine silk, SI"],
    shapes: ["Oval", "Cushion", "Emerald cut", "Round"],
    ppr: [26000, 42000, 64000],
    images: ["/gems/neelam.png"],
    brings: "Saturn's stone — the fastest-acting in the tradition; always trialled before permanent wearing.",
  },
  {
    gem: "panna", code: "PNA", gemName: "Panna", english: "Emerald",
    planet: "Mercury", planetGlyph: "☿", treatment: "Natural · Untreated",
    purposes: [["Intellect", "Career"], ["Intellect", "Wealth"], ["Intellect", "Health"], ["Career", "Wealth"]],
    origins: [
      { origin: "Colombia", detail: "Muzo mines — classic old-mine material", sourcer: "C. Restrepo" },
      { origin: "Zambia", detail: "Kagem — bluish-green, high clarity", sourcer: "M. Banda" },
    ],
    shades: [
      { name: "Grass Green", hex: "#3FA35C", note: "Grass green, high life" },
      { name: "Vivid Green", hex: "#1F8A4C", note: "Vivid green, slight blue undertone" },
      { name: "Deep Velvet", hex: "#14663A", note: "Deep green, velvet" },
    ],
    clarities: ["Jardin visible, typical of origin", "Lightly included, VS", "Eye-clean — rare for origin"],
    shapes: ["Emerald cut", "Oval", "Cushion", "Pear"],
    ppr: [20000, 34000, 52000],
    images: ["/gems/panna.png"],
    brings: "Mercury's stone for speech, trade and quick judgment — favoured by founders and advocates.",
  },
];

const GRADES = ["Shuddh", "Uttam", "Maha-Uttam"] as const;

function generateStones(): Stone[] {
  const out: Stone[] = [];
  const PER_FAMILY = 104;
  for (const fam of FAMILIES) {
    const rng = lcg(fam.code.charCodeAt(0) * 7919 + 17);
    for (let i = 0; i < PER_FAMILY; i++) {
      // quarter-ratti steps — the SAME weight recurs in different shapes & shades
      const ratti = Math.round((2.5 + Math.floor(rng() * 37) * 0.25) * 100) / 100; // 2.50 – 11.50
      const carat = Math.round(ratti * 0.91 * 100) / 100;
      const g = rng();
      const gradeIdx = g < 0.45 ? 0 : g < 0.85 ? 1 : 2;
      const ppr = Math.round((fam.ppr[gradeIdx] * (0.9 + rng() * 0.25)) / 500) * 500;
      const price = Math.round((ppr * ratti) / 10) * 10;
      const origin = fam.origins[Math.floor(rng() * fam.origins.length)];
      const shape = fam.shapes[Math.floor(rng() * fam.shapes.length)];
      const shade = fam.shades[Math.floor(rng() * fam.shades.length)];
      const num = String(1000 + i);
      const sku = `AL-${fam.code}-${num}`;
      const sourced = dateIn2026(rng, 4);
      const custody = [
        { step: "Sourced", who: origin.sourcer, where: origin.origin.split(" (")[0], date: sourced, note: "Origin logged at source, rough documented." },
        { step: "Cut & polished", who: "S. Marapana", where: "Beruwala, Sri Lanka", date: dateIn2026(rng, 6), note: "Single stone, single cutter — weight recorded before and after." },
        { step: "Lab certified", who: "Registered Gemologist", where: "Independent laboratory", date: dateIn2026(rng, 8), note: "Identification report issued against this SKU." },
        { step: "Astro-assessed", who: "Pt. Sandeep Kochaar", where: "AstroLaabh, New Delhi", date: dateIn2026(rng, 10), note: "Astrological Effectiveness Certificate signed." },
      ];
      out.push({
        sku,
        slug: `${fam.gem}-al-${fam.code.toLowerCase()}-${num}`,
        gem: fam.gem,
        gemName: fam.gemName,
        english: fam.english,
        planet: fam.planet,
        planetGlyph: fam.planetGlyph,
        purpose: fam.purposes[Math.floor(rng() * fam.purposes.length)],
        carat,
        ratti,
        origin: origin.origin,
        originDetail: origin.detail,
        treatment: fam.treatment,
        colour: shade.note,
        clarity: fam.clarities[Math.floor(rng() * fam.clarities.length)],
        cut: shape === "Emerald cut" ? "Emerald step cut" : `${shape} mixed cut`,
        shape,
        shade: shade.name,
        shadeHex: shade.hex,
        pricePerRatti: ppr,
        price,
        oneOfOne: rng() < 0.72,
        grade: GRADES[gradeIdx],
        image: fam.images[Math.floor(rng() * fam.images.length)],
        brings: fam.brings,
        custody,
      });
    }
  }
  return out;
}

export const STONES: Stone[] = [...CURATED_STONES, ...generateStones()];

/* Facet helpers — shades are family-specific; shapes are shared vocabulary. */
export const SHADES_BY_GEM: Record<Stone["gem"], { name: string; hex: string }[]> =
  Object.fromEntries(
    FAMILIES.map((f) => [f.gem, f.shades.map((s) => ({ name: s.name, hex: s.hex }))])
  ) as Record<Stone["gem"], { name: string; hex: string }[]>;
export const SHAPES: string[] = [...new Set(FAMILIES.flatMap((f) => f.shapes))];

/* Origin tints — a quiet colour code so provenance reads at a glance.
   Keyed by the short origin name (before any parenthesis). */
export const ORIGIN_TINT: Record<string, string> = {
  Ceylon: "#C3A058",
  Burma: "#A65B4B",
  Mozambique: "#8A79A8",
  Madagascar: "#5C8B7E",
  Colombia: "#4E8B5A",
  Zambia: "#6B8FB3",
};
export const originShort = (origin: string) => origin.split(" (")[0];

/* Cut-out PNGs sit inside their tile; photographs fill it. */
export const imgFit = (src: string) => (src.endsWith(".png") ? "object-contain" : "object-cover");

const CURATED_DESIGNS: Design[] = [
  {
    slug: "surya-prabha-ring",
    name: "Surya Prabha",
    sanskrit: "सूर्यप्रभा",
    gloss: "The radiance of the Sun",
    form: "Ring",
    story:
      "An open-backed solitaire drawn from the sun-disc motifs of early temple jewellery — the stone sits high so light, and skin, touch it from every side.",
    confers:
      "As per the Puranas, the unbroken circle of the sun-disc confers steadiness of position — what rises with it does not easily fall.",
    metal: "22k gold",
    runSize: 12,
    remaining: 4,
    image: "/pukhraj/ring-onhand.jpg",
  },
  {
    slug: "guru-kripa-pendant",
    name: "Guru Kripa",
    sanskrit: "गुरुकृपा",
    gloss: "The grace of Jupiter",
    form: "Pendant",
    story:
      "A pendant on a fine chain, its bezel carved with the eight-petal lotus of the Navagraha shrines — the petals hold the stone the way the tradition holds the wearer.",
    confers:
      "The eight-petal lotus signifies grace arriving from all directions; the texts pair it with Guru for learning and lineage.",
    metal: "22k gold",
    runSize: 18,
    remaining: 11,
    image: "/pukhraj/pendant.jpg",
  },
  {
    slug: "akshaya-band",
    name: "Akshaya",
    sanskrit: "अक्षय",
    gloss: "That which does not diminish",
    form: "Bracelet",
    story:
      "Calibrated stones channel-set in a flexible band — named for Akshaya Tritiya, the day on which what is begun does not diminish.",
    confers:
      "The unbroken channel signifies continuity of fortune; the Puranas tie the word akshaya to wealth that renews itself.",
    metal: "22k gold",
    runSize: 9,
    remaining: 2,
    image: "/pukhraj/bracelet.jpg",
  },
  {
    slug: "trishula-signet",
    name: "Trishula",
    sanskrit: "त्रिशूल",
    gloss: "The trident of resolve",
    form: "Ring",
    story:
      "A signet whose shoulders carry the trident in low relief — cut for a hand that signs, decides and holds.",
    confers:
      "The trident signifies mastery over three worlds — will, word and act; the texts prescribe it for those who carry others' futures.",
    metal: "22k gold",
    runSize: 12,
    remaining: 0,
    image: "/pukhraj/ring.jpg",
  },
  {
    slug: "ravi-tejas-ring",
    name: "Ravi Tejas",
    sanskrit: "रवितेजस्",
    gloss: "The brilliance of the Sun",
    form: "Ring",
    story:
      "A raised four-prong crown that lifts the stone clear of the finger — cut so the whole face catches light, nothing hidden by metal.",
    confers:
      "The open crown signifies nothing standing between the wearer and the planet's grace; prescribed where clarity of purpose is sought.",
    metal: "22k gold",
    runSize: 15,
    remaining: 6,
    image: "/pukhraj/ring.jpg",
  },
  {
    slug: "kesari-ring",
    name: "Kesari",
    sanskrit: "केसरी",
    gloss: "Lion-gold",
    form: "Ring",
    story:
      "A broad-shouldered band with a bezel set low and strong — weighted for a hand that leads, in the manner of the old royal signets.",
    confers:
      "The lion motif signifies command and courage; the texts pair it with the benefic planets for those who hold authority.",
    metal: "22k gold",
    runSize: 10,
    remaining: 3,
    image: "/pukhraj/ring-onhand.jpg",
  },
  {
    slug: "brihaspati-pendant",
    name: "Brihaspati",
    sanskrit: "बृहस्पति",
    gloss: "The great preceptor",
    form: "Pendant",
    story:
      "A minimal bezel pendant on a box chain — the stone worn high at the throat, close to the seat of speech and learning.",
    confers:
      "Named for the guru of the gods; the tradition ties it to knowledge, counsel and the respect of one's peers.",
    metal: "22k gold",
    runSize: 16,
    remaining: 8,
    image: "/pukhraj/pendant.jpg",
  },
  {
    slug: "dhanya-pendant",
    name: "Dhanya",
    sanskrit: "धन्य",
    gloss: "Blessed with plenty",
    form: "Pendant",
    story:
      "A teardrop halo pendant ringed with fine granulation — the halo drawn from the abundance motifs of Lakshmi iconography.",
    confers:
      "The unbroken halo signifies fortune that surrounds and returns; the Puranas link it to prosperity that sustains a household.",
    metal: "22k gold",
    runSize: 12,
    remaining: 5,
    image: "/pukhraj/pendant.jpg",
  },
  {
    slug: "rakshak-band",
    name: "Rakshak",
    sanskrit: "रक्षक",
    gloss: "The protector",
    form: "Bracelet",
    story:
      "A single stone set in a sturdy kada-style band — worn on the wrist as a guard, in the manner of the old raksha bracelets.",
    confers:
      "The closed band signifies protection that does not break; prescribed where the wearer seeks steadiness against adversity.",
    metal: "22k gold",
    runSize: 8,
    remaining: 4,
    image: "/pukhraj/bracelet.jpg",
  },
];

/* The design library at scale — the curated pieces above get a style tag,
   and each form gains further limited runs. Deterministic, like the stones. */
const CURATED_STYLE: Record<string, Design["style"]> = {
  "surya-prabha-ring": "Temple",
  "guru-kripa-pendant": "Temple",
  "akshaya-band": "Minimal",
  "trishula-signet": "Statement",
  "ravi-tejas-ring": "Heritage",
  "kesari-ring": "Statement",
  "brihaspati-pendant": "Heritage",
  "dhanya-pendant": "Minimal",
  "rakshak-band": "Heritage",
};

const DESIGN_POOL: { form: Design["form"]; style: NonNullable<Design["style"]>; name: string; sanskrit: string; gloss: string; image: string }[] = [
  { form: "Ring", style: "Temple", name: "Padma Mudra", sanskrit: "पद्ममुद्रा", gloss: "The lotus seal", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Temple", name: "Meru Shikhar", sanskrit: "मेरुशिखर", gloss: "The peak of Meru", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Heritage", name: "Rajmudra", sanskrit: "राजमुद्रा", gloss: "The royal seal", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Minimal", name: "Bindu", sanskrit: "बिन्दु", gloss: "The single point", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Minimal", name: "Rekha", sanskrit: "रेखा", gloss: "The clean line", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Statement", name: "Vajra Kanti", sanskrit: "वज्रकान्ति", gloss: "The thunderbolt's lustre", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Statement", name: "Simhasan", sanskrit: "सिंहासन", gloss: "The lion throne", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Heritage", name: "Navagraha Kosh", sanskrit: "नवग्रहकोश", gloss: "The planetary treasury", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Temple", name: "Garbha Griha", sanskrit: "गर्भगृह", gloss: "The inner sanctum", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Temple", name: "Deepa Stambh", sanskrit: "दीपस्तम्भ", gloss: "The lamp pillar", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Temple", name: "Kalash", sanskrit: "कलश", gloss: "The sacred vessel", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Heritage", name: "Nizami Jadau", sanskrit: "जड़ाऊ", gloss: "The court inlay", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Heritage", name: "Paatli Vinta", sanskrit: "पाटली", gloss: "The old-city band", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Heritage", name: "Mysore Mandap", sanskrit: "मण्डप", gloss: "The pavilion setting", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Minimal", name: "Sthir", sanskrit: "स्थिर", gloss: "The still one", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Minimal", name: "Ekaant", sanskrit: "एकान्त", gloss: "The solitary", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Minimal", name: "Shunya Vrit", sanskrit: "शून्यवृत्त", gloss: "The empty circle", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Statement", name: "Airavat", sanskrit: "ऐरावत", gloss: "The royal elephant", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Statement", name: "Suryavansh", sanskrit: "सूर्यवंश", gloss: "The solar line", image: "/pukhraj/ring.jpg" },
  { form: "Ring", style: "Statement", name: "Chakravarti", sanskrit: "चक्रवर्ती", gloss: "The sovereign's turn", image: "/pukhraj/ring-onhand.jpg" },
  { form: "Ring", style: "Heritage", name: "Ashta Dhaatu", sanskrit: "अष्टधातु", gloss: "The eight-metal bezel", image: "/pukhraj/ring.jpg" },
  { form: "Pendant", style: "Temple", name: "Deva Deepa", sanskrit: "देवदीप", gloss: "The temple lamp", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Heritage", name: "Chandra Haar", sanskrit: "चन्द्रहार", gloss: "The moon's garland", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Minimal", name: "Sutra", sanskrit: "सूत्र", gloss: "The single thread", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Minimal", name: "Nirmal", sanskrit: "निर्मल", gloss: "The unadorned", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Statement", name: "Kaustubh", sanskrit: "कौस्तुभ", gloss: "The jewel of Vishnu", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Temple", name: "Mandala", sanskrit: "मण्डल", gloss: "The sacred circle", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Temple", name: "Gopuram", sanskrit: "गोपुरम्", gloss: "The temple gate", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Heritage", name: "Taveez", sanskrit: "तावीज़", gloss: "The kept word", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Heritage", name: "Guttapusalu", sanskrit: "गुट्टापुसलु", gloss: "The southern cascade", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Minimal", name: "Antar", sanskrit: "अन्तर्", gloss: "The inward", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Statement", name: "Surya Kavach", sanskrit: "सूर्यकवच", gloss: "The sun's armour", image: "/pukhraj/pendant.jpg" },
  { form: "Pendant", style: "Statement", name: "Meghdoot", sanskrit: "मेघदूत", gloss: "The cloud messenger", image: "/pukhraj/pendant.jpg" },
  { form: "Bracelet", style: "Minimal", name: "Dhara", sanskrit: "धारा", gloss: "The steady stream", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Heritage", name: "Kada Veer", sanskrit: "वीर कड़ा", gloss: "The warrior's band", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Statement", name: "Garuda Pankh", sanskrit: "गरुडपंख", gloss: "The eagle's wing", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Temple", name: "Ghanta Mala", sanskrit: "घण्टामाला", gloss: "The temple-bell chain", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Heritage", name: "Pahunchi", sanskrit: "पहुँची", gloss: "The wrist court", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Minimal", name: "Sarala", sanskrit: "सरल", gloss: "The straight path", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Statement", name: "Nag Valay", sanskrit: "नागवलय", gloss: "The serpent coil", image: "/pukhraj/bracelet.jpg" },
  { form: "Bracelet", style: "Temple", name: "Rudra Kada", sanskrit: "रुद्र कड़ा", gloss: "The ascetic's band", image: "/pukhraj/bracelet.jpg" },
];

/* real jewellery photography — one distinct image per design (placeholder set,
   downloaded stock; replace with house shots before launch) */
const DESIGN_IMAGES: Record<Design["form"], string[]> = {
  Ring: ["/designs/ring-05.png", "/designs/ring-06.png", "/designs/ring-07.png", "/designs/ring-08.png", "/designs/ring-09.png", "/designs/ring-10.png", "/designs/ring-11.png", "/designs/ring-12.png"],
  Pendant: ["/designs/pendant-04.png", "/designs/pendant-05.png", "/designs/pendant-06.png", "/designs/pendant-07.png", "/designs/pendant-08.png"],
  Bracelet: ["/designs/bracelet-03.png", "/designs/bracelet-04.png", "/designs/bracelet-05.png", "/designs/bracelet-06.png"],
};

const CURATED_IMAGE: Record<string, string> = {
  "surya-prabha-ring": "/designs/ring-01.png",
  "trishula-signet": "/designs/ring-02.png",
  "ravi-tejas-ring": "/designs/ring-03.png",
  "kesari-ring": "/designs/ring-04.png",
  "guru-kripa-pendant": "/designs/pendant-01.png",
  "brihaspati-pendant": "/designs/pendant-02.png",
  "dhanya-pendant": "/designs/pendant-03.png",
  "akshaya-band": "/designs/bracelet-01.png",
  "rakshak-band": "/designs/bracelet-02.png",
};

function generateDesigns(): Design[] {
  const rng = lcg(4241);
  const metals = ["22k gold", "18k gold", "Panchdhatu"];
  const counters: Record<Design["form"], number> = { Ring: 0, Pendant: 0, Bracelet: 0 };
  return DESIGN_POOL.map((d) => {
    const runSize = 6 + Math.floor(rng() * 18);
    const remaining = rng() < 0.14 ? 0 : 1 + Math.floor(rng() * Math.min(runSize, 9));
    const pool = DESIGN_IMAGES[d.form];
    const image = pool[counters[d.form]++ % pool.length];
    return {
      slug: `${d.name.toLowerCase().replace(/[^a-z]+/g, "-")}-${d.form.toLowerCase()}`,
      name: d.name,
      sanskrit: d.sanskrit,
      gloss: d.gloss,
      form: d.form,
      style: d.style,
      story: `${d.gloss} — drawn from the ${d.style.toLowerCase()} language of the house library, set so the stone touches the skin as tradition asks.`,
      confers: `The texts pair the ${d.gloss.toLowerCase()} with steadiness of what it holds — the setting serves the stone, never the reverse.`,
      metal: metals[Math.floor(rng() * metals.length)],
      runSize,
      remaining,
      image,
    };
  });
}

export const DESIGNS: Design[] = [
  ...CURATED_DESIGNS.map((d) => ({ ...d, style: CURATED_STYLE[d.slug], image: CURATED_IMAGE[d.slug] ?? d.image })),
  ...generateDesigns(),
];

/* Energisation — the house never dispatches an inert stone. One tier is
   included; the deeper rites are elective, priced honestly, and framed as
   per tradition — never as a guaranteed outcome. (Adapted from the SHUDH
   pooja tiers seen across the trade, in AstroLaabh's own language.) */
export type EnergisationTier = {
  key: string;
  name: string;
  sanskrit: string;
  tier: "free" | "paid";
  fee: number;
  duration: string;
  includes: string[];
  proof: string;
};

export const ENERGISATION: EnergisationTier[] = [
  {
    key: "shuddhi",
    name: "Shuddhi",
    sanskrit: "शुद्धि",
    tier: "free",
    fee: 0,
    duration: "Single session · included free",
    includes: [
      "Stone cleansing in Gangajal & Himalayan rock salt",
      "Beej mantra recitation (108 chants) on the planet's own day",
      "Full HD video recording of the ceremony",
    ],
    proof: "Recording delivered to your vault.",
  },
  {
    key: "pran_pratishtha",
    name: "Praan Pratishtha",
    sanskrit: "प्राण-प्रतिष्ठा",
    tier: "paid",
    fee: 5100,
    duration: "≈ 45 min · live session",
    includes: [
      "Everything in Shuddhi",
      "Personalized with buyer's name, gotra & nakshatra",
      "1,100 beej mantra jaap chants",
      "Live video-call — buyer witnesses the full ritual",
      "Recording also kept in vault",
    ],
    proof: "Live attendance + vault recording.",
  },
  {
    key: "maha_abhishek",
    name: "Maha Abhishek",
    sanskrit: "महा-अभिषेक",
    tier: "paid",
    fee: 11000,
    duration: "3 sessions across planetary days",
    includes: [
      "Everything in Praan Pratishtha",
      "Navagraha shanti puja (planetary peace ceremony)",
      "11,000 mantra jaap chants over 3 days",
      "Havan (fire ceremony) with planet-specific samidha",
      "Energisation certificate issued",
    ],
    proof: "Live on key days + full recordings + certificate.",
  },
  {
    key: "vishesh_anushthan",
    name: "Vishesh Anushthan",
    sanskrit: "विशेष-अनुष्ठान",
    tier: "paid",
    fee: 21000,
    duration: "21-day extended ritual",
    includes: [
      "Everything in Maha Abhishek",
      "1,25,000 mantra jaap (full anushthan)",
      "Daily puja for the ruling planet across 21 days",
      "Dedicated pandit assigned for entire duration",
      "Live sessions on all key tithi days",
      "Maha yagna on completion day",
      "Blessed rudraksha or yantra accompaniment",
    ],
    proof: "Live sessions + daily updates + certificate + blessed items.",
  },
];

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* Every physical stone of a gem family, cheapest ratti first — the carat
   ladder the buy configurator walks. */
export function stonesByGem(gem: string): Stone[] {
  return STONES.filter((s) => s.gem === gem).sort((a, b) => a.ratti - b.ratti);
}

/* Universal ways in — a buyer rarely thinks in ratti. They arrive with an
   intent ("wealth", "health") or their sign. These map those to the stone;
   the nav menu and any landing surface reuse them. Honest by design: intent
   points to the traditionally-indicated gem, zodiac hands off to the efficacy
   meter, which reads the whole chart rather than pretending one sign = one stone. */
export const INTENTS: { label: string; gem: string }[] = [
  { label: "Wealth & fortune", gem: "pukhraj" },
  { label: "Marriage & harmony", gem: "pukhraj" },
  { label: "Wisdom & learning", gem: "pukhraj" },
  { label: "Authority & confidence", gem: "manik" },
  { label: "Health & vitality", gem: "manik" },
  { label: "Focus & discipline", gem: "neelam" },
  { label: "Career acceleration", gem: "neelam" },
  { label: "Intellect & business", gem: "panna" },
];

/* Each sign → the planet (and so the stone) we carry that its lord or
   exaltation points to. A starting point for browsing; the efficacy meter and
   an astrologer read the whole chart for the real recommendation. */
export const ZODIAC: { sign: string; glyph: string; planet: string }[] = [
  { sign: "Aries", glyph: "♈", planet: "Sun" },
  { sign: "Taurus", glyph: "♉", planet: "Mercury" },
  { sign: "Gemini", glyph: "♊", planet: "Mercury" },
  { sign: "Cancer", glyph: "♋", planet: "Jupiter" },
  { sign: "Leo", glyph: "♌", planet: "Sun" },
  { sign: "Virgo", glyph: "♍", planet: "Mercury" },
  { sign: "Libra", glyph: "♎", planet: "Saturn" },
  { sign: "Scorpio", glyph: "♏", planet: "Jupiter" },
  { sign: "Sagittarius", glyph: "♐", planet: "Jupiter" },
  { sign: "Capricorn", glyph: "♑", planet: "Saturn" },
  { sign: "Aquarius", glyph: "♒", planet: "Saturn" },
  { sign: "Pisces", glyph: "♓", planet: "Jupiter" },
];
