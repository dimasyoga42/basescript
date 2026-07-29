export default class MoodEngine {
  update(mood, userMessage) {
    const text = userMessage.toLowerCase();

    if (text.includes("makasih") || text.includes("thanks")) {
      mood.happiness += 3;
    }
    if (text.includes("tolol") || text.includes("bodoh") || text.includes("goblok")) {
      mood.patience -= 5;
      mood.happiness -= 3;
    }
    if (text.includes("wkwk") || text.includes("haha") || text.includes("lol")) {
      mood.playfulness += 2;
    }
    if (text.includes("maaf") || text.includes("sorry")) {
      mood.patience += 2;
    }

    // pelan-pelan balik ke normal biar nggak nyangkut di ekstrem
    mood.happiness += mood.happiness > 70 ? -0.5 : mood.happiness < 50 ? 0.5 : 0;
    mood.patience += mood.patience > 80 ? -0.5 : mood.patience < 60 ? 0.5 : 0;

    mood.happiness = Math.max(0, Math.min(100, Math.round(mood.happiness)));
    mood.patience = Math.max(0, Math.min(100, Math.round(mood.patience)));
    mood.playfulness = Math.max(0, Math.min(100, Math.round(mood.playfulness)));

    return mood;
  }
}
