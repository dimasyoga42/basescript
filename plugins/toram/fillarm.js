import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
const handler = async (m, { conn }) => {
  try {
    const stats = m.text.replace(".fillarm", "");
    if (!stats)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .fillarm stats",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    const url = `https://neurapi.mochinime.cyou/api/toram/filarm?text=${encodeURIComponent(stats)}`;
    const { data } = await axios.get(url, { timeout: 15000 });
    if (!data?.ok || !data?.hasValidResult)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound,
        quoted: m,
      });

    const steps = data.steps.join("\n");

    const positiveStats =
      data.inputConfig.positiveStats.length > 0
        ? data.inputConfig.positiveStats
            .map((v) => `• ${v.name} (${v.level})`)
            .join("\n")
        : "-";

    const negativeStats =
      data.inputConfig.negativeStats.length > 0
        ? data.inputConfig.negativeStats
            .map((v) => `• ${v.name} (${v.level})`)
            .join("\n")
        : "-";

    const material = Object.entries(data.materialDetails)
      .filter(([k]) => k !== "reduction")
      .map(([k, v]) => `${k.toUpperCase().padEnd(8)}: ${v}`)
      .join("\n");

    const result = `
    Success Rate : ${data.successRate}\nStarting Pot : ${data.startingPot}

   Positive Stats\n${positiveStats}

   Negative Stats\n${negativeStats}

   Steps (${data.totalSteps})\n${steps}\n\nMaterial Cost\n${material}\nReduction         : ${data.materialDetails.reduction}\nHighest Step Cost : ${data.highestStepCost}\n\nCharacter Config\nCharacter Lv : ${data.inputConfig.characterLevel}\nBS Lv        : ${data.inputConfig.professionLevel}\nStart Pot    : ${data.inputConfig.startingPotential}

   Process Time : ${data.duration} ms
   `.trim();
    // await sendFancyText(conn, m.chat, {
    //   title: config.BotName,
    //   body: `Develop by ${config.OwnerName}`,
    //   thumbnail: thumbnail,
    //   text: result,
    //   quoted: m,
    // });
    sendText(conn, m.chat, result, m);
  } catch (err) {}
};

handler.command = ["fillarm"];
handler.category = "Toram Simulator";
handler.submenu = "Toram";
export default handler;
