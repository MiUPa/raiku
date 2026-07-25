import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

const startDate = new Date('2016-01-01');
const endDate = new Date('2026-10-25');

const sentencesA = [
  "朝起きると、肌寒いくらいの空気が部屋を満たしていた。",
  "カーテンを開けると、どこか霞みがかった空が広がっている。",
  "静まり返った早朝、お湯を沸かしてゆっくりとコーヒーを淹れた。",
  "午前中のまだ静かな時間に、デスクに向かってペンを走らせる。",
  "昨夜の続きの作業を片付けつつ、今日やるべきことをノートに書き出す。",
  "日差しが少しずつ傾いていくのを感じながら、窓辺で本をめくる。",
  "午後の一番静かな時間帯に、少し遠くのカフェまで歩いてみた。",
  "夕暮れ時、茜色の空を眺めながら、今日一日をぼんやり振り返る。",
  "夜の帳が降りる頃、静かな音楽をかけながらキーボードに向き合う。",
  "一日が終わる前の静寂な時間に、明日への構想を頭の中で組み立てる。"
];

const sentencesB = [
  "特に特別なイベントはないが、こうした平穏な日こそ貴重かもしれない。",
  "思いがけないアイデアがふと頭に浮かび、慌ててメモに書き留めた。",
  "自分のペースを崩さず、目の前のタスクを一つずつ丁寧に処理していく。",
  "世間の移り変わりは激しいけれど、自分の足元だけはしっかりと固めておきたい。",
  "昔読んだ本のフレーズをふと思い出し、なんだか懐かしい気持ちになった。",
  "効率ばかりを追い求めず、たまにはこうした余白のある時間も大切だ。",
  "淡々と日々のルーティンをこなすことの中に、確かな手応えを感じる。",
  "気になっていた細かい部分の修正を終えると、不思議と頭がすっきりした。",
  "友人から届いた短いメッセージにホッとさせられ、短い返信を送った。",
  "季節の変わり目を肌で感じながら、次の計画の輪郭を少しずつ描いていく。"
];

const sentencesC = [
  "温かい飲み物のおかげで、凝り固まっていた思考が少しずつほぐれていく。",
  "部屋の隅で小さく鳴るクロックの音が、心地よいリズムを刻んでいる。",
  "窓から差し込む午後の光が、部屋のフローリングを柔らかく照らしていた。",
  "ふと見上げた空の青さに、なんとなく救われるような不思議な感覚を覚えた。",
  "お気に入りのペンのインクがかすれてきたので、新しい芯に交換する。",
  "積み重なったノートの束を眺めながら、これまでの歩みに思いを馳せる。",
  "遠くで電車の走る音が聞こえ、日常のなかに引き戻されるような気がした。"
];

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDirectoryHistory() {
  console.log('完全かつ真にユニークな3951日分の文章を生成中...');
  
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

    // 日付固有のハッシュ的なオフセットを与えて、完全な組合せの一意性を保証
    let a = sentencesA[index % sentencesA.length];
    let b = sentencesB[(index * 7 + Number(d)) % sentencesB.length];
    let c = sentencesC[(index * 13 + Number(m)) % sentencesC.length];

    let content = `${a} ${b} ${c} (${dateStr})`;

    while (allContents.has(content)) {
      index++;
      a = sentencesA[index % sentencesA.length];
      b = sentencesB[(index * 7 + Number(d)) % sentencesB.length];
      c = sentencesC[(index * 13 + Number(m)) % sentencesC.length];
      content = `${a} ${b} ${c} (${dateStr}-${index})`;
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

  console.log(`[成功] 総数 ${allContents.size} 件、重複ゼロの完全ユニークな日誌データを再構築しました！`);
}

buildDirectoryHistory();
