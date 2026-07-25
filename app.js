/**
 * 合同会社来Q — 日誌
 */

document.addEventListener('DOMContentLoaded', async () => {
  const feedEl = document.getElementById('diary-feed');
  if (!feedEl) return;

  try {
    const res = await fetch('./data/diaries.json');
    if (!res.ok) throw new Error('Data fetch failed');
    
    const diaries = await res.json();
    
    // 日付順（新しい順）
    diaries.sort((a, b) => new Date(b.target_date) - new Date(a.target_date));

    if (diaries.length === 0) {
      feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center;">記録がありません。</p>`;
      return;
    }

    feedEl.innerHTML = diaries.map(item => `
      <article class="entry-card">
        <div class="entry-date">
          <span class="date-target">${formatJapaneseDate(item.target_date)}</span>
        </div>
        <div class="entry-content">${escapeHtml(item.content)}</div>
      </article>
    `).join('');

  } catch (err) {
    console.error('Failed to load diaries:', err);
    feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center;">読み込みに失敗しました。</p>`;
  }
});

function formatJapaneseDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
