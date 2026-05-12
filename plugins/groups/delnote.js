// import { config } from "../../config.js";
// import { buildSelectButton, sendText } from "../../src/config/message.js";
// import { supa } from "../../src/config/supa.js";

// const handler = async (m, { conn }) => {
//   try {
//     const id = m.text.split(" ")[1];
//     if (!id) {
//       const { data: db, err } = await supa
//         .from("note")
//         .select("id, note_name")
//         .eq("grubId", m.chat);
//       return conn.sendButton(m.chat, {
//         text: "Pilih salah satu untuk hapus catatan",
//         footer: "Neurainc",
//         buttons: [
//           buildSelectButton(
//             "Hapus Catatan",
//             "Pilih salah satu",
//             db.map((item) => ({
//               title: item.note_name,
//               id: `.delnote ${id}`,
//             })),
//           ),
//         ],
//       });
//     }

//     const { error, count } = await supa
//       .from("note")
//       .delete()
//       .eq("grubId", m.chat)
//       .eq("id", id)
//       .select("*", { count: "exact", head: true });

//     if (error)
//       return sendText(conn, m.chat, `Failed to delete: ${error.message}`, m);
//     if (count === 0)
//       return sendText(conn, m.chat, `Note with ID ${id} not found`, m);

//     await sendText(conn, m.chat, `Note with ID ${id} deleted successfully`, m);
//   } catch (err) {
//     console.error("[delnote]", err);
//     await sendText(conn, m.chat, config.message.error, m);
//   }
// };

// handler.command = ["delnote"];
// handler.category = "Menu Grub";
// handler.submenu = "Note";
// export default handler;
