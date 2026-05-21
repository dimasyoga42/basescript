import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const stats = m.text.replace(/^\.fillarm/i, "").trim();

    if (!stats) {
      return sendText(
        conn,
        m.chat,
        `Format salah.

Contoh:
.fillarm dte%=max,agi%=max,cd%=max,cr=30,matk%=min,mp=min,acc=min,acc%=min,lv=320,prof=250,pot=65

Gunakan:
.stats untuk melihat daftar stat.`,
        m,
      );
    }

    const url = `https://neurapi.mochinime.cyou/api/toram/filarm?text=${encodeURIComponent(stats)}`;

    const { data } = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!data?.ok) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail,
        text: data?.error || config.message.notFound,
        quoted: m,
      });
    }

    if (!data?.hasValidResult) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail,
        text: data?._note || "Formula tidak ditemukan.",
        quoted: m,
      });
    }

    const positiveStats = data.inputConfig?.positiveStats?.length
      ? data.inputConfig.positiveStats
          .map((v) => `• ${v.name} (${v.level})`)
          .join("\n")
      : "-";

    const negativeStats = data.inputConfig?.negativeStats?.length
      ? data.inputConfig.negativeStats
          .map((v) => `• ${v.name} (${v.level})`)
          .join("\n")
      : "-";

    const steps = data.steps?.length > 0 ? data.steps.join("\n") : "-";

    const materials = data.materialDetails || {};

    const reductionText = Array.isArray(materials.reductions)
      ? materials.reductions.join(", ")
      : "-";

    const materialLines = Object.entries(materials)
      .filter(([key]) => key !== "reductions")
      .map(([key, value]) => `${key.toUpperCase()} : ${value}pt`)
      .join("\n");

    const result = `
Source              : https://tanaka0.work/

Success Rate        : ${data.successRate || "-"}
Starting Pot        : ${data.startingPot || "-"}

Positive Stats
${positiveStats}

Negative Stats
${negativeStats}

Material Cost
${materialLines || "-"}

Reduction
${reductionText}

Highest Step Cost   : ${data.highestStepCost || "-"}

Steps (${data.totalSteps || 0})
${steps}

Character Config
Character Lv        : ${data.inputConfig.characterLevel}
BS Lv               : ${data.inputConfig.professionLevel}
Start Pot           : ${data.inputConfig.startingPotential}
Recipe Pot          : ${data.inputConfig.recipePotential}

Process Time        : ${data.duration} ms
`.trim();

    return sendText(conn, m.chat, result, m);
  } catch (err) {
    return sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail,
      text: err?.response?.data?.error || err?.message || "Terjadi kesalahan.",
      quoted: m,
    });
  }
};

handler.command = ["fillarm"];
handler.category = "Toram Simulator";
handler.submenu = "Toram";

export default handler;
