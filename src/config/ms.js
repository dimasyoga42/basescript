// =========================================================
// CATATAN PENTING:
// @ryuu-reinzz/haruka-lib versi ini sudah DEPRECATED.
// Dokumentasi resmi merekomendasikan pindah ke @ryuu-reinzz/luna-lib.
// Jika AIRich/addProduct/dll gagal terus, kemungkinan besar karena
// backend lama yang dipakai library ini sudah tidak aktif/di-maintain.
// =========================================================

import { Button, ButtonV2, Carousel, AIRich } from "@ryuu-reinzz/luna-lib";

// -------------------------------------------------------
// 1. BUTTON (Native Flow Message) - via messageBuilder
// -------------------------------------------------------
export async function demoButton(sock, m) {
  try {
    await sock
      .messageBuilder(m.chat, { quoted: m })
      .setType("Button")
      .setTitle("🚀 Ryuu")
      .setSubtitle("Interactive Message")
      .setBody("Pilih menu di bawah")
      .setFooter("© Ryuu")
      .addReply("📦 Menu", ".menu", { icon: "DEFAULT" })
      .addReply("👤 Profile", ".profile", { icon: "REVIEW" })
      .addUrl("🌐 Website", "https://example.com", true, { icon: "PROMOTION" })
      .addCopy("📋 Copy Code", "NIX-2026", { icon: "DOCUMENT" })
      .addSelection("📚 Pilih Kategori")
      .makeSection("Main Menu")
      .makeRow("🔥 HOT", "Downloader", "Download social media", ".dl")
      .makeRow("⚡ FAST", "AI Chat", "Chat dengan AI", ".ai")
      .send();
  } catch (err) {
    console.error("[Button] Gagal kirim:", err?.message, err?.stack);
  }
}

// -------------------------------------------------------
// 2. BUTTONV2 (Classic Fallback Buttons) - via messageBuilder
// -------------------------------------------------------
export async function demoButtonV2(
  sock,
  m,
  title,
  body,
  footer,
  subtitle,
  thub = "https://cdn.ornzora.eu.cc/4d2905ce-3707-4ec0-998a-68a3d851629f-FIORA.jpg",
) {
  try {
    await sock
      .messageBuilder(m.chat, { quoted: m })
      .setType("ButtonV2")
      .setTitle(title)
      .setSubtitle(subtitle)
      .setBody(body)
      .setFooter(footer)
      .setThumbnail(thub)
      .addButton("cekvip", ".cekvip")
      .send();
  } catch (err) {
    console.error("[ButtonV2] Gagal kirim:", err?.message, err?.stack);
  }
}

// -------------------------------------------------------
// 3. CAROUSEL (Interactive Cards Slider) - via operator new
//    (sesuai dok: card dibuat dari Button(conn)...toCard())
// -------------------------------------------------------
export async function demoCarousel(sock, m) {
  try {
    await new Carousel(sock)
      .setBody("🛍️ Product List")
      .setFooter("Swipe untuk lihat")
      .addCard(
        await new Button(sock)
          .setTitle("🍔 Burger")
          .setBody("Burger terenak")
          .setFooter("$5")
          .setImage(
            "https://cdn.ornzora.eu.cc/36df8c36-c74e-4dc2-bc03-87893f373cb4-FIORA.jpg",
          )
          .addReply("🛒 Buy", ".buy burger")
          .toCard(),
      )
      .addCard(
        await new Button(sock)
          .setTitle("🍕 Pizza")
          .setBody("Pizza mozzarella")
          .setFooter("$7")
          .setImage(
            "https://cdn.ornzora.eu.cc/36df8c36-c74e-4dc2-bc03-87893f373cb4-FIORA.jpg",
          )
          .addReply("🛒 Buy", ".buy pizza")
          .toCard(),
      )
      .send(m.chat, { quoted: m });
  } catch (err) {
    console.error("[Carousel] Gagal kirim:", err?.message, err?.stack);
  }
}

// -------------------------------------------------------
// 4. AIRICH (Meta AI Response Style) - via messageBuilder
//    Disederhanakan dari contoh dokumentasi; jalankan bagian per
//    bagian (addText, addProduct, dst.) kalau ingin isolasi error.
// -------------------------------------------------------
export async function demoAIRich(sock, m) {
  try {
    await sock
      .messageBuilder(m.chat, { quoted: m })
      .setType("AIRich")
      .setTitle("🚀 Ryuu")
      .setFooter("© Haruka")
      .addSuggest(["Ryuu", "Ryuu", "Haruka"])
      .addTip("Ini adalah text tip (Metadata Text)")
      .addText(
        `# Halo Dunia\n=={ Yellow Text }==\n\nIni hyperlink:\n[Google](https://google.com)`,
      )
      .addProduct({
        title: "Nama Produk",
        brand: "Ryuu",
        price: "Rp 1000",
        sale_price: "Rp 0",
        product_url: "https://wa.me/6288246552068",
        icon_url:
          "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/additional_image_1.png",
        image_url:
          "https://api.ryuu-dev.offc.my.id/src/assest/mahiru/Mahiru-10.jpg",
      })
      .addCode(
        "javascript",
        `class Ryuu {\n  static hello() {\n    return 'Hello World';\n  }\n}`,
      )
      .addTable([
        ["Nama", "Role"],
        ["Ryuu", "Developer"],
        ["Haruka", "Assistant"],
      ])
      .addImage(
        "https://api.ryuu-dev.offc.my.id/src/assest/mahiru/Mahiru-07.jpg",
      )
      .send();
  } catch (err) {
    // Paling penting: log detail lengkap, karena AIRich paling sering
    // gagal akibat backend deprecated/endpoint sudah mati.
    console.error("[AIRich] Gagal kirim.");
    console.error("Message:", err?.message);
    console.error("Stack:", err?.stack);
  }
}
