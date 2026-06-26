import axios from "axios";
import fs from "fs";
import path from "path";

const API =
  "https://neurapi.mochinime.cyou/api/etc/code/578244723349782538?limit=1";

const CACHE = path.resolve("db", "code.json");

const loadLastId = () => {
  try {
    return JSON.parse(fs.readFileSync(CACHE, "utf8")).id;
  } catch {
    return null;
  }
};

const saveLastId = (id) => {
  fs.writeFileSync(CACHE, JSON.stringify({ id }, null, 2));
};

export const cronCode = async (conn) => {
  try {
    const { data } = await axios.get(API);

    if (!data.success || !data.data.length) return;

    const latest = data.data[0];

    const lastId = loadLastId();

    if (latest.id === lastId) {
      return;
    }

    const caption = latest.content
      .replace(/<@&\d+>/g, "")
      .replace(/\[([^\]]+)\]\(<([^>]+)>\)/g, "$1: $2")
      .replace(/`/g, "")
      .trim();

    const groups = await conn.groupFetchAllParticipating();

    for (const jid of Object.keys(groups)) {
      if (latest.attachments.length) {
        await conn.sendMessage(jid, {
          image: { url: latest.attachments[0].url },
          caption,
        });
      } else {
        await conn.sendMessage(jid, {
          text: caption,
        });
      }
    }

    saveLastId(latest.id);

    console.log("[cronCode] Code baru berhasil dikirim.");
  } catch (err) {
    console.error(err);
  }
};
