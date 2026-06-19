// ──────────────────────────────────────────────
// Preview View — Video info, quality, progress, success
// Neumorphism design
// ──────────────────────────────────────────────

import { t } from '../i18n.js';

export function renderPreviewView(container, state, handlers) {
  if (!['detected', 'downloading', 'complete'].includes(state.status)) {
    container.innerHTML = '';
    return;
  }

  const isDownloading = state.status === 'downloading';
  const isComplete = state.status === 'complete';

  container.innerHTML = `
    <section class="px-4 pb-8 sm:px-6 animate-fadeIn">
      <div class="mx-auto max-w-2xl">
        <div class="neu-card">
          ${state.videoInfo ? renderVideoInfo(state.videoInfo) : ''}
          ${state.videoInfo?.qualities ? renderQualitySelector(state) : ''}
          ${isDownloading ? renderProgress(state) : ''}
          ${isComplete ? renderSuccess(state) : ''}
          ${renderActions(isDownloading, isComplete)}
        </div>
      </div>
    </section>
  `;

  // Wire events
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn && !isDownloading) {
    downloadBtn.addEventListener('click', handlers.onDownload);
  }

  const newBtn = document.getElementById('new-download-btn');
  if (newBtn) {
    newBtn.addEventListener('click', handlers.onClear);
  }

  document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => handlers.onSelectQuality(btn.dataset.quality));
  });
}

function renderVideoInfo(info) {
  return `
    <div class="flex gap-4 sm:gap-5">
      ${info.thumbnail ? `
        <div class="thumbnail-wrapper h-20 w-32 sm:h-28 sm:w-44">
          <img src="${escapeAttr(info.thumbnail)}" alt="" class="h-full w-full object-cover" loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'thumbnail-placeholder h-full w-full\\'><i class=\\'fas fa-film text-2xl\\'></i></div>'">
        </div>
      ` : `
        <div class="thumbnail-wrapper thumbnail-placeholder h-20 w-32 sm:h-28 sm:w-44">
          <i class="fas fa-film text-2xl"></i>
        </div>
      `}
      <div class="min-w-0 flex-1">
        <h3 class="line-clamp-2 text-base font-bold sm:text-lg leading-snug" style="color: var(--text-primary)">${escapeHtml(info.title)}</h3>
        <div class="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs" style="color: var(--text-secondary)">
          ${info.uploader ? `
            <span class="flex items-center gap-1.5">
              <i class="fas fa-user text-[10px]" style="color: var(--text-tertiary)"></i>${escapeHtml(info.uploader)}
            </span>
          ` : ''}
          ${info.duration ? `
            <span class="flex items-center gap-1.5">
              <i class="fas fa-clock text-[10px]" style="color: var(--primary)"></i>${escapeHtml(info.duration)}
            </span>
          ` : ''}
          ${info.platform ? `
            <span class="flex items-center gap-1.5">
              <i class="fas fa-globe text-[10px]" style="color: var(--text-tertiary)"></i>${escapeHtml(info.platform)}
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderQualitySelector(state) {
  return `
    <div class="mt-7">
      <label class="text-[11px] font-bold uppercase tracking-[0.2em]" style="color: var(--text-secondary)">${t('app.select_quality')}</label>
      <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        ${state.videoInfo.qualities.map(q => `
          <button
            class="quality-btn ${state.selectedQuality === q.id ? 'active' : ''}"
            data-quality="${q.id}"
          >
            <div class="font-bold text-sm">${escapeHtml(q.label)}</div>
            <div class="mt-1 text-xs opacity-60">${escapeHtml(q.format.toUpperCase())}${q.size ? ' · ' + escapeHtml(q.size) : ''}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderProgress(state) {
  const pct = Math.round(state.progress || 0);
  return `
    <div class="mt-7">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-semibold flex items-center gap-2" style="color: var(--primary)">
          <i class="fas fa-spinner fa-spin-custom text-xs"></i>
          ${t('app.downloading')}
        </span>
        <div class="flex items-center gap-3">
          ${state.speed ? `<span class="font-mono text-xs font-medium" style="color: var(--success)">${escapeHtml(state.speed)}</span>` : ''}
          ${state.eta ? `<span class="font-mono text-xs font-medium" style="color: var(--warning)">ETA ${escapeHtml(state.eta)}</span>` : ''}
          <span class="font-mono text-sm font-bold" style="color: var(--text-primary)">${pct}%</span>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

function renderSuccess(state) {
  return `
    <div class="mt-7 success-banner animate-fadeIn">
      <div class="success-icon">
        <i class="fas fa-check"></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-bold text-base" style="color: var(--success)">${t('app.download_complete')}</p>
        ${state.filename ? `
          <p class="text-sm mt-1 truncate" style="color: var(--text-secondary)">${escapeHtml(state.filename)}</p>
        ` : ''}
      </div>
    </div>
  `;
}

function renderActions(isDownloading, isComplete) {
  return `
    <div class="mt-7 flex gap-3">
      <button
        id="download-btn"
        class="btn-primary flex-1 ${isComplete ? 'is-success' : ''}"
        ${isDownloading ? 'disabled' : ''}
      >
        ${isDownloading
          ? '<i class="fas fa-spinner fa-spin-custom mr-2"></i>' + t('app.downloading')
          : isComplete
            ? '<i class="fas fa-redo mr-2"></i>' + t('app.download_again')
            : '<i class="fas fa-download mr-2"></i>' + t('app.download')
        }
      </button>

      <button id="new-download-btn" class="btn-neu flex-shrink-0 px-5" aria-label="${t('app.new_download')}">
        <i class="fas fa-plus"></i>
      </button>
    </div>
  `;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
