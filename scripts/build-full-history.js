import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

const startDate = new Date('2016-01-01');
const endDate = new Date('2026-10-25');
const todayCutoff = new Date('2026-07-25');

const historicalEvents = {
  "2016-01-01": "マイナス金利政策やSMAP解散騒動、リオ五輪の話題で賑やかな幕開け。",
  "2016-04-14": "熊本地震が発生。猛烈な揺れと度重なる余震に不安が広がる。",
  "2016-08-06": "リオデジャネイロオリンピック開幕。連日のメダルラッシュに湧く。",
  "2016-11-09": "アメリカ大統領選でドナルド・トランプ氏が勝利。世界に激震。",
  "2017-01-20": "トランプ米大統領就任。保護主義と変化の時代の始まり。",
  "2017-10-22": "衆議院選挙。台風が接近する中での投票日。",
  "2018-02-09": "平昌冬季オリンピック開幕。フィギュアスケートなど感動の連続。",
  "2018-06-19": "サッカーワールドカップロシア大会、日本がコロンビアに歴史的勝利。",
  "2019-04-01": "新元号「令和」が発表される。街中に新時代への期待が満ちる。",
  "2019-05-01": "令和元年のスタート。天皇陛下ご即位。",
  "2019-10-12": "超大型台風19号が東日本を直撃。各地で河川が氾濫。",
  "2020-01-15": "国内で初の新型コロナウイルス感染者が確認される。",
  "2020-04-07": "初の緊急事態宣言が発令。街から人が消え、在宅勤務が始まる。",
  "2020-09-16": "菅義偉内閣が発足。",
  "2021-07-23": "1年延期された東京オリンピックが開幕。無観客での開催。",
  "2021-10-04": "岸田文雄内閣が発足。",
  "2022-02-24": "ロシアがウクライナへ侵攻を開始。世界秩序が根底から揺らぐ。",
  "2022-07-08": "安倍晋三元首相が狙撃される。ショックと混乱が日本中を覆う。",
  "2022-11-30": "OpenAIがChatGPTを公開。生成AIブームの幕開け。",
  "2022-12-02": "サッカーW杯カタール大会で日本がスペインを破りベスト16進出。",
  "2023-03-22": "WBCで侍ジャパンが世界一に輝く。栗山監督と大谷翔平の歓喜。",
  "2023-05-08": "新型コロナが感染症法上の5類へ移行。日常が戻り始める。",
  "2024-01-01": "能登半島地震が発生。おめでたい正月から一変し激震が走る。",
  "2024-07-03": "新紙幣（千円・五千円・万円）が発行される。",
  "2024-11-05": "米大統領選。再び世界が注目する注目の投票日。",
  "2025-04-13": "大阪・関西万博が開幕。夢洲に世界中から人が集まる。",
  "2026-07-25": "本日の静かな夏の日。空の色がどことなく青みを深めている。"
};

const weatherVariations = ["晴れ", "快晴", "曇り", "小雨", "雨", "大雨", "風が強い日", "過ごしやすい気候", "薄く雲が広がる空"];
const dailyMoods = [
  "朝から静かな時間が流れている。",
  "少し体が重かったが、温かいお茶を飲んで落ち着いた。",
  "近所の散歩コースで季節の移り変わりを感じた。",
  "街の雑踏を歩きながら、ふと昔のことを思い出していた。",
  "静かな夜。ラジオの音だけが部屋に響いている。",
  "仕事の手を止めて窓の外を眺めると、雲が速く流れていた。",
  "本棚の古い本を引っ張り出してしばらく読み入ってしまった。",
  "近所のスーパーで買い物をして帰宅。いつも通りの夕方。"
];

const futureMysteries = [
  "セルフレジの端末が声のトーンを変えて話しかけてきたような気がした。",
  "スマートフォンの写真フォルダに見覚えのない風景が数枚増えていた。",
  "夕方の空の色が、紫と緑の混ざった不思議な光を放っていた。",
  "バス停で隣にいた人が手元の何もない空間を静かに操作していた。",
  "部屋の温度計が示す数字と、肌で感じる体感温度が微妙にずれている。",
  "通りかかったカフェの看板の文字が、一瞬だけ読めない記号に見えた。",
  "風に乗ってどこか香ばしい金属のような匂いが漂ってきた。"
];

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 本文から冒頭の日付（YYYY年M月D日。）を取り除く！
function generateEntryContent(dateObj) {
  const dateStr = formatDateStr(dateObj);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();

  const isFuture = dateObj > todayCutoff;
  const event = historicalEvents[dateStr];

  let text = "";

  if (event) {
    text += `報道では「${event}」とのニュースが大きく扱われていた。`;
  }

  if (!isFuture) {
    const mood = dailyMoods[(year * 365 + month * 31 + day) % dailyMoods.length];
    const weather = weatherVariations[(year * 12 + day) % weatherVariations.length];
    
    text += `今日の天気は${weather}。${mood}`;
    
    if (year === 2016) {
      text += `新しい年の空気が街に漂っている。スマートフォンを眺めながら、これからの時代がどう変化していくのかをぼんやりと考えていた。時代の節目を感じさせる出来事がニュースで流れるたび、自分自身の日常のささやかな営みの大切さを再確認する。夜は温かい食事をとり、静かに読書をして過ごした。`;
    } else if (year === 2020) {
      text += `世界中が感染症の話題で持ちきりだ。マスクを着用して外に出ると、行き交う人々の表情もうかがえない。手洗いや消毒がすっかり日課になった。部屋の中で過ごす時間が長くなり、当たり前だった日常のありがたみを痛感する。夜、静まり返った街の灯りをベランダから見つめていた。`;
    } else if (year === 2024) {
      text += `時代はAIの進化や国際情勢の変化で目まぐるしく動き続けている。街中のデジタルサイネージには最新の技術やニュースが次々と映し出されるが、自分の足元にある日常は変わらず淡々と続いている。近所の公園を歩きながら、変わるものと変わらないものについて考えを巡らせた。`;
    } else {
      text += `ニュースから流れる世の中の動向を聞きながら、日々の自分の生活を丁寧に重ねていく。パソコンに向かって作業を進め、時折コーヒーを淹れて一息つく。特別な事件がない日であっても、後から振り返ればかけがえのない一日だったと気づくのかもしれない。今夜も静かに一日が更けていく。`;
    }
  } else {
    const mystery = futureMysteries[(month * 31 + day) % futureMysteries.length];
    text += `${mystery} ニュースや街の音はどこか遠く感じられ、自分の周りだけ時間の流れが少し変わっているような気がする。特別な恐怖があるわけではないけれど、未来へ向かってゆっくりと景色が変わっていく感覚。手元のノートにペンで言葉を残し、静かに目を閉じた。`;
  }

  while (text.length < 320) {
    text += `日々の記憶は少しずつ薄れていくけれど、こうして文字に残しておくことで、過去と未来の自分がどこかで繋がっているような心地がする。`;
  }

  if (text.length > 580) {
    text = text.substring(0, 570) + '。';
  }

  return text;
}

function buildDirectoryHistory() {
  console.log('2016-01-01 〜 2026-10-25 を年・月ごとのディレクトリ構造で出力します...');
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const indexTree = {}; // { "2016": ["01", "02", ...], "2017": [...] }
  const monthMap = {}; // "2016/01" -> [entries]

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

  // 年・月ごとのフォルダと JSON ファイルを作成
  for (const ym of Object.keys(monthMap)) {
    const [y, m] = ym.split('/');
    const dirPath = path.join(baseDir, y);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 新しい順（日付降順）
    monthMap[ym].sort((a, b) => new Date(b.target_date) - new Date(a.target_date));

    const filePath = path.join(dirPath, `${m}.json`);
    fs.writeFileSync(filePath, JSON.stringify(monthMap[ym], null, 2), 'utf8');
  }

  // ルートインデックスファイル index.json を保存
  const indexPath = path.join(baseDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexTree, null, 2), 'utf8');

  // 互換性のための単一の data/diaries.json も最新版に更新
  const allEntries = Object.values(monthMap).flat();
  allEntries.sort((a, b) => new Date(b.target_date) - new Date(a.target_date));
  const diariesJsonPath = path.resolve(__dirname, '../data/diaries.json');
  fs.writeFileSync(diariesJsonPath, JSON.stringify(allEntries, null, 2), 'utf8');

  console.log(`[成功] 年・月フォルダ構造 (data/diaries/YYYY/MM.json) をすべて構築完了しました！`);
}

buildDirectoryHistory();
