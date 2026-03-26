import { config } from "../../config.js";

const handler = async (m, { conn }) => {
  const mtext =
    `Neura Sama dikembangkan sendiri Oleh Dimas Yoga dengan menggunakan engine baileys, dan dibangun atas dasar project gabut dan untuk memenuhi kebutuhan pribadi. yang kini di open public. saya berterimakasih pada teman teman yang ikut berkontribusi dari saran dan keritik dalam pengembangan bot ini. dan sepecial thanks untuk sumber public:
  - coryn.club
  - toram-id
  - Toram Yo
  - Phantom’s Library
  - tanaka0
  - toramtools
  - toram.jp
    `.trim();

  await conn.sendMessage(
    m.chat,
    {
      text: mtext,
      title: config.BotName,
      subtitle: `Developer: ${config.OwnerName}`,
      footer: `Develope By ${config.OwnerName}`,
      viewOnce: true,
      buttons: [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Coryn Club",
            url: "https://coryn.club/",
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Toram-yo",
            url: "https://toramyo.blogspot.com/",
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Tanaka0",
            url: "http://tanaka0.work/",
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Toramtools",
            url: "toramtools.github.io/xp.html",
          }),
        },

        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Toram-id",
            url: "https://toram-id.space/",
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "official web toram online",
            url: "https://en.toram.jp/",
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Phantom’s Library",
            url: "https://discord.gg/fnhkyz5B4E",
          }),
        },
      ],
    },
    { quoted: m },
  );
};

handler.command = "credit";
handler.category = "Menu Bot";
export default handler;
