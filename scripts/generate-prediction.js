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
    console.log('GEMINI_API_KEY を使用して最新の未来ニュース日誌を生成中...');
    try {
      const prompt = `あなたは ${target_date} の世界を生きている人間です。
その日【 ${target_date} 】に実際にテレビやネットニュースで報道された具体的な出来事・技術革新・社会ニュース（例: 自動運転、医療技術、AI社会制度、宇宙開発など）を、あたかも当たり前の事実として日記のテーマに組み込んで【 300字 〜 600字 】で書いてください。

【絶対ルール】
- 冒頭や本文中に日付（「${y}年${parseInt(m,10)}月${parseInt(d,10)}日」）を入れないでください。
- あたかもその日に本当にそのニュースが報道されたかのような、リアルで具体的なリアリティを出してください。
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
    newContent = `本日のニュースで、全自動生成AI映画がカンヌ国際映画祭の最高賞を受賞したと知る。監督も脚本も俳優もすべて自律AIが手がけた作品であり、エンターテインメントの歴史が完全に塗り替わった記念すべき日となった。街を行き交う人々の表情や、手元に届く日々の報せを見つめていると、世界は静かに、しかし決定的な方向へと進んでいるのだと実感する。文字として書き残しておくことで、いつか答え合わせができる日が来るだろう。`;
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
