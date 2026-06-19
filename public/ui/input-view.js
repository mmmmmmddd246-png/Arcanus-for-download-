// ──────────────────────────────────────────────
// Input View — URL input, paste, platform detect
// Neumorphism design
// ──────────────────────────────────────────────

import { t } from '../i18n.js';

export function renderInputView(container, state, handlers) {
  const isDetecting = state.status === 'detecting';
  const hasUrl = state.url.length > 0;

  container.innerHTML = `
    <section class="px-4 py-10 sm:px-6 sm:py-14 animate-fadeIn">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="hero-title">
          <span>${t('app.hero_title')}</span><br>
          <span class="hero-highlight">${t('app.hero_highlight')}</span>
        </h2>
        <p class="mt-3 text-base" style="color: var(--text-secondary)">${t('app.subtitle')}</p>
      </div>

      <div class="mx-auto mt-8 max-w-2xl">
        <div class="neu-card">
          <!-- Input Field -->
          <div class="neu-input-wrap">
            <div class="flex items-center gap-2">
              <div class="neu-input-icon">
                <i class="fas fa-link"></i>
              </div>
              <input
                type="url"
                id="url-input"
                class="flex-1 min-w-0"
                style="background: transparent; padding: 12px; font-size: 15px; color: var(--text-primary); outline: none;"
                placeholder="${t('app.paste_placeholder')}"
                value="${escapeAttr(state.url)}"
                ${isDetecting ? 'disabled' : ''}
                autocomplete="off"
                spellcheck="false"
              >
              ${hasUrl ? `
                <button id="clear-btn" class="btn-clear-input" aria-label="${t('app.clear_input')}">
                  <i class="fas fa-xmark"></i>
                </button>
              ` : ''}
              <button id="paste-btn" class="btn-paste" ${isDetecting ? 'disabled' : ''}>
                <i class="fas fa-paste"></i>
                <span class="hidden sm:inline">${t('app.paste_button')}</span>
              </button>
            </div>
          </div>

          <!-- Platform Detection Badge -->
          ${state.platform ? `
            <div class="mt-4 flex items-center justify-center gap-2">
              <span class="platform-badge" style="background: var(--surface); box-shadow: var(--neu-raised-sm); color: ${state.platform.color}">
                <i class="${state.platform.icon}"></i>
                ${state.platform.name}
              </span>
              <span class="text-xs font-semibold" style="color: var(--success)">
                <i class="fas fa-check-circle mr-1"></i>${t('app.detected')}
              </span>
            </div>
          ` : ''}

          <!-- Detecting Loader -->
          ${isDetecting ? `
            <div class="mt-4 detecting-wrap">
              <i class="fas fa-spinner fa-spin-custom"></i>
              <span>${t('app.detecting')}</span>
            </div>
          ` : ''}

          <!-- Error Message -->
          ${state.status === 'error' && state.errorMessage ? `
            <div class="mt-4 error-box">
              <i class="fas fa-exclamation-circle"></i>
              <span>${escapeHtml(state.errorMessage)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;

  // Wire events
  const urlInput = document.getElementById('url-input');
  if (urlInput) {
    urlInput.addEventListener('input', handlers.onUrlInput);
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handlers.onDownload();
    });
    if (!state.url && !isDetecting) urlInput.focus();
  }

  const pasteBtn = document.getElementById('paste-btn');
  if (pasteBtn) pasteBtn.addEventListener('click', handlers.onPaste);

  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', handlers.onClear);
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
