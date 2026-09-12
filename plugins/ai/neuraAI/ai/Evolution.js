import JsonStore from "./store.js";

const GLOBAL_ID = "global";
const DEFAULT_TRAITS = {
  playfulness: 60,
  warmth: 65,
  sarcasm: 30,
  confidence: 45,
  curiosity: 55,
  openness: 50,
};
const TRAIT_STEP = 0.5;

export default class PersonalityEvolutionEngine {
  constructor(dbPath) {
    this.store = new JsonStore(dbPath);
  }

  get() {
    const entry = this.store.get(GLOBAL_ID);
    if (!entry) {
      return {
        traits: { ...DEFAULT_TRAITS },
        interactionCount: 0,
        knownSenders: [],
        firstInteractionAt: null,
        lastInteractionAt: null,
      };
    }
    return {
      traits: { ...DEFAULT_TRAITS, ...(entry.traits || {}) },
      interactionCount: typeof entry.interactionCount === "number" ? entry.interactionCount : 0,
      knownSenders: Array.isArray(entry.knownSenders) ? entry.knownSenders : [],
      firstInteractionAt: entry.firstInteractionAt || null,
      lastInteractionAt: entry.lastInteractionAt || null,
    };
  }

  update(senderId, message) {
    const current = this.get();
    const traits = { ...current.traits };
    const text = String(message || "").toLowerCase();

    const bump = (key, amount) => {
      traits[key] = Math.max(0, Math.min(100, traits[key] + amount));
    };

    if (/wkwk|haha|lucu|kocak|receh|:v|lol|ngakak/.test(text)) {
      bump("playfulness", TRAIT_STEP);
      bump("sarcasm", TRAIT_STEP * 0.4);
    }
    if (/makasih|thanks|baik banget|sayang|kamu baik|perhatian/.test(text)) {
      bump("warmth", TRAIT_STEP);
    }
    if (/tolol|bodoh|goblok|kasar|anjing|bangsat|toxic/.test(text)) {
      bump("sarcasm", TRAIT_STEP);
      bump("warmth", -TRAIT_STEP * 0.5);
      bump("confidence", TRAIT_STEP * 0.3);
    }
    if (/kenapa|gimana|caranya|apa itu|kok bisa|maksudnya/.test(text)) {
      bump("curiosity", TRAIT_STEP);
    }
    if (/aneh|beda|unik|nyoba|baru|nggak biasa/.test(text)) {
      bump("openness", TRAIT_STEP * 0.5);
    }

    // [OPTIMASI] Cek includes() langsung, tidak perlu bikin objek Set baru
    // tiap panggilan cuma buat dedupe satu elemen.
    const knownSenders = current.knownSenders.includes(senderId)
      ? current.knownSenders
      : [...current.knownSenders, senderId];

    const confidenceCeiling = Math.min(95, 45 + knownSenders.length * 0.4);
    const opennessCeiling = Math.min(90, 50 + current.interactionCount * 0.02);
    traits.confidence += (confidenceCeiling - traits.confidence) * 0.015;
    traits.openness += (opennessCeiling - traits.openness) * 0.01;

    for (const key of Object.keys(traits)) {
      traits[key] = Math.max(0, Math.min(100, Math.round(traits[key] * 100) / 100));
    }

    const now = new Date().toISOString();

    // [OPTIMASI] Satu kali upsert (cache + debounced write), bukan
    // find-manual + writeFileSync langsung.
    const entry = this.store.upsert(GLOBAL_ID, {
      traits,
      interactionCount: current.interactionCount + 1,
      knownSenders,
      firstInteractionAt: current.firstInteractionAt || now,
      lastInteractionAt: now,
    });

    return {
      traits: entry.traits,
      interactionCount: entry.interactionCount,
      knownSenders: entry.knownSenders,
      firstInteractionAt: entry.firstInteractionAt,
      lastInteractionAt: entry.lastInteractionAt,
    };
  }

  flush() {
    this.store.flushSync();
  }
}
