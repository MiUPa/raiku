import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../data/predictions.json');

// 本日の日付と半年後（6ヶ月後）の日付を取得
function getDates() {
  const today = new Date();
  const target = new Date();
  target.setMonth(target.getMonth() + 6);

  const formatDate = (d) => d.toISOString().split('T')[0];

  return {
    published_date: formatDate(today),
    target_date: formatDate(target),
    id: `pred-${formatDate(today).replace(/-/g, '')}`
  };
}

async function generatePrediction() {
  const { published_date, target_date, id } = getDates();
  console.log(`[合同会社来Q - Gemini Generator] 生成開始`);
  console.log(`投稿日: ${published_date} -> 予想対象日: ${target_date}`);

  // 既に本日の記事が存在するかチェック
  let predictions = [];
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    predictions = JSON.parse(raw);
  }

  const existing = predictions.find(p => p.published_date === published_date);
  if (existing) {
    console.log(`本日の予測記事 (${published_date}) は既に生成済みです。スキップします。`);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let newPrediction = null;

  if (apiKey) {
    console.log('GEMINI_API_KEY が検出されました。Gemini API による予測生成を試みます...');
    try {
      const prompt = `あなたは「合同会社来Q（らいく）」の最高未来予測AIエンジン（Gemini 3.6）です。
本日の日付は ${published_date} です。ちょうど6ヶ月後の【 ${target_date} 】の世界で起きているテクノロジー、社会、文化、ライフスタイル、または科学的進歩に関するリアルな未来予測記事を作成してください。

以下のJSONフォーマットのみを出力してください（余計な解説は不要です）:
{
  "title": "驚きと説得力のある予測記事タイトル",
  "category": "テクノロジー または 科学・生活 または 社会・交通 または カルチャー",
  "summary": "100文字程度の要約",
  "content": "300文字程度の具体的でワクワクする予測ストーリー。現在の兆候からどう繋がっているか。",
  "confidence": "85%〜95%の確率表示",
  "key_signals": ["観測された兆候1", "観測された兆候2", "観測された兆候3"],
  "impact": "社会的・産業的インパクトの要約"
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
          newPrediction = {
            id,
            published_date,
            target_date,
            ...parsed
          };
          console.log('Gemini API による生成が正常に完了しました！');
        }
      } else {
        console.warn('APIリクエストに失敗したためフォールバック生成を行います。 Status:', res.status);
      }
    } catch (e) {
      console.error('Gemini API呼び出しエラー:', e.message);
    }
  }

  // フォールバック（APIキー未設定またはエラー時）
  if (!newPrediction) {
    console.log('シミュレーションエンジン（フォールバック）で記事を自動生成します...');
    const fallbackTopics = [
      {
        title: "完全自動翻訳イヤーピースの一般普及で『言語の壁』が完全解消へ",
        category: "テクノロジー",
        summary: "相手の言葉が遅延なく母国語の音声として聞こえるウェアラブルデバイスが標準化。",
        content: `${target_date}のグローバルビジネス現場では、通訳や外国語学習の概念が大きく変容しています。超低遅延音声翻訳AIチップを搭載した耳穴型デバイスが一般化し、異なる言語を話す人々がストレスなくネイティブスピードでディスカッションできるようになりました。`,
        confidence: "91%",
        key_signals: ["超小型NN処理チップの省電力化", "マルチリンガルリアルタイムモデルの精度99.2%到達", "クロスカルチャーリモートワークの増加"],
        impact: "海外旅行・国際取引の障壁が消失し、グローバル人材の流動性が一気に加速。"
      },
      {
        title: "自律型マイクログリッドと家庭用全固体電池による電力自給自足を達成する地域が急増",
        category: "科学・生活",
        summary: "地域ごとの太陽光＋次世代バッテリーシェアリングにより、電力会社の巨大送電網への依存度が大幅低下。",
        content: `${target_date}、持続可能な分散型エネルギーシステムが結実。各家庭のスマートバッテリーと地域の再生可能発電がAI制御で瞬時に融通し合い、災害時でも停電しない街づくりが全角で加速しています。`,
        confidence: "87%",
        key_signals: ["全固体電池の製造コスト半減", "P2P電力取引プラットフォームの規制緩和", "スマートグリッド向けエッジAIの導入増"],
        impact: "電気代の定額・低価格化と、都市全体のカーボンニュートラル早期達成。"
      }
    ];

    const template = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
    newPrediction = {
      id,
      published_date,
      target_date,
      ...template
    };
  }

  // predictions.json の先頭に追加して保存
  predictions.unshift(newPrediction);
  fs.writeFileSync(jsonPath, JSON.stringify(predictions, null, 2), 'utf8');
  console.log(`[成功] 新しい予測記事 (ID: ${id}) を ${jsonPath} に書き込みました。`);
}

generatePrediction().catch(console.error);
