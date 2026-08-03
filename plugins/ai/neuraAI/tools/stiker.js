export const sendStiker = async (message, sock, m) => {
  try {
    const data = {
      ketawa: [
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/5a303eb6-c737-4394-bfdf-355a3611277a.png',
      ],
      sedih: [
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/c723f4f4-3410-4b90-b540-72d3b69f3a79.png',
      ],
      marah: [
        'https://stickerly.pstatic.net/sticker_pack/10FgGdXR9Ln6wv58x7s3CQ/PH4662/3/f82f5f15-ba92-4c97-888b-a59385f8447d.png',
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/113b6864-2aca-4e2d-8306-82b8a4e156ba.png',
      ]
    }

    // deteksi kategori dari isi pesan
    const teks = message.text?.toLowerCase() || ''
    let kategori = null

    if (teks.includes('ketawa') || teks.includes('lucu') || teks.includes('haha')) {
      kategori = 'ketawa'
    } else if (teks.includes('sedih') || teks.includes('nangis')) {
      kategori = 'sedih'
    } else if (teks.includes('marah') || teks.includes('kesal')) {
      kategori = 'marah'
    }

    if (!kategori) return // tidak ada kategori cocok, tidak kirim apa-apa

    const daftarStiker = data[kategori]
    const stikerTerpilih = daftarStiker[Math.floor(Math.random() * daftarStiker.length)]


  return  await sock.sendSticker(m.chat, {
      sticker: memeRes.data,
      packname: "Neura ai",
      author: "neura",
    });

  } catch (err) {
    console.log(err.message)
  }
}
