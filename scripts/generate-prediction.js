import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../data/diaries');

function getDates() {
  const today = new Date();
  const target = new Date();
  target.setMonth(target.getMonth() + 3);

  const formatDate = (d) => d.toISOString().split('T')[0];

  return {
    published_date: formatDate(today),
    target_date: formatDate(target),
    id: `diary-${formatDate(today).replace(/-/g, '')}`
  };
}

async function generateDiary() {
  const { published_date, target_date, id } = getDates();
  const [y, m, d] = target_date.split('-');
  console.log(`[合同会社来Q - 未来ニュース日誌 Generator] 開始`);
  console.log(`本日: ${published_date} -> 対象日: ${target_date}`);

  const monthFilePath = path.join(baseDir, y, `${m}.json`);
  let monthEntries = [];
  
  if (fs.existsSync(monthFilePath)) {
    const raw = fs.readFileSync(monthFilePath, 'utf8');
    monthEntries = JSON.parse(raw);
  }

  const existing = monthEntries.find(entry => entry.target_date === target_date);
  if (existing) {
    console.log(`対象日 ${target_date} の日誌は既に階層フォルダ内に存在するためスキップします。`);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let newContent = null;

  if (apiKey) {
    console.log('GEMINI_API_KEY を使用して現実的な未来ニュース日誌を生成中...');
    try {
      const prompt = `あなたは ${target_date} の世界を生きている人間です。
その日【 ${target_date} 】に実際にテレビやネットニュースで報道された、現実的で説得力のある技術進歩・社会ニュース（例: モバイル機器の薄型軽量化、行政手続きAIの効率化、ウェアラブル健康モニタリングの精度向上、曲げられるソーラーパネルの実装、急速充電規格の更新など）を、あたかも当たり前の事実として日記のテーマに組み込んで【 300字 〜 600字 】で書いてください。

【絶対ルール】
- 空飛ぶ車や常温超伝導などの現実離れした過度なSF要素は厳禁です。現在の技術の延長線上で『3ヶ月後に本当にありそう！』と思える現実的な進歩にしてください。
- 冒頭や本文中に日付（「${y}年${parseInt(m,10)}月${parseInt(d,10)}日」）を入れないでください。
- AIによる解説、箇条書き、まとめは不可。
- 以下のJSON形式のみを出力してください:
{
  "content": "300字〜600字の日記本文"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.content) {
            newContent = parsed.content;
          }
        }
      }
    } catch (e) {
      console.error('Gemini API呼び出しエラー:', e.message);
    }
  }

  if (!newContent) {
    newContent = `本日の報道によると、主要な音声AIアシスタントがバックグラウンドで飲食店のWEB予約や美容院の空き状況確認を代理完了する機能が国内で正式リリースされた。地味だが確実に生活が便利になっている。ニュースで取り上げられる技術や社会の進歩は、一見すると小さな変化の積み重ねのように見えて、数年単位で振り返ると確実に私たちの暮らしの当たり前を書き換えているのだと実感する。`;
  }

  newContent = newContent.replace(/^\d{4}年\d{1,2}月\d{1,2}日[。.\s]*/, '');

  const newEntry = {
    id,
    published_date,
    target_date,
    content: newContent
  };

  monthEntries.unshift(newEntry);

  const dirPath = path.join(baseDir, y);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(monthFilePath, JSON.stringify(monthEntries, null, 2), 'utf8');

  const indexPath = path.join(baseDir, 'index.json');
  let indexTree = {};
  if (fs.existsSync(indexPath)) {
    indexTree = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  if (!indexTree[y]) indexTree[y] = [];
  if (!indexTree[y].includes(m)) indexTree[y].push(m);
  fs.writeFileSync(indexPath, JSON.stringify(indexTree, null, 2), 'utf8');

  console.log(`[成功] 階層ファイル ${monthFilePath} に日誌を追加しました。`);
}

generateDiary().catch(console.error);
