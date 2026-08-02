import { safeCalc, currentTime } from "./basicTools.js";
import { xtalFinder } from "./toramTools.js";

const TOOL_PATTERN = /\{\{tool:(\w+)(?::([^}]*))?\}\}/g;

const registry = {
  calc: (arg) => safeCalc(arg),
  time: () => currentTime(),
  xtal: (arg) => xtalFinder(arg)
};

export async function runTools(text) {
  if (!text || !text.includes("{{tool:")) return text;

  let result = text;
  const matches = [...text.matchAll(TOOL_PATTERN)];

  for (const match of matches) {
    const [full, name, arg] = match;
    const handler = await registry[name];
    let value;
    try {
      value = handler ? handler(arg) : `[tool ${name} tidak dikenal]`;
    } catch {
      value = `[tool ${name} error]`;
    }
    result = result.replace(full, String(value));
  }

  return result;
}
