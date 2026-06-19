const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;

export function renderHistoryView(container, state, handlers) {
  if (!state.history || state.history.length === 0) {
    container.innerHTML = `
      <section class="px-4 py-8 sm:px-6 animate-fadeIn">
        <div class="mx-auto max-w-2xl text-center">
          <h3 class="section-label">${t('app.history')}</h3>
          <div class="mt-5 flex flex-col items-center gap-4 py-10">
            <div class="empty-icon-wrap">
              <i class="fas fa-download"></i>
            </div>
            <div>
              <p class="text-sm" style="color: var(--text-tertiary)">${t('app.no_history')}</p>
              <p class="text-xs mt-1" style="color: var(--text-tertiary)">${t('app.no_history_hint')}</p>
            </div>
          </div>
        </div>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <section class="px-4 py-8 sm:px-6 animate-fadeIn">
      <div class="mx-auto max-w-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="section-label" style="text-align: left">
            ${t('app.history')}
            <span class="size-badge ml-2">${state.history.length}</span>
          </h3>
          <button id="clear-history-btn" class="text-xs font-semibold flex items-center gap-1.5" style="color: var(--error)">
            <i class="fas fa-trash-alt text-[10px]"></i>
            ${t('app.clear_history')}
          </button>
        </div>
        <div class="space-y-3">
          ${state.history.map((item, i) => `
            <div class="history-item animate-fadeIn" style="animation-delay: ${i * 40}ms">
              <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style="background: ${escapeAttr(item.platformColor)}15; box-shadow: var(--neu-raised-sm)">
                <i class="${escapeAttr(item.platformIcon)}" style="color: ${escapeAttr(item.platformColor)}"></i>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold" style="color: var(--text-primary)">${escapeHtml(item.title)}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs" style="color: var(--text-tertiary)">${escapeHtml(item.date)}</span>
                  ${item.platformName ? `
                    <span class="text-[10px]" style="color: var(--text-tertiary)">·</span>
                    <span class="text-xs" style="color: var(--text-tertiary)">${escapeHtml(item.platformName)}</span>
                  ` : ''}
                </div>
              </div>
              <span class="size-badge">${escapeHtml(item.quality)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', handlers.onClearHistory);
  }
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
