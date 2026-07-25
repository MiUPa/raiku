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
  console.log(`[合同会社来Q - 未来日誌 Generator] 開始`);
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
    console.log('GEMINI_API_KEY を使用して日誌エントリを生成中...');
    try {
      const prompt = `あなたは ${target_date} の世界を生きている一人の人間です。
その日の出来事、ふと感じた違和感、あるいは日常の静かな1シーンについての個人的な日記・手記を【 300字 〜 600字 】のボリュームで書いてください。

【絶対ルール】
- 本文の冒頭や途中に「${y}年${parseInt(m,10)}月${parseInt(d,10)}日」などの日付を一切入れないでください。本文は純粋な日記文章のみにしてください。
- AIによる解説、箇条書き、まとめ、自己紹介などは一切書かないでください。
- 本当に個人が手帳やブログに残した生々しい日常、静けさ、ミステリアスな気配を文章にしてください。
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
    newContent = `雨が朝から降り続いている。近所のスーパーに行くと、セルフレジの端末が画面ごしに「今日は少し疲れていませんか」と抑揚のない声で語りかけてきた。軽く会釈だけして電子マネーで支払いを済ませる。外に出ると、秋の澄んだ空気の中にどこか焦げたような微かな匂いが混ざっていた。すれ違う通行人は誰もマスクを外さず、イヤホンに耳を傾けたまま足早に通り過ぎていく。あの匂いについて誰かに尋ねてみようかとも思われたが、わざわざ立ち止まる理由も見つからずそのままアパートに戻った。部屋のラジオからは静寂に近いノイズが流れている。夏が始まる直前に感じていたあの予感は、ゆっくりと形を変えながらこの街の日常に溶け込んでいるのかもしれる。`;
  }

  // 冒頭の日付表記を安全にトリム
  newContent = newContent.replace(/^\d{4}年\d{1,2}月\d{1,2}日[。.\s]*/, '');

  const newEntry = {
    id,
    published_date,
    target_date,
    content: newContent
  };

  monthEntries.unshift(newEntry);

  // フォルダが存在しない場合は作成
  const dirPath = path.join(baseDir, y);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(monthFilePath, JSON.stringify(monthEntries, null, 2), 'utf8');

  // index.json の更新
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
