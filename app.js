/**
 * 合同会社来Q — 日誌 (2016.01.01 〜 2026.10.25 全3,951日分)
 */

let allDiaries = [];
let displayedCount = 0;
const PAGE_SIZE = 40;

document.addEventListener('DOMContentLoaded', async () => {
  const feedEl = document.getElementById('diary-feed');
  if (!feedEl) return;

  try {
    const res = await fetch('./data/diaries.json');
    if (!res.ok) throw new Error('Data fetch failed');
    
    allDiaries = await res.json();
    
    // 日付の降順（新しい順: 2026-10-25 -> 2016-01-01）
    allDiaries.sort((a, b) => new Date(b.target_date) - new Date(a.target_date));

    if (allDiaries.length === 0) {
      feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center;">記録がありません。</p>`;
      return;
    }

    feedEl.innerHTML = '';
    loadMoreEntries();
    setupInfiniteScroll();

  } catch (err) {
    console.error('Failed to load diaries:', err);
    feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center;">読み込みに失敗しました。</p>`;
  }
});

function loadMoreEntries() {
  const feedEl = document.getElementById('diary-feed');
  if (!feedEl) return;

  const nextChunk = allDiaries.slice(displayedCount, displayedCount + PAGE_SIZE);
  if (nextChunk.length === 0) return;

  const fragment = document.createDocumentFragment();

  nextChunk.forEach(item => {
    const article = document.createElement('article');
    article.className = 'entry-card';
    article.innerHTML = `
      <div class="entry-date">
        <span class="date-target">${formatJapaneseDate(item.target_date)}</span>
      </div>
      <div class="entry-content">${escapeHtml(item.content)}</div>
    `;
    fragment.appendChild(article);
  });

  feedEl.appendChild(fragment);
  displayedCount += nextChunk.length;
}

function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if (displayedCount >= allDiaries.length) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 800;

    if (scrollPosition >= threshold) {
      loadMoreEntries();
    }
  });
}

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
