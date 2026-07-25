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
  console.log(`[合同会社来Q - 未来日記 Generator] 開始`);
  console.log(`本日: ${published_date} -> 3ヶ月後の対象日: ${target_date}`);

  let diaries = [];
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    diaries = JSON.parse(raw);
  }

  const existing = diaries.find(d => d.published_date === published_date);
  if (existing) {
    console.log(`本日の日記 (${published_date}) は既に存在するためスキップします。`);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let newContent = null;

  if (apiKey) {
    console.log('GEMINI_API_KEY を使用して3ヶ月後の日記を生成中...');
    try {
      const prompt = `あなたは ${target_date} （今から3ヶ月後）の世界に住んでいる一人の人間です。
その日の出来事、ふと感じた違和感、あるいは日常の静かな1シーンについての個人的な日記・独白を書いてください。

【絶対ルール】
- 生成AIで作った雰囲気（解説調、まとめ、です・ます調のプレゼン感、箇条書き、ポジティブすぎる未来都市の宣伝など）は絶対に排除してください。
- 本当に個人が手帳やSNSに書いたような、不穏さ、静けさ、ミステリアスな空気、日常のリアル感を持つ150〜300文字程度の文章にしてください。
- 以下のJSON形式のみを出力してください:
{
  "content": "日記の本文"
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
    const fallbacks = [
      "夕方、近所の川沿いを歩いていたら水面が妙に青く光っていた。すれ違った散歩中の老人に「綺麗ですね」と声をかけたら、怪訝な顔で首を振られた。僕にしか見えていなかったのだろうか。家に戻ると、部屋の温度が少しだけ下がっていた。",
      "コンビニの棚から、いつものお茶が全部消えていた。店員に尋ねると「先週から入荷していませんよ」と淡々と言われた。先週も買ったはずなのに、思い出せない。自分の記憶の方が怪しい気がしてきた。",
      "仕事帰りの電車の中、乗客のほとんどが目を閉じて静かに頷いていた。ヘッドホンをしているわけでもなさそうなのに。窓の外を流れる夜の街は、いつもより少し明るかった。"
    ];
    newContent = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  const newEntry = {
    id,
    published_date,
    target_date,
    content: newContent
  };

  diaries.unshift(newEntry);
  fs.writeFileSync(jsonPath, JSON.stringify(diaries, null, 2), 'utf8');
  console.log(`[成功] 日記エントリ (ID: ${id}) を更新しました。`);
}

generateDiary().catch(console.error);
