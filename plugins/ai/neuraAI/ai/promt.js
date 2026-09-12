// [OPTIMASI] Fakta dibatasi jumlah & panjangnya. Sebelumnya SEMUA fakta yang
// pernah diekstrak ditumpuk terus di system prompt tanpa batas -> makin lama
// makin panjang, dan karena pemotongan di sisi caller (truncateFromStart)
// motong dari AWAL teks, yang kepotong duluan justru identitas persona &
// bukan fakta lama yang harusnya kurang relevan.
const MAX_FACTS_IN_PROMPT = 15;
const MAX_FACT_VALUE_LENGTH = 60;

export default class PromptBuilder {
  constructor() {
    this._personaCache = null; // { ref, block } -> hindari re-join array tiap build()
  }

  _personaBlock(persona) {
    if (this._personaCache && this._personaCache.ref === persona) {
      return this._personaCache.block;
    }

    const personality = persona.personality?.join(", ") || "";
    const hobbies = persona.hobbies?.join(", ") || "";
    const dislikes = persona.dislikes?.join(", ") || "";

    const block = `${persona.name}, ${persona.age}th. Judes, nyolot, pedas, dingin di awal, anti basa-basi. Muji & minta maaf jarang. Bukan pembully, tapi bales kalau ditantang/diremehin.
Sifat: ${personality}. Hobi: ${hobbies}. Gak suka: ${dislikes}.`;

    this._personaCache = { ref: persona, block };
    return block;
  }

  build({ persona, mood, relationship, memory, evolution }) {
    const personaBlock = this._personaBlock(persona);
    const moodNote = this.describeMood(mood);
    const relNote = this.describeRelationship(relationship);
    const memoryNote = this.describeMemory(memory);
    const evolutionNote = this.describeEvolution(evolution);

    return `${personaBlock}${evolutionNote}
Mood ${mood.happiness}/${mood.patience}/${mood.playfulness}: ${moodNote} Dekat ${relationship}/100: ${relNote}
Inget: ${memoryNote}
Tools(auto-replace, jgn tampilkan syntax mentah): {{tool:time}} {{tool:calc:EKSPRESI}} {{tool:xtal:nama}} {{tool:stat:nama}} {{tool:reply}} {{tool:stiker:PACK}}(sedih/ketawa/marah/mikir/bingung/nyesel/spam/lawak/keren/malu/curiga/gakpercaya/merasakeren) {{tool:liststats:nama}}
Aturan: jangan ngaku AI; no markdown/aksi/tanda kutip "" atau **; jangan nanya tiap saat; jangan nutup obrolan basa-basi; boleh nyolot/maki kalau diserang duluan; jangan sebut angka mood/relationship.`.trim();
  }

  describeMood(mood) {
    if (mood.patience < 40) return "Gampang ketus.";
    if (mood.happiness > 80) return "Mood bagus, nadanya rada ringan.";
    if (mood.happiness < 30) return "Kurang semangat, males, gak sabaran.";
    if (mood.playfulness > 70) return "Pengen becanda/jail.";
    return "Mood biasa.";
  }

  describeRelationship(level) {
    if (level >= 70) return "boleh usil/manja tanpa hilang pedes.";
    if (level >= 40) return "tetap jaga jarak, gak mudah luluh.";
    return "makin cuek & dingin.";
  }

  describeMemory(memory) {
    const facts = memory?.facts || {};
    const entries = Object.entries(facts);
    if (!entries.length) return "belum tahu banyak.";

    // Ambil yang paling baru ditambahkan (mengandalkan urutan insersi objek
    // JS) supaya prompt gak terus membengkak walau fakta menumpuk banyak
    // seiring waktu, dan tiap value dipotong kalau kepanjangan.
    const recent = entries.slice(-MAX_FACTS_IN_PROMPT);

    return recent
      .map(([k, v]) => {
        const val = String(v);
        const trimmed =
          val.length > MAX_FACT_VALUE_LENGTH ? `${val.slice(0, MAX_FACT_VALUE_LENGTH)}…` : val;
        return `${k}:${trimmed}`;
      })
      .join(", ");
  }

  describeEvolution(evolution) {
    if (!evolution?.traits) return " Karakter masih titik awal.";
    const { playfulness, warmth, sarcasm, confidence, curiosity } = evolution.traits;
    const notes = [];

    if (playfulness > 70) notes.push("makin usil");
    else if (playfulness < 40) notes.push("makin kalem");
    if (warmth > 70) notes.push("dikit hangat");
    else if (warmth < 40) notes.push("makin cuek");
    if (sarcasm > 60) notes.push("makin sarkas");
    if (confidence > 65) notes.push("makin pede");
    if (curiosity > 65) notes.push("makin kepo");

    return ` Karakter (${evolution.interactionCount || 0}x interaksi): ${notes.join(", ") || "masih netral"
      }, tetap judes & nyolot.`;
  }
}
