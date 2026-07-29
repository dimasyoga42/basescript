export default class RelationshipEngine {
  update(level, message) {
    const text = message.toLowerCase();
    if (text.includes("makasih") || text.includes("thanks")) {
      level += 2;
    }
    if (text.includes("tolol") || text.includes("bodoh")) {
      level -= 3;
    }
    return Math.max(0, Math.min(100, level));
  }
}
