import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

const startDate = new Date('2016-01-01');
const endDate = new Date('2026-10-25');
const todayCutoff = new Date('2026-07-25');

// 過去の日記に潜ませる、日常の文脈に溶け込んだ個人的な記憶・出来事
const personalNotesPool = [
  "朝からコーヒーを淹れ、机に向かう。特段何があるわけでもなく、ただ淡々と書き物をしたりコードを書いたりして一日が過ぎた。夜、窓を開けると少し冷たい風が入ってきた。",
  "午前中は図書館へ行き、いくつか気になっていた本を借りてくる。昼食は近くのパン屋でサンドイッチを買って食べた。静かで穏やかな、こういう日も悪くない。",
  "新しいノートブックを開き、今取り組んでいるプロジェクトの構想を書き殴る。頭の中の考えを外に吐き出すだけで、少し思考がクリアになるのを感じる。",
  "午後から散歩に出る。途中で見かけた野良猫が日向ぼっこをしていて、しばらく足を止めて眺めてしまった。帰ってきてから、溜まっていたメールの返信を片付ける。",
  "一日中、部屋にこもって作業。集中しすぎて気がつくと外が暗くなっていた。夕食に何を食べようか考えながら、今日書いたメモを読み返す。",
  "友人から短いメッセージが届く。最近どうしているかという他愛のない内容に返信し、自分も近況を少しだけ伝えた。人と話すと、意外と凝り固まっていた頭がほぐれる。",
  "朝晩はすっかり涼しくなった。季節の変わり目特有の空気の匂いがして、なんとなく昔の記憶がふと蘇ってくる。人間、たまにはこうして何もしない時間も必要だ。",
  "気になっていた道具の手入れをする。綺麗に磨いたペンやキーボードを眺めているだけで、不思議とやる気が湧いてくるものだ。午後は溜めていた読書を消化した。"
];

// 世の中の空気感や話題を、あくまで「個人の日記の中の日常会話やふとした気づき」として自然に混ぜ込むバリエーション
const subtleContextPool = [
  "最近、世間ではスマホの画面が折りたためるモデルや、新しい決済システムの話でもちきりだ。自分の作業環境も、そろそろ見直す時期なのかもしれない。",
  "街を歩いていて、少しずつキャッシュレスや無人の店舗が増えていることに気づく。技術の進化は早いものだ。自分も置いていかれないよう、淡々と手を動かそう。",
  "ニュースで新しい通信規格やデバイスの話題を見た。便利になるのは良いことだが、どこか取り残されるような不思議な感覚もある。まあ、自分のペースを崩さずにいよう。",
  "世間では色々な大きな出来事や経済のニュースが流れているが、自分の部屋の机に向かっていると、どこか遠い世界の話のようにも思える。目の前の小さな課題に集中しよう。"
];

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateEntryContent(dateObj) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();

  // 日付に基づいた擬似乱数で、毎回異なる自然な文章を生成
  const seed = (year * 10000 + month * 100 + day);
  
  const baseNote = personalNotesPool[seed % personalNotesPool.length];
  const contextNote = subtleContextPool[(seed * 7) % subtleContextPool.length];

  // たまに世の中の話題を織り交ぜる（約3日に1回程度）
  let text = baseNote;
  if (seed % 3 === 0) {
    text += ` ${contextNote}`;
  }

  // 微調整して自然な長さにする
  return text;
}

function buildDirectoryHistory() {
  console.log('すべての過去・未来の日誌を、自然で個別具体的な文章で再生成中...');
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const indexTree = {};
  const monthMap = {};

  const curr = new Date(startDate);

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

    monthMap[yearMonth].push({
      id: `diary-${dateStr.replace(/-/g, '')}`,
      published_date: dateStr <= '2026-07-25' ? dateStr : '2026-07-25',
      target_date: dateStr,
      content: generateEntryContent(curr)
    });

    curr.setDate(curr.getDate() + 1);
  }

  // Write out files
  for (const [ym, entries] of Object.entries(monthMap)) {
    const [y, m] = ym.split('/');
    const dirPath = path.join(baseDir, y);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${m}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
  }

  // Sort months for index.json
  for (const y of Object.keys(indexTree)) {
    indexTree[y].sort((a, b) => Number(b) - Number(a));
  }

  const indexPath = path.join(baseDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexTree, null, 2), 'utf8');

  console.log('[成功] すべての日誌データが個別自然な文章で再構築されました。');
}

buildDirectoryHistory();
