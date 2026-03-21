import { sendText } from "../../../src/config/message.js";

const handler = (m, { conn }) => {
  try {
    const stattxt =
      `Exemple:\n- .fillarm dteearh%=Max,cd%=10,cd=20,cr=Max,acc%=min,acc=min,matk%=min,penmag%=min,pot112,lv290,bs300\n- .fillwep eledark%=1,dteligth%=Max,cd%=10,cd=20,dodge%=min,hpreg%=min,hpreg=min,pot122,lv290,bs300
stat yang bisa digunakan:
min = untuk status yang di negatifkan
max = poin status maksimal
lv = adalah level char (wajib)
bs = level Blacksmith profession (opsional)

cd, critdmg, cd%, critdmg% = Critical Damage
cr, cr%, crtirate, critrate% = Critical Rate
atk, atk% = ATK
matk, matk% = MATK
def, def%
mdef, mdef%
acc, acc% accuracy, accuracy%
hp, hp% = MaxHP
mp, mp% = MaxMP
str, str%
int, int%
agi, agi%
vit, vit%
dex, dex%
aspd, aspd%
cspd, cspd%
dodge, dodge%
hpreg, hpreg% = Natural HP Regen
mpreg, mpreg% =  Natural MP Regen
stab, stab%
penfis% = Penetrasi Fisik %
penmag% = Magic Pierce %
kebalfis% = Kekebalan Fisik %
kebalmag% = Kekebalan Sihir %
aggro% = aggro%
dteearth%: % luka ke Bumi
dteearth: % luka ke Bumi
dtefire%: % luka ke Api
dtefire: % luka ke Api
dtewind%: % luka ke Angin
dtewind: % luka ke Angin
dtewater%: % luka ke Air
dtewater: % luka ke Air
dtelight%: % luka ke Cahaya
dtelight: % luka ke Cahaya
dtedark%: % luka ke Gelap
dtedark: % luka ke Gelap
eleearth
eledark
elefire
elewind
elewater
elelight
      `.trim();

    sendText(conn, m.chat, stattxt, m);
  } catch (err) {
    sendText(conn, m.chat, err.message, m);
  }
};

handler.command = "stats";
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
