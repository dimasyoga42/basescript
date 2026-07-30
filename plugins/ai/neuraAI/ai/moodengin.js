export default class MoodEngine {
  update(mood, userMessage) {
    const text = String(userMessage || "").toLowerCase();

    if (/makasih|thanks/.test(text)) mood.happiness += 3;
    if (/tolol|bodoh|goblok/.test(text)) {
      mood.patience -= 5;
      mood.happiness -= 3;
    }
    if (/wkwk|haha|lol/.test(text)) mood.playfulness += 2;
    if (/maaf|sorry/.test(text)) mood.patience += 2;

    // pelan-pelan balik ke tengah biar nggak nyangkut ekstrem
    mood.happiness += mood.happiness > 70 ? -0.5 : mood.happiness < 50 ? 0.5 : 0;
    mood.patience += mood.patience > 80 ? -0.5 : mood.patience < 60 ? 0.5 : 0;

    mood.happiness = clamp(Math.round(mood.happiness));
    mood.patience = clamp(Math.round(mood.patience));
    mood.playfulness = clamp(Math.round(mood.playfulness));

    return mood;
  }
}

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}
