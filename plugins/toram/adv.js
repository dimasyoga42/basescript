import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const [, level, exp, max, qsFrom] = arg;

    if (!level || !exp || !max || !qsFrom)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        text: `${config.message.invalid}\nexample: .spamadv 120 0 315 10`,
        quoted: m,
      });

    const res = await axios.get(
      `${config.restapi.toram}toram/spamadv?lv=${encodeURIComponent(level)}&exp=${encodeURIComponent(exp)}&lvmx=${encodeURIComponent(max)}&from=${encodeURIComponent(qsFrom)}`,
    );

    const result = res.data?.result?.data?.[0];
    if (!result)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });

    const progressText =
      Array.isArray(result.progress) && result.progress.length > 0
        ? result.progress
            .map((v) => `- Run ${v.run}x → Lv ${v.level} (${v.percent}%)`)
            .join("\n")
        : "  Detail progres tidak tersedia.";

    const responseText = `
Initial State:
- Start Level  : ${result.startLevel} (${result.startPercent}%)
- Target Level : ${result.targetLevel}

Calculation Result:
- Runs Needed  : ${result.runs}x
- Final Level  : ${result.finalLevel} (${result.finalPercent}%)
- Final EXP    : ${result.finalExp?.toLocaleString("id-ID")}
- Reached      : ${result.reachedTarget ? "Berhasil" : "Belum"}

Progress Detail:
${progressText}

Source: ${res.data?.result?.source || "Neura API"}`;
    await sendText(conn, m.chat, responseText, m);
  } catch (err) {
    console.error(err);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["spamadv"];
handler.category = "Toram Simulator";
handler.submenu = "Simulator";
export default handler;
