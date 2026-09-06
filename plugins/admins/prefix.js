// import { getUserData, saveUserData } from "../../src/config/func.js"
// import { sendText } from "../../src/config/message.js"
// import { isAdmin } from "../_function/_admin.js"
// import path from "path"

// const db = path.resolve("db", "prefix.json")

// const handler = async (m, { conn }) => {
//   try {
//     if (!await isAdmin(conn, m)) {
//       return sendText(conn, m.chat, "kamu bukan admin", m)
//     }


//     const data = getUserData(db)
//     const prefixs = data.find((item) => item.id === m.chat)
//     const pref = Array.isArray(data) ? data.find((item) => item?.id === m.chat) : null;
//     const id = pref?.prefix || "."
//     const prefix = m.text.replace(`${id}setprefix`, "").trim()
//     if (!prefix) {
//       return sendText(conn, m.chat, "format salah, berikan prefix setelah .setprefix", m)
//     }
//     if (!prefixs) {
//       data.push({
//         id: m.chat,
//         prefix
//       })
//     } else {
//       prefixs.prefix = prefix
//     }

//     saveUserData(db, data)

//     return sendText(conn, m.chat, "prefix berhasil di ubah", m)
//   } catch (error) {
//     console.error(error)
//     return sendText(
//       conn,
//       m.chat,
//       "terjadi kesalahan pada saat mengubah prefix silahkan di ulang",
//       m
//     )
//   }
// }

// handler.command = "setprefix"
// handler.category = "Menu Admin"

// export default handler
