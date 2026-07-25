/**
 * 合同会社来Q (RAIKU LLC) — Main Application JS
 */

let allPredictions = [];
let currentCategory = 'ALL';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  await loadPredictions();
  setupEventListeners();
});

/**
 * predictions.json データの読み込み
 */
async function loadPredictions() {
  try {
    const res = await fetch('./data/predictions.json');
    if (!res.ok) throw new Error('Data fetch failed');
    allPredictions = await res.json();
    
    // 日付順（新しい順）にソート
    allPredictions.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
    
    renderHero();
    renderGrid();
  } catch (err) {
    console.error('Failed to load predictions:', err);
    document.getElementById('predictions-grid').innerHTML = `
      <p style="color: var(--accent-pink);">予測データの読み込みに失敗しました。</p>
    `;
  }
}

/**
 * ヒーローセクション（最新予測）のレンダリング
 */
function renderHero() {
  const heroEl = document.getElementById('hero-prediction');
  if (!allPredictions || allPredictions.length === 0) return;

  const latest = allPredictions[0];

  heroEl.innerHTML = `
    <div class="hero-tag">
      <span>✨ 本日のGemini予測 (投稿日: ${latest.published_date})</span>
    </div>
    <h2 class="hero-title">${latest.title}</h2>
    
    <div class="hero-meta">
      <div class="meta-item">
        <span>予測対象日:</span>
        <span class="meta-highlight">${latest.target_date} (半年後)</span>
      </div>
      <div class="meta-item">
        <span>カテゴリー:</span>
        <span class="card-cat">${latest.category}</span>
      </div>
      <div class="meta-item">
        <span>AI確信度:</span>
        <span style="color: var(--accent-green); font-weight: 700;">${latest.confidence || '90%'}</span>
      </div>
    </div>

    <div class="hero-body">
      ${latest.content}
    </div>

    <div class="hero-extra">
      <div class="extra-block">
        <h4>観測された主な兆候 (Key Signals)</h4>
        <ul>
          ${(latest.key_signals || []).map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div class="extra-block">
        <h4>想定される社会的インパクト</h4>
        <p style="font-size: 0.9rem; color: var(--text-muted); padding-top: 4px;">
          ${latest.impact || '社会インフラと人々のライフスタイルに大きな変革をもたらす可能性があります。'}
        </p>
      </div>
    </div>
  `;
}

/**
 * カードグリッドのレンダリング
 */
function renderGrid() {
  const gridEl = document.getElementById('predictions-grid');
  
  // フィルター適用
  const filtered = allPredictions.filter(item => {
    const matchCat = (currentCategory === 'ALL' || item.category === currentCategory);
    const matchSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        条件に一致する予測記事が見つかりませんでした。
      </div>
    `;
    return;
  }

  gridEl.innerHTML = filtered.map(item => `
    <article class="card">
      <div>
        <div class="card-header">
          <span class="card-cat">${item.category}</span>
          <span class="card-target-date">対象: ${item.target_date}</span>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-summary">${item.summary}</p>
      </div>
      <div class="card-footer">
        <span class="confidence-badge">確信度 ${item.confidence || '88%'}</span>
        <button class="btn-detail" onclick="openModal('${item.id}')">詳細を読む ➔</button>
      </div>
    </article>
  `).join('');
}

/**
 * 詳細モーダルの表示
 */
window.openModal = function(id) {
  const item = allPredictions.find(p => p.id === id);
  if (!item) return;

  const modalEl = document.getElementById('detail-modal');
  const contentEl = document.getElementById('modal-content');

  contentEl.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <span class="card-cat">${item.category}</span>
      <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 10px;">投稿日: ${item.published_date}</span>
    </div>
    <h2 style="font-size: 1.6rem; color: #fff; margin-bottom: 1rem;">${item.title}</h2>
    <div style="background: rgba(0,240,255,0.05); padding: 12px; border-left: 3px solid var(--accent-cyan); margin-bottom: 1.5rem; border-radius: 4px;">
      <strong style="color: var(--accent-cyan);">半年後のターゲット日付: ${item.target_date}</strong> (確信度: ${item.confidence})
    </div>
    <div style="font-size: 1rem; line-height: 1.8; color: #d0dbe8; margin-bottom: 1.5rem;">
      ${item.content}
    </div>
    <div class="hero-extra" style="margin-top: 1rem;">
      <div class="extra-block">
        <h4>観測された主な兆候</h4>
        <ul>
          ${(item.key_signals || []).map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div class="extra-block">
        <h4>社会的インパクト</h4>
        <p style="font-size: 0.9rem; color: var(--text-muted);">${item.impact || '-'}</p>
      </div>
    </div>
  `;

  modalEl.classList.add('active');
}

function setupEventListeners() {
  // カテゴリボタン
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      renderGrid();
    });
  });

  // 検索入力
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderGrid();
    });
  }

  // モーダル閉じるボタン
  const closeBtn = document.getElementById('modal-close-btn');
  const modalEl = document.getElementById('detail-modal');
  if (closeBtn && modalEl) {
    closeBtn.addEventListener('click', () => {
      modalEl.classList.remove('active');
    });
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        modalEl.classList.remove('active');
      }
    });
  }
}
