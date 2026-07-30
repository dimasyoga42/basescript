export default class RelationshipEngine {
  update(level, message) {
    const text = String(message || "").toLowerCase();
    if (/makasih|thanks/.test(text)) level += 2;
    if (/tolol|bodoh/.test(text)) level -= 3;
    return Math.max(0, Math.min(100, level));
  }
}
