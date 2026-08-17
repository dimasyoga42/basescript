import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendImage } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(`${config.restapi.toram}toram/ava`);
    const items = res.data.result; // confirm: is this the array, or res.data.result.data?

    for (const item of items) {
      const { data: existing, error } = await supa
        .from("avatar")
        .select("*")
        .eq("name", item.name);

      if (error) {
        console.error("Supabase select error:", error);
      } else if (!existing || existing.length === 0) {
        // not in db yet -> insert
        const { error: insertError } = await supa
          .from("avatar")
          .insert({ name: item.name, image_url: item.image });
        if (insertError) console.error("Supabase insert error:", insertError);
      }

      await sendImage(conn, m.chat, item.image, item.name, m);
    }
  } catch (err) {
    console.error(err);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      renderLargerThumbnail: true,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["ava"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
