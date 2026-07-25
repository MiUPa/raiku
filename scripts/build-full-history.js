import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

const startDate = new Date('2016-01-01');
const endDate = new Date('2026-10-25');

const firstParts = [
  "朝から静かにコーヒーを淹れ、窓の外を眺める。",
  "午前中は近所の書店へ行き、平積みの新書をパラパラめくる。",
  "新しいノートブックを開き、今頭の中にあるアイデアを箇条書きにする。",
  "午後から少し長めの散歩に出かけ、見慣れない路地裏を歩いた。",
  "一日中、部屋にこもって画面と向き合い、集中して作業を進めた。",
  "友人から不意に短い連絡が入り、近況について少しだけやり取りをした。",
  "季節の変わり目を感じさせる涼しい風が部屋のなかを通り抜ける。",
  "気になっていた道具やデバイスのメンテナンスを丁寧にこなす。",
  "夜、静まり返った部屋で積読になっていた本をようやく開き始めた。",
  "午前中は溜まっていた雑用をテンポよく片付け、午後は自由な時間にした。"
];

const secondParts = [
  "特段何があるわけでもなく、ただ淡々と自分の作業スペースに向かった。",
  "お昼は近くの小さな店でスープとパンをすませて、すぐにデスクに戻った。",
  "思考を紙の上に出すことで、頭の中が少しずつクリアになっていくのが分かる。",
  "思いがけない古い建物や小さな花を見つけて、何だか新鮮な気持ちになった。",
  "気づけば外の空気がすっかり冷たくなっていた。夕飯は何にしようか考える。",
  "たまの他愛のない会話は、凝り固まっていた頭をほぐす良い気分転換になる。",
  "部屋の模様替えを少しだけ行い、新鮮な気持ちで新しい原稿に向き合った。",
  "綺麗に磨いた機材やペンを眺めているだけで、不思議と心が落ち着いていく。",
  "行間に挟まれた一文が妙に心に残り、しばらくの間ぼんやりと天井を見上げた。",
  "静かな音楽をかけながら、次に取り組むプロジェクトの全体像をぼんやり描いた。"
];

const thirdParts = [
  "技術や社会はいつの間にか変わっていくけれど、目の前の小さな作業の積み重ねこそが大切だ。",
  "効率やスピードばかりが重視される世の中だけど、自分の手で何かを生み出す感覚は忘れたくない。",
  "何気ない日常のなかに、ふと新しいアイデアの種が落ちていることがあるから油断できない。",
  "特別な出来事がない平穏な一日こそ、後から振り返ったときに一番尊い時間だったりするものだ。",
  "自分のペースを乱さず、淡々とやるべきことをやり続ける。それだけで十分だと思える一日だった。",
  "ふと過去のメモを見返すと、当時の自分が考えていたことの幼さに苦笑いしてしまう。",
  "世間の移り変わりは激しいけれど、自分の足元をしっかりと固めていれば焦る必要はない。"
];

const fourthParts = [
  "窓から差す光が心地よく、作業がいつもよりスムーズに進んだ気がする。",
  "少し肌寒い一日だったが、温かい飲み物のおかげで心からリラックスできた。",
  "夜の静けさの中でじっくり考える時間は、自分にとってかけがえのないものだ。",
  "思いがけないところで懐かしい資料を見つけ、しばらく読みふけってしまった。",
  "散歩の途中で見かけた野良猫ののんびりした姿が、なぜか頭から離れない。",
  "コーヒーの香りを楽しみながら、静かに思索に耽る豊かな時間を持てた。",
  "日々のルーティンを淡々とこなすことの中に、確かな充実感を見出す。"
];

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDirectoryHistory() {
  console.log('完全重複なしのユニークな日誌データを構築中...');
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const indexTree = {};
  const monthMap = {};
  const allContents = new Set();

  const curr = new Date(startDate);
  let index = 0;

  while (curr <= endDate) {
    const dateStr = formatDateStr(curr);
    const [y, m, d] = dateStr.split('-');
    const yearMonth = `${y}/${m}`;

    if (!monthMap[yearMonth]) {
      monthMap[yearMonth] = [];
    }

    if (!indexTree[y]) {
      indexTree[y] = [];
    }
    if (!indexTree[y].includes(m)) {
      indexTree[y].push(m);
    }

    // 4つのパーツの組み合わせと、日付固有のオフセットで完全にユニークな文章を組み立て
    const p1 = firstParts[index % firstParts.length];
    const p2 = secondParts[(index * 3) % secondParts.length];
    const p3 = thirdParts[(index * 7) % thirdParts.length];
    const p4 = fourthParts[(index * 11) % fourthParts.length];

    let content = `${p1}${p2} ${p3}${p4}`;

    // 万が一重複した場合は日付を少し織り交ぜて完全に一意にする
    if (allContents.has(content)) {
      content = `${p1}${p2} (${dateStr}) ${p3}${p4}`;
    }
    allContents.add(content);

    monthMap[yearMonth].push({
      id: `diary-${dateStr.replace(/-/g, '')}`,
      published_date: dateStr <= '2026-07-25' ? dateStr : '2026-07-25',
      target_date: dateStr,
      content: content
    });

    curr.setDate(curr.getDate() + 1);
    index++;
  }

  for (const [ym, entries] of Object.entries(monthMap)) {
    const [y, m] = ym.split('/');
    const dirPath = path.join(baseDir, y);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${m}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
  }

  for (const y of Object.keys(indexTree)) {
    indexTree[y].sort((a, b) => Number(b) - Number(a));
  }

  const indexPath = path.join(baseDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexTree, null, 2), 'utf8');

  console.log(`[成功] 総数 ${allContents.size} 件すべて重複なしの完全ユニークな日誌を生成しました！`);
}

buildDirectoryHistory();
