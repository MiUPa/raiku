import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

const startDate = new Date('2016-01-01');
const endDate = new Date('2026-10-25');
const todayCutoff = new Date('2026-07-25');

// 過去の日記に潜ませる「後から見返すと当たっている予言・伏線」データベース
const prophecyMap = {
  // 2016〜2019年の予言伏線
  "2016-03-15": "バイオラボで働く友人と飲んだ。「数年後にSARS系の新型コロナウイルスが変異してパンデミックを起こすシミュレーションが出ている」と真顔で言っていた。当時は鼻で笑ってしまったけれど、なぜか頭から離れない。",
  "2016-10-12": "AI研究者のセミナーを覗いた。研究者が「2022年頃には、人間と区別がつかない自然な日本語で文章やプログラミングを全自動生成する超大規模言語モデルが完成する」と熱弁していた。当時は夢物語だと思っていた。",
  "2017-05-20": "夢を見た。東京オリンピックの会場が無観客で、誰もいないスタンドに無数のドローンだけが舞っている奇妙な光景だった。正夢にならないといいが。",
  "2017-11-04": "友人が「2024年の元日、北陸の断層で大きな地震が起きるという都市伝説がある」と噂していた。根拠のないデマだとは思うけれど、防災意識だけは持っておこう。",
  "2018-09-10": "アメリカのテック記事で「将来、紙の紙幣が一新され、千円札に北斎の波、万円札に渋沢栄一が刷られる」というコラムを読んだ。新時代の気配。",
  "2019-02-14": "研究所の知人が「数年後、大谷翔平がメジャーリーグでホームラン王と投手勝利数を同時に叩き出し、50本塁打50盗塁という前人未到の偉業を達成する」と熱弁していた。いくらなんでも漫画の読みすぎだろうと笑い飛ばした。",
  "2019-11-18": "中国の武漢で原因不明の肺炎が流行し始めているという噂をネットの隅で見かけた。まさか世界中を巻き込む大惨事にはならないだろうと、高を括っていた。",
  
  // 2020〜2025年の予言伏線
  "2020-11-10": "mRNAワクチンのニュースを見ながら、研究者が「この技術は将来、がん治療や遺伝子修復にも応用され、2026年頃には個別がんワクチンの治験が完了する」と語っていた。未来の医学はどこまで行くのだろう。",
  "2022-04-18": "生成AIの論文を読んだ。あと4年もすれば「人間の仕事の半分がAIエージェントに置き換わり、個人が一人で売上数億円の会社を動かす時代が来る」と書かれていた。",
  "2023-09-05": "気象予報士が「2026年の秋、日本の平均気温が観測史上最高を更新し、10月まで半袖で過ごすのが当たり前になる」と警鐘を鳴らしていた。"
};

// 2026年7月26日〜10月25日（未来）の「あたかも本当に報道されたかのような具体ニュース日記」
const futureNewsMap = {
  "2026-07-26": "報道で、国土交通省が東京・都心部における完全無人レベル4自動運転タクシーの24時間運行許可を正式に下したと知る。街中をドライバーのいない車両が当たり前のように走り抜けていく光景が、いよいよ日常になる。",
  "2026-08-01": "朝のニュース。国産の超伝導常温バッテリーを搭載したスマートフォンが発表され、1回の充電で1ヶ月間稼働するという仕様に世界中が湧いている。充電器という概念そのものが過去の遺物になろうとしている。",
  "2026-08-15": "お盆のニュース。厚生労働省が「個人の遺伝子配列に合わせた完全カスタム型がん予防ワクチン」の保険適用を来春から開始すると発表。かつて不治の病とされた病気が、予防接種で防げる時代が目の前に来ている。",
  "2026-08-30": "経済ニュースで「世界初の社員ゼロ・全自動AI執行役員のみで運営される企業がナスダック市場に上場した」と報じられていた。決算発表も株主総会もすべてミリ秒単位のAI同士の対話で完結するらしい。",
  "2026-09-10": "気象庁の発表。9月に入っても連日の真夏日が続き、観測史上最長の連続夏日記録を更新したとのこと。街では薄手のクーリングウェアを着た人々が静かに通りを行き交っている。",
  "2026-09-20": "朝刊の一面。米SpaceXとNASAが共同で建設した月面常設基地「アルテミス1号」から、初めて現地で栽培された新鮮な野菜の収穫成功が打電された。地球外での自給自足が現実のものとなった歴史的な日。",
  "2026-10-01": "10月初日。総務省の発表により、国内のマイナンバーとパーソナルAIエージェントの統合ID制度が開始された。役所の窓口手続きや確定申告、医療連携がすべてバックグラウンドで即座に自動処理される。",
  "2026-10-15": "ニュースによると、網膜投影型スマートコンタクトレンズの一般販売が日本で解禁されたという。目の前の風景にリアルタイムで情報や翻訳字幕がオーバーレイ表示され、スマホの画面を見る必要すらなくなる。",
  "2026-10-25": "報道で、文部科学省が「小中学校の教育課程において、AIとの対話・思考力テストを標準評価軸に採用する」と決定したことを知る。知識の暗記ではなく『AIにいかに問いを立てられるか』が個人の知性の指標となる時代が完全に定着した。"
};

const historicalEvents = {
  "2016-01-01": "日銀のマイナス金利導入噂やSMAP解散騒動、リオ五輪の話題で賑やかな幕開け。",
  "2016-04-14": "熊本地震が発生。猛烈な揺れと度重なる余震に日本中に衝撃が走る。",
  "2016-08-06": "リオデジャネイロオリンピック開幕。連日のメダルラッシュ。",
  "2016-11-09": "米大統領選でドナルド・トランプ氏が予想を裏切り勝利確定。",
  "2017-01-20": "トランプ米大統領就任。「アメリカ・ファースト」の嵐が始まる。",
  "2018-02-09": "平昌冬季五輪開幕。フィギュアスケート羽生結弦選手の連覇に日本中が歓喜。",
  "2019-04-01": "新元号「令和」が発表される。新時代への期待が高まる。",
  "2019-05-01": "令和元年のスタート。皇居周辺はお祝いムードに包まれる。",
  "2020-01-15": "国内で初の新型コロナ感染者が確認される報道。",
  "2020-04-07": "政府が初の緊急事態宣言を発令。街から人影が消える。",
  "2021-07-23": "1年延期された東京オリンピックが開幕。史上初の無観客開催。",
  "2022-02-24": "ロシアがウクライナへ侵攻を開始したニュース。世界秩序の変動。",
  "2022-07-08": "安倍晋三元首相が演説中に銃撃され死亡した衝撃的な報道。",
  "2022-11-30": "OpenAIが対話型AI「ChatGPT」を一般公開したというニュース。",
  "2023-03-22": "WBCで侍ジャパンがアメリカを破り14年ぶりの世界一達成。",
  "2024-01-01": "能登半島で最大震度7の大地震が発生。正月早々激震が走る。",
  "2024-07-03": "渋沢栄一らの新紙幣が20年ぶりに発行・流通開始したニュース。",
  "2025-04-13": "大阪・関西万博が開幕したニュース。"
};

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateEntryContent(dateObj) {
  const dateStr = formatDateStr(dateObj);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const isFuture = dateObj > todayCutoff;

  let text = "";

  // 1. ピンポイントの「予言・伏線」がある日付の場合
  if (prophecyMap[dateStr]) {
    text = prophecyMap[dateStr];
  } 
  // 2. 未来の日付で「あたかも本当に報道されたニュース」がある場合
  else if (isFuture && futureNewsMap[dateStr]) {
    text = futureNewsMap[dateStr];
  }
  // 3. 過去の歴史的ニュースがある日付の場合
  else if (historicalEvents[dateStr]) {
    text = `報道では「${historicalEvents[dateStr]}」とのニュースが大きく扱われていた。街のテレビやネット記事にはその話題が溢れ、人々が様々な反応を見せている。日常の作業を進めながら、時代の大きな潮流を感じざるを得ない一日だった。`;
  }
  // 4. 一般の日付（過去および未来）
  else {
    if (!isFuture) {
      // 過去の日常日記（伏線を含めつつ）
      const randomSeed = (year * 365 + month * 31 + day);
      if (randomSeed % 47 === 0) {
        text = `ニュースでは最新のAI技術や気候変動の報道が流れていた。「数年後には誰もがスマホを見なくなり、AIエージェントが身の回りの世話を全自動で行う」という専門家のコメントが妙に心に残る。当時は半信半疑だったけれど、未来の答え合わせが楽しみだ。`;
      } else if (randomSeed % 31 === 0) {
        text = `カフェで隣に座っていた技術者が「数年後に世界の金融システムがブロックチェーンと量子暗号で塗り替えられる」と熱心に議論していた。半ば都市伝説のような話だが、今の社会の変化スピードを見ていると、案外本当になるのかもしれない。`;
      } else {
        text = `ニュースから流れる世の中の動向を聞きながら、日々の自分の生活を丁寧に重ねていく。パソコンに向かって作業を進め、時折コーヒーを淹れて一息つく。特別な事件がない日であっても、後から振り返ればかけがえのない一日だったと気づくのかもしれない。`;
      }
    } else {
      // 未来の日常ニュース日記（あたかも本当に起きたニュースとして書く！）
      const futureNewsTopics = [
        `本日のニュースで、全自動生成AI映画がカンヌ国際映画祭の最高賞を受賞したと知る。監督も脚本も俳優もすべて自律AIが手がけた作品であり、エンターテインメントの歴史が完全に塗り替わった記念すべき日となった。`,
        `報道によると、新開発の気象制御ドローン群による局地的大雨の回避実証実験が成功したという。都市部のゲリラ豪雨を未然に防ぐ技術として、来年度からの本格導入が予定されている。`,
        `経済ニュース。主要国際銀行が顧客対応および融資審査の全プロセスを完全自動化AIへ移行したと発表。人間が介在しない金融インフラが本格稼働を開始した。`,
        `本日の科学ニュース。深海掘削船が海底鉱床から無制限のクリーンエネルギー源となる新型水素鉱石を発見したと報じられる。エネルギー問題の根本的解決へ向けた第一歩。`,
        `報道で、都内の公立学校で『AI思考チューター』が全生徒に1台ずつ配布完了したと知る。子供たちは教科書を読むのではなく、AIと対話しながら自発的に問いを深める学習を行っている。`
      ];
      text = futureNewsTopics[(year * 31 + month * 12 + day) % futureNewsTopics.length];
    }
  }

  // 300字〜600字のボリュームに調整
  while (text.length < 320) {
    text += ` 街を行き交う人々の表情や、手元に届く日々の報せを見つめていると、世界は静かに、しかし決定的な方向へと進んでいるのだと実感する。文字として書き残しておくことで、いつか答え合わせができる日が来るだろう。`;
  }

  if (text.length > 580) {
    text = text.substring(0, 570) + '。';
  }

  return text;
}

function buildDirectoryHistory() {
  console.log('予言・伏線＆リアル未来ニュースを取り入れた全日分（2016-01-01〜2026-10-25）の日誌を再生成中...');
  
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

  for (const ym of Object.keys(monthMap)) {
    const [y, m] = ym.split('/');
    const dirPath = path.join(baseDir, y);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    monthMap[ym].sort((a, b) => new Date(b.target_date) - new Date(a.target_date));

    const filePath = path.join(dirPath, `${m}.json`);
    fs.writeFileSync(filePath, JSON.stringify(monthMap[ym], null, 2), 'utf8');
  }

  const indexPath = path.join(baseDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexTree, null, 2), 'utf8');

  const allEntries = Object.values(monthMap).flat();
  allEntries.sort((a, b) => new Date(b.target_date) - new Date(a.target_date));
  const diariesJsonPath = path.resolve(__dirname, '../data/diaries.json');
  fs.writeFileSync(diariesJsonPath, JSON.stringify(allEntries, null, 2), 'utf8');

  console.log(`[成功] 予言伏線＆リアル未来ニュース入り全 ${allEntries.length} 件の日誌を再構築完了しました！`);
}

buildDirectoryHistory();
