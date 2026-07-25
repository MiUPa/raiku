import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../data/diaries.json');

// 本日の日付と3ヶ月後の日付を取得
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
  console.log(`[合同会社来Q - 未来日誌 Generator] 開始`);
  console.log(`本日: ${published_date} -> 対象日: ${target_date}`);

  let diaries = [];
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    diaries = JSON.parse(raw);
  }

  const existing = diaries.find(d => d.published_date === published_date);
  if (existing) {
    console.log(`本日の日誌 (${published_date}) は既に存在するためスキップします。`);
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
- 「（3ヶ月後）」やAIによる解説、箇条書き、まとめ、自己紹介などは一切書かないでください。
- 生成AIで作った雰囲気（〜と考えられます、〜が期待されます、AIのプレゼン風など）は完全に排除してください。
- 本当に個人が手帳やブログに残した生々しい日常、静けさ、ミステリアスな気配、時代の空気を描写してください。
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

  // フォールバック（APIキー未設定時）
  if (!newContent) {
    newContent = `${target_date}。雨が朝から降り続いている。近所のスーパーに行くと、セルフレジの端末が画面ごしに「今日は少し疲れていませんか」と抑揚のない声で語りかけてきた。軽く会釈だけして電子マネーで支払いを済ませる。外に出ると、秋の澄んだ空気の中にどこか焦げたような微かな匂いが混ざっていた。すれ違う通行人は誰もマスクを外さず、イヤホンに耳を傾けたまま足早に通り過ぎていく。あの匂いについて誰かに尋ねてみようかとも思われたが、わざわざ立ち止まる理由も見つからずそのままアパートに戻った。部屋のラジオからは静寂に近いノイズが流れている。夏が始まる直前に感じていたあの予感は、ゆっくりと形を変えながらこの街の日常に溶け込んでいるのかもしれない。`;
  }

  const newEntry = {
    id,
    published_date,
    target_date,
    content: newContent
  };

  diaries.unshift(newEntry);
  fs.writeFileSync(jsonPath, JSON.stringify(diaries, null, 2), 'utf8');
  console.log(`[成功] 日誌エントリ (ID: ${id}) を更新しました。`);
}

generateDiary().catch(console.error);
