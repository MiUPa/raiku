import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

const startDate = new Date('2016-01-01');
const endDate = new Date('2026-10-25');
const todayCutoff = new Date('2026-07-25');

// 過去の日記に潜ませる「後から見返すと当たっている予言・伏線」（現実的な史実と連動）
const prophecyMap = {
  "2016-03-15": "バイオラボで働く友人と話した。「将来SARS系のウイルス変異が世界的に流行してリモートワークや手洗いが義務化される時代が来るかも」と言っていた。当時は聞き流していたが、2020年のあの状況を思うとゾッとする。",
  "2016-10-12": "AI研究者のセミナーに参加した。「2022年頃には自然な日本語で対話してコードや文章を全自動生成する大規模言語モデル（LLM）が登場する」と熱弁していた。当時は半信半疑だったが、ChatGPTが出た時にこの日のメモを思い出して鳥肌が立った。",
  "2017-05-20": "夢を見た。東京オリンピックの会場が無観客で、静まり返ったスタンドをカメラだけが捉えている光景だった。まさか1年延期されて本当に無観客開催になるとは、当時は思いもしなかった。",
  "2017-11-04": "友人が「2024年の元日、北陸で大きな地震が起きるという都市伝説がある」と噂していた。根拠のない話だと思っていたのに、能登半島地震が起きたとき真っ先にこの日の会話が頭をよぎった。",
  "2018-09-10": "テック系の記事で「2024年に紙幣が一新され、千円札に北斎の富嶽三十六景、万円札に渋沢栄一が採用される」というコラムを読んだ。今年本当に新紙幣を手にした時、時代の移り変わりを実感した。",
  "2019-02-14": "野球好きの同僚が「数年後、大谷翔平がメジャーでホームラン王を取り、さらに50本塁打50盗塁という前人未到の記録を作る」と熱弁していた。当時は流石に漫画の読みすぎだろと笑ったが、現実になって言葉を失った。"
};

// 2026年7月26日〜10月25日（未来）の「現実的で説得力のある技術進歩・社会ニュース」
const futureNewsMap = {
  "2026-07-26": "報道で、都営バスの一部限定ルートにおいて夜間時間帯のレベル3車線維持・自動ブレーキ支援システムの導入が開始されたと知る。ドライバーの負担軽減に向けた現実的な第一歩として、静かに運用が始まっている。",
  "2026-08-01": "朝のニュース。大手スマホメーカーが、厚さわずか5.8mmの新型折りたたみスマートフォンを発表した。バッテリー密度の向上により、従来のスマートフォンと変わらない重さと薄さを実現したという。技術の地道な進歩を実感する。",
  "2026-08-15": "経済ニュース。行政手続きのオンライン窓口において、AIエージェントによる確定申告や各種申請の自動書類チェック機能が本格導入されたと報じられていた。役所の待ち時間が大幅に削減されるという。",
  "2026-08-30": "IT系のニュース。スマートウォッチのセンサーによる「非侵襲型・連続血糖値傾向モニタリング機能」が、厚生労働省の医療機器一部承認を受けたとのこと。針を刺さずに健康管理ができる時代がすぐそこまで来ている。",
  "2026-09-10": "ニュースで、曲げられる「ペロブスカイト太陽電池」をビルの壁面に大規模設置する実証実験が都心部で始まったと知る。日本の高い素材技術が、都市型太陽光発電の新しい形として結実しつつある。",
  "2026-09-20": "報道によると、主要な音声AIアシスタントがバックグラウンドで飲食店のWEB予約や美容院の空き状況確認を代理完了する機能が国内で正式リリースされた。地味だが確実に生活が便利になっている。",
  "2026-10-01": "10月初日。新幹線の車内Wi-Fiおよび通信インフラが次世代通信規格へ更新され、トンネル内でも途切れることなく高速通信が可能になったというニュース。ビジネスパーソンの移動中の快適性が向上している。",
  "2026-10-15": "ニュースで、文部科学省がデジタル教科書と連動した「個別最適な学習AIアドバイザー」を全国の小中学校に段階導入すると発表。一人ひとりの得意・不得意に合わせた復習課題が自動生成される仕組みだ。",
  "2026-10-25": "本日の報道。住宅用全固体蓄電池の量産化ラインが国内工場で本格稼働を始めたというニュース。従来のバッテリーより安全性が高まり、家庭での太陽光発電の自家消費率が大きく向上すると期待されている。"
};

const historicalEvents = {
  "2016-01-01": "日銀のマイナス金利導入噂やSMAP解散騒動、リオ五輪の話題で賑やかな幕開け。",
  "2016-04-14": "熊本地震が発生。猛烈な揺れと度重なる余震に日本中に衝撃が走る。",
  "2016-08-06": "リオデジャネイロオリンピック開幕。連日のメダルラッシュ。",
  "2016-11-09": "米大統領選でドナルド・トランプ氏が予想を裏切り勝利確定。",
  "2017-01-20": "トランプ米大統領就任。「アメリカ・ファースト」の嵐が始まる。",
  "2018-02-09": "平昌冬季五輪開幕。フィギュアスケート羽生結弦選手の連覇に歓喜。",
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

  if (prophecyMap[dateStr]) {
    text = prophecyMap[dateStr];
  } 
  else if (isFuture && futureNewsMap[dateStr]) {
    text = futureNewsMap[dateStr];
  }
  else if (historicalEvents[dateStr]) {
    text = `報道では「${historicalEvents[dateStr]}」とのニュースが大きく扱われていた。街のテレビやネット記事にはその話題が溢れ、人々が様々な反応を見せている。日常の作業を進めながら、時代の大きな潮流を感じざるを得ない一日だった。`;
  }
  else {
    if (!isFuture) {
      const randomSeed = (year * 365 + month * 31 + day);
      if (randomSeed % 47 === 0) {
        text = `ニュースでは最新のAI技術や省エネ家電の進化についての報道が流れていた。「数年後にはスマホの充電が数分で完了し、書類作成の多くが自動化される」という専門家のコメントが妙に心に残る。当時は半信半疑だったけれど、着実にその未来へ近づいている。`;
      } else if (randomSeed % 31 === 0) {
        text = `カフェで隣に座っていた技術者が「数年後にウェアラブル端末で日常の健康傾向が常時モニタリングされるようになる」と熱心に議論していた。当時は新しいガジェットの話だと思っていたが、今の暮らしを見ていると確かにその通りになっている。`;
      } else {
        text = `ニュースから流れる世の中の動向を聞きながら、日々の自分の生活を丁寧に重ねていく。パソコンに向かって作業を進め、時折コーヒーを淹れて一息つく。特別な事件がない日であっても、後から振り返ればかけがえのない一日だったと気づくのかもしれない。`;
      }
    } else {
      // 現実的で説得力のある未来の技術・社会ニュース
      const realisticFutureNews = [
        `ニュースで、主要な映像配信サービスが動画のリアルタイム字幕生成および多言語吹き替えAIを導入したと知る。海外のマイナーな映画やドキュメンタリーも、違和感のない日本語音声で楽しめるようになった。`,
        `報道によると、都心の商業施設で配送用ロボットが夜間の在庫搬入や廊下の清掃を自律して行う実証実験が始まったという。派手さはないが、現場の人手不足を補う着実な技術の活用が進んでいる。`,
        `本日の経済ニュース。ノートPCやタブレット向けの急速充電規格が更新され、小型のアダプター1つで複数のデバイスを安全に超高速充電できる製品が普及してきたという。ガジェット周りの配線がすっきりしてきた。`,
        `IT技術のニュース。ブラウザ上のAI機能が進化し、長文のPDF資料や論文を自動で段落ごとに要約・マインドマップ化してくれるツールが標準搭載された。情報収集の効率が格段に上がっている。`,
        `報道で、自治体の防災アプリにおいてリアルタイムの河川水形・土砂災害リスクをAIが予測して避難通知を送るシステムが配備されたと知る。災害時の迅速な避難行動に繋がると期待されている。`
      ];
      text = realisticFutureNews[(year * 31 + month * 12 + day) % realisticFutureNews.length];
    }
  }

  // 300字〜600字のボリューム調整
  while (text.length < 320) {
    text += ` ニュースで取り上げられる技術や社会の進歩は、一見すると小さな変化の積み重ねのように見えて、数年単位で振り返ると確実に私たちの暮らしの当たり前を書き換えているのだと実感する。`;
  }

  if (text.length > 580) {
    text = text.substring(0, 570) + '。';
  }

  return text;
}

function buildDirectoryHistory() {
  console.log('現実的で説得力のある未来ニュース＆史実予言に修正した全日分（2016-01-01〜2026-10-25）の日誌を再生成中...');
  
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

  console.log(`[成功] 現実的な未来技術ニュースデータ (全 ${allEntries.length} 件) を再構築しました！`);
}

buildDirectoryHistory();
