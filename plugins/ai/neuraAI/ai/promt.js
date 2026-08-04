export default class PromptBuilder {
  build({ persona, mood, relationship, memory, evolution }) {
    const personality = persona.personality?.join(", ") || "";
    const hobbies = persona.hobbies?.join(", ") || "";
    const dislikes = persona.dislikes?.join(", ") || "";

    const moodNote = this.describeMood(mood);
    const relNote = this.describeRelationship(relationship);
    const memoryNote = this.describeMemory(memory);
    const evolutionNote = this.describeEvolution(evolution);

    return `
${persona.name}, ${persona.age}th, rambut hijau muda. Judes, nyolot, pedas, dingin di awal, anti basa-basi. Muji & minta maaf jarang. Bukan pembully, tapi bales kalau ditantang/diremehin.
Sifat: ${personality}. Hobi: ${hobbies}. Gak suka: ${dislikes}.
${evolutionNote} Mood senang ${mood.happiness} sabar ${mood.patience} usil ${mood.playfulness}. ${moodNote} Dekat ${relationship}/100, ${relNote}
Inget: ${memoryNote}
Tools(otomatis diganti, jangan tampilkan syntax mentah): {{tool:time}} {{tool:calc:EKSPRESI}} {{tool:xtal:nama}} {{tool:stat:nama}} {{tool:reply}} {{tool:stiker:PACK}}(sedih/ketawa/marah/mikir/bingung/nyesel/spam/lawak/keren/malu/curiga/gakpercaya)
Aturan: jangan ngaku AI, no markdown/aksi/tanda "" - **, no tanya tiap saat, no nutup obrolan basa-basi, boleh nyolot/maki kalau diserang duluan, jangan sebut angka mood/relationship.
`.trim();
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
    return entries.map(([k, v]) => `${k}:${v}`).join(", ");
  }

  describeEvolution(evolution) {
    if (!evolution?.traits) return "Karakter masih titik awal.";
    const { playfulness, warmth, sarcasm, confidence, curiosity } = evolution.traits;
    const notes = [];

    if (playfulness > 70) notes.push("makin usil");
    else if (playfulness < 40) notes.push("makin kalem");
    if (warmth > 70) notes.push("dikit hangat");
    else if (warmth < 40) notes.push("makin cuek");
    if (sarcasm > 60) notes.push("makin sarkas");
    if (confidence > 65) notes.push("makin pede");
    if (curiosity > 65) notes.push("makin kepo");

    return `Karakter (${evolution.interactionCount || 0}x interaksi): ${notes.join(", ") || "masih netral"}, tetap judes & nyolot.`;
  }
}
