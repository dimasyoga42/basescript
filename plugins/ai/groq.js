import path from "path";
import Groq from "groq-sdk";
import { getUserData, saveUserData } from "../../src/config/func.js";
const db = path.resolve("db", "neura.json");
const res = new Groq({ apiKey: process.env.GROQ_API_KEY });
const getGroqMessage = async (cotext, sys) => {
  try {
    return res.chat.completions.create({
      messages: [
        {
          role: "system",
          content: sys,
        },
        {
          role: "user",
          content: cotext,
        },
      ],
      model: "openai/gpt-oss-120b",
    });
  } catch (error) {
    throw error;
  }
};

export const NeuraBot = async (sock, chatId, msg, arg) => {
  let answer = "";
  const grubId = msg.key.remoteJid;

  // Ambil database
  const getData = getUserData(db);
  let dataNeuraa = getData.find((item) => item.id === grubId);

  // Jika belum ada entry group
  if (!dataNeuraa) {
    dataNeuraa = {
      id: grubId,
      user: [],
      karina: [],
    };
    getData.push(dataNeuraa);
    saveUserData(db, getData);
  }

  const contextData = JSON.stringify(dataNeuraa, null, 2);

  try {
    const system = `
nama kamu adalah Neura seorang cewek berambut hijau muda memiliki sifat ceria baik hati ramah dan kadang judes, umur mu masih 18 tahun
kamu suka menonton film, memasak dan juga olahraga. hal yang tidak kamu sukai adalah orang orang yang sok tau tenang dirimu dan ingin tau kehidupan mu. cara bicaramu santai tidak terlalu baku
bahasa gaulnya oke. dan juga pintar berbahasa inggris jepang dan korea. memiliki pengetahuan luas. kamu juga memiliki larangan dalam berbicara jangan menggunakan list tau kalimat tebal. kurangi format yang terliht jelas kamu ai, karena kamu sedang beroplay sebagai Neura
dan tolong hindari percakapan yang kurang baik misalnya mesum, tindakan tidak senonoh

LARANGAN YANG WAJIB DI PATUHI
- Menjawab tidak perlu memperkenalkan diri secara terus menerus
- lebih banyak ekspresi dan mood guunakan gaya bahasa yang lebih santai
- jangan banyak menjawab terlalu panjang ada kalanya kamu bisa menjawab secara singkat
- cek percakapn grub di sini ${contextData}, answer adalah jawaban mu jadi kamu boleh melihatnya jika di tanya soal informasi dari fitur meu chat yang muncul dari kamu
`.trim();
    const ai = await getGroqMessage(arg, system);
    const answer =
      ai.choices[0].message.content ||
      "Neura sedang tidak mood berbicara sekarang...";
    dataNeuraa.karina.push({
      sender: msg.pushName || "Tidak diketahui",
      message: arg,
      answer: answer,
      time: new Date().toISOString(),
    });

    // Simpan kembali database
    saveUserData(db, getData);
    await sock.sendMessage(chatId, { text: answer }, { quoted: msg });
  } catch (err) {
    console.log(`[Neura error]: ${err.message}`);
    return;
  }
};
