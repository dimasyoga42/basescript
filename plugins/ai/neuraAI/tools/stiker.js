export const sendStiker = async (teks) => {
  try {
    const data = {
      ketawa: [
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/5a303eb6-c737-4394-bfdf-355a3611277a.png',
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/5a303eb6-c737-4394-bfdf-355a3611277a.png',
      ],
      sedih: [
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/c723f4f4-3410-4b90-b540-72d3b69f3a79.png',
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/c723f4f4-3410-4b90-b540-72d3b69f3a79.png',
      ],
      marah: [
        'https://stickerly.pstatic.net/sticker_pack/10FgGdXR9Ln6wv58x7s3CQ/PH4662/3/f82f5f15-ba92-4c97-888b-a59385f8447d.png',
        'https://stickerly.pstatic.net/sticker_pack/OVrxTADFZNxXZVmxVvxTMA/IJVR04/31/113b6864-2aca-4e2d-8306-82b8a4e156ba.png',
      ],
      mikir: [
        "https://i.pinimg.com/736x/85/23/18/852318e119962d1a9245636458b25bd5.jpg"
      ],
      bingung: [
        "https://i.pinimg.com/736x/35/70/9a/35709ac6fd575dffedadafefaee5861b.jpg"
      ],
      nyesel: [
        "https://i.pinimg.com/736x/51/50/98/515098b04e20ff49248a7c76e9bc563b.jpg"
      ],
      spam: [
        "https://i.pinimg.com/736x/f7/c0/f9/f7c0f9e6c376998cf6106552d84fc58b.jpg",
        "https://i.pinimg.com/736x/32/fa/1b/32fa1b28a8d1868390b3aea02030c1a5.jpg",
        "https://i.pinimg.com/736x/b8/6e/20/b86e20d1b8fec465aa412acd3759bdea.jpg",
        "https://i.pinimg.com/736x/8f/76/7a/8f767a27eb39722c0be96790f71d9f3e.jpg",
        "https://i.pinimg.com/736x/a5/ce/df/a5cedf584eb1d19369e5b351b8c34470.jpg",
        "https://i.pinimg.com/736x/e5/88/d0/e588d036465fc77f0ae102b70c8428eb.jpg",
        "https://i.pinimg.com/736x/71/84/85/718485ad8fda50c4ca656dd25ef77db4.jpg",
        ""
      ],
      lawak: [
        "https://i.pinimg.com/736x/5f/84/da/5f84da6206caa2857f6916be7020542f.jpg",
        "https://i.pinimg.com/736x/c6/dc/4b/c6dc4b9b216861c0f55d8a9c7be0a06d.jpg"
      ],
      merasa_keren: [
        "https://i.pinimg.com/736x/31/b1/b0/31b1b05e548d0a2ad0c4e1bd8c14ddab.jpg"
      ],
      malu: [
        "https://i.pinimg.com/736x/4f/2c/14/4f2c142a6e17682787ed3d20aa71a8f7.jpg"
      ],
      curiga: [
        "https://i.pinimg.com/736x/38/05/ad/3805ad84c10d093885324cae736bbf67.jpg",
        "https://i.pinimg.com/736x/39/00/f1/3900f1de231130cfd93e3c49e4a52815.jpg",
      ],
      bingung: [
        "https://i.pinimg.com/736x/01/99/68/0199682e98fca55fddb324186076e427.jpg"
      ],
      tak_percaya: [
        "https://i.pinimg.com/736x/8c/db/fb/8cdbfb5ba520ff4cb27be0429ef844a0.jpg",
        "https://i.pinimg.com/736x/8a/92/d3/8a92d336c405fa64fd7358086072b4a7.jpg",
        ""
      ]

    }

    const teksLower = (teks || '').toLowerCase()
    let kategori = null

    if (teksLower.includes('ketawa') || teksLower.includes('lucu') || teksLower.includes('haha')) {
      kategori = 'ketawa'
    } else if (teksLower.includes('sedih') || teksLower.includes('nangis')) {
      kategori = 'sedih'
    } else if (teksLower.includes('marah') || teksLower.includes('kesal')) {
      kategori = 'marah'
    }

    if (!kategori) return null

    const daftarStiker = data[kategori]
    const stikerTerpilih = daftarStiker[Math.floor(Math.random() * daftarStiker.length)]

    console.log('[sendStiker]', kategori, stikerTerpilih)
    return stikerTerpilih
  } catch (err) {
    console.log(err.message)
    return null
  }
}
