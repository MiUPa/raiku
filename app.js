/**
 * 合同会社来Q — 日誌 アーカイブ (Directory Hierarchy Loader)
 */

let indexData = {}; // { "2026": ["10", "09", ...], ... }
let currentYear = '2026';
let currentMonth = '10';

document.addEventListener('DOMContentLoaded', async () => {
  await loadDirectoryIndex();
});

/**
 * data/diaries/index.json をロードしてナビゲーションを初期化
 */
async function loadDirectoryIndex() {
  try {
    const res = await fetch('./data/diaries/index.json');
    if (!res.ok) throw new Error('Index fetch failed');
    indexData = await res.json();

    const years = Object.keys(indexData).sort((a, b) => b - a); // 新しい順
    if (years.length === 0) return;

    currentYear = years[0]; // デフォルトは最新年 (2026)
    renderYearSelector(years);
    
    // デフォルトの月を選択
    selectYear(currentYear);
  } catch (err) {
    console.error('Failed to load index:', err);
    // フォールバック: 全体 diaries.json を試す
    loadFallbackDiaries();
  }
}

function renderYearSelector(years) {
  const container = document.getElementById('year-selector');
  if (!container) return;

  container.innerHTML = years.map(year => `
    <button class="year-btn ${year === currentYear ? 'active' : ''}" onclick="selectYear('${year}')">
      ${year}年
    </button>
  `).join('');
}

window.selectYear = function(year) {
  currentYear = year;
  
  // 年ボタンのアクティブ表示切替
  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.includes(year));
  });

  // 該当年の月リストを取得
  const months = (indexData[year] || []).sort((a, b) => b - a);
  currentMonth = months[0] || '01'; // 最新月
  
  renderMonthSelector(months);
  loadMonthDiaries(currentYear, currentMonth);
};

function renderMonthSelector(months) {
  const container = document.getElementById('month-selector');
  if (!container) return;

  container.innerHTML = months.map(m => `
    <button class="month-btn ${m === currentMonth ? 'active' : ''}" onclick="selectMonth('${m}')">
      ${parseInt(m, 10)}月
    </button>
  `).join('');
}

window.selectMonth = function(month) {
  currentMonth = month;
  
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText === `${parseInt(month, 10)}月`);
  });

  loadMonthDiaries(currentYear, currentMonth);
};

/**
 * 指定された data/diaries/YYYY/MM.json から日誌データをフェッチ
 */
async function loadMonthDiaries(year, month) {
  const feedEl = document.getElementById('diary-feed');
  if (!feedEl) return;

  feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 2rem;">${year}年${parseInt(month, 10)}月の日誌を読み込み中...</p>`;

  try {
    const res = await fetch(`./data/diaries/${year}/${month}.json`);
    if (!res.ok) throw new Error('Month file fetch failed');
    
    const entries = await res.json();
    entries.sort((a, b) => new Date(b.target_date) - new Date(a.target_date));

    if (entries.length === 0) {
      feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center;">この月の日誌はありません。</p>`;
      return;
    }

    feedEl.innerHTML = entries.map(item => `
      <article class="entry-card">
        <div class="entry-date">
          <span>${formatJapaneseDate(item.target_date)}</span>
        </div>
        <div class="entry-content">${escapeHtml(cleanContent(item.content))}</div>
      </article>
    `).join('');

  } catch (err) {
    console.error(`Failed to load ${year}/${month}:`, err);
    feedEl.innerHTML = `<p style="color: var(--text-dim); text-align: center;">日誌の読み込みに失敗しました。</p>`;
  }
}

/**
 * 本文の冒頭から「YYYY年M月D日。」のような重複する日付表記を除去
 */
function cleanContent(text) {
  if (!text) return '';
  return text.replace(/^\d{4}年\d{1,2}月\d{1,2}日[。.\s]*/, '');
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

async function loadFallbackDiaries() {
  const feedEl = document.getElementById('diary-feed');
  try {
    const res = await fetch('./data/diaries.json');
    const data = await res.json();
    feedEl.innerHTML = data.slice(0, 30).map(item => `
      <article class="entry-card">
        <div class="entry-date"><span>${formatJapaneseDate(item.target_date)}</span></div>
        <div class="entry-content">${escapeHtml(cleanContent(item.content))}</div>
      </article>
    `).join('');
  } catch (e) {
    feedEl.innerHTML = `<p style="color: var(--text-dim);">読み込みエラー</p>`;
  }
}
