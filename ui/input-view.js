const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;

export function renderInputView(container, state, handlers) {
  const isDetecting = state.status === 'detecting';
  const hasUrl = state.url.length > 0;

  container.innerHTML = `
    <section class="px-4 py-10 sm:px-6 animate-fadeIn">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="hero-title">${t('app.hero_title')}</h2>
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
              <span>${state.errorMessage}</span>
            </div>
          ` : ''}

          <!-- Download Button (main action) -->
          ${!['detected', 'downloading', 'complete'].includes(state.status) ? `
            <button id="main-download-btn" class="btn-primary w-full mt-5" ${isDetecting ? 'disabled' : ''}>
              <i class="fas fa-download"></i>
              <span>${t('app.download')}</span>
            </button>
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

  const mainDownloadBtn = document.getElementById('main-download-btn');
  if (mainDownloadBtn) mainDownloadBtn.addEventListener('click', handlers.onDownload);
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
