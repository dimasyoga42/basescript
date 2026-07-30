import fs from "fs";
import path from "path";

const ensureDir = (dbPath) => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

function getUserData(dbPath) {
  try {
    ensureDir(dbPath);

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "[]");
      return [];
    }

    const raw = fs.readFileSync(dbPath, "utf-8");

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (err) {
    console.error("Gagal membaca file:", err);
    return [];
  }
}

const saveUserData = (dbPath, data) => {
  try {
    ensureDir(dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${dbPath}:`, err);
  }
};

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
    this.dbPath = dbPath;
  }

  _load() {
    const data = getUserData(this.dbPath);
    return Array.isArray(data) ? data : [];
  }

  _save(data) {
    saveUserData(this.dbPath, data);
  }

  get() {
    const data = this._load();
    const entry = data.find((v) => v?.id === GLOBAL_ID);
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

    const knownSenders = Array.from(new Set([...current.knownSenders, senderId]));
    const confidenceCeiling = Math.min(95, 45 + knownSenders.length * 0.4);
    const opennessCeiling = Math.min(90, 50 + current.interactionCount * 0.02);
    traits.confidence += (confidenceCeiling - traits.confidence) * 0.015;
    traits.openness += (opennessCeiling - traits.openness) * 0.01;

    for (const key of Object.keys(traits)) {
      traits[key] = Math.max(0, Math.min(100, Math.round(traits[key] * 100) / 100));
    }

    const now = new Date().toISOString();
    const data = this._load();
    let entry = data.find((v) => v?.id === GLOBAL_ID);
    if (!entry) {
      entry = { id: GLOBAL_ID };
      data.push(entry);
    }
    entry.traits = traits;
    entry.interactionCount = current.interactionCount + 1;
    entry.knownSenders = knownSenders;
    entry.firstInteractionAt = current.firstInteractionAt || now;
    entry.lastInteractionAt = now;
    this._save(data);

    return {
      traits,
      interactionCount: entry.interactionCount,
      knownSenders,
      firstInteractionAt: entry.firstInteractionAt,
      lastInteractionAt: entry.lastInteractionAt,
    };
  }
}
