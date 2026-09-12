import PersonaManager from "./pesona.js";
import MoodEngine from "./moodengin.js";
import RelationshipEngine from "./relation.js";
import MemoryEngine from "./energy.js";
import PromptBuilder from "./promt.js";
import PersonalityEvolutionEngine from "./Evolution.js";

const DEFAULT_MOOD = { happiness: 70, patience: 80, playfulness: 60 };
const DEFAULT_RELATIONSHIP = 35;

export default class ChatEngine {
  constructor({ personaPath, memoryDbPath, evolutionDbPath }) {
    this.persona = new PersonaManager(personaPath);
    this.moodEngine = new MoodEngine();
    this.relationshipEngine = new RelationshipEngine();
    this.memoryEngine = new MemoryEngine(memoryDbPath);
    this.evolutionEngine = new PersonalityEvolutionEngine(
      evolutionDbPath || memoryDbPath.replace(/\.json$/, "_evolution.json")
    );
    this.promptBuilder = new PromptBuilder();
  }

  buildSystemPrompt(userId, message) {
    const persona = this.persona.getPersona();
    const stored = this.memoryEngine.get(userId);
    const evolution = this.evolutionEngine.update(userId, message);

    const evolvedBaseline = {
      happiness: DEFAULT_MOOD.happiness,
      patience: DEFAULT_MOOD.patience,
      playfulness: (DEFAULT_MOOD.playfulness + evolution.traits.playfulness) / 2,
    };

    const mood = this.moodEngine.update(
      { ...evolvedBaseline, ...(stored.mood || {}) },
      message
    );
    const relationship = this.relationshipEngine.update(
      stored.relationship ?? DEFAULT_RELATIONSHIP,
      message
    );

    // [OPTIMASI] Satu kali upsert gabungan mood+relationship. Sebelumnya ini
    // langsung memicu readFileSync+writeFileSync sinkron; sekarang cuma
    // ubah cache di memori + jadwalkan satu debounced write.
    this.memoryEngine.save(userId, { mood, relationship });

    return this.promptBuilder.build({ persona, mood, relationship, memory: stored, evolution });
  }

  saveFacts(userId, facts) {
    if (!facts || typeof facts !== "object" || !Object.keys(facts).length) return;
    this.memoryEngine.save(userId, { facts });
  }

  /**
   * Paksa tulis semua perubahan yang masih tertunda (debounced) ke disk.
   * Panggil ini saat proses mau dimatikan (mis. di handler SIGINT/SIGTERM)
   * supaya tidak ada update mood/relationship/facts yang hilang.
   */
  flush() {
    this.memoryEngine.flush();
    this.evolutionEngine.flush();
  }
}
