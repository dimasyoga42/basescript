import { safeCalc, currentTime } from "./basicTools.js";
import { xtalFinder } from "./toramTools.js";
import { xtalStatsDump, xtalStatSearch } from "./xtalsearch.js";
import { replyReader } from "./replayrender.js";
import { sendStiker } from "./stiker.js";
const TOOL_PATTERN = /\{\{tool:([a-zA-Z0-9_]+)(?::([\s\S]*?))?\}\}/g;

const registry = {
  calc: async (arg) => safeCalc(arg),
  time: async () => currentTime(),
  xtal: async (arg) => xtalFinder(arg),
  dump: async () => xtalStatsDump(),
  stat: async (arg) => xtalStatSearch(arg),
  reply: async (_arg, ctx) => replyReader(ctx),
  stiker: async (arg) => sendStiker(arg)
};

export async function runTools(text, ctx = {}) {
  if (typeof text !== "string" || !text.includes("{{tool:")) {
    return text;
  }

  let result = text;

  for (const match of text.matchAll(TOOL_PATTERN)) {
    const [full, name, rawArg] = match;
    const arg = rawArg?.trim() ?? "";
    const handler = registry[name];

    let value;

    try {
      if (!handler) {
        value = `[tool ${name} tidak dikenal]`;
      } else {
        value = await handler(arg, ctx);
      }
    } catch (err) {
      console.error(`[Tool Error] ${name}`, err);
      value = `[tool ${name} error: ${err.message}]`;
    }

    result = result.replace(full, String(value));
  }

  return result;
}
