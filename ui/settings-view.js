const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;

export function renderSettingsView(container, state, handlers) {
  container.innerHTML = `
    <div id="settings-modal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center ${state.showSettings ? '' : 'hidden'}" style="background: rgba(0,0,0,0.45); backdrop-filter: blur(8px)">
      <div class="modal-content mx-4 w-full max-w-md" style="background: var(--surface); box-shadow: var(--neu-raised-lg); border-radius: var(--radius-lg); padding: 28px;">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold flex items-center gap-2.5" style="color: var(--text-primary)">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl" style="background: var(--primary-soft); color: var(--primary)">
              <i class="fas fa-cog text-sm"></i>
            </span>
            ${t('app.settings')}
          </h2>
          <button id="close-settings-btn" class="icon-btn" style="width: 36px; height: 36px" aria-label="${t('app.cancel')}">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <div class="mt-7 space-y-5">
          <!-- Language -->
          <div>
            <label for="language-select" class="text-sm font-semibold flex items-center gap-2 mb-2" style="color: var(--text-secondary)">
              <i class="fas fa-globe text-xs" style="color: var(--primary)"></i>
              ${t('app.language')}
            </label>
            <select id="language-select" class="neu-select">
              <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
              <option value="ar" ${state.language === 'ar' ? 'selected' : ''}>العربية</option>
            </select>
          </div>

          <!-- Theme -->
          <div>
            <label class="text-sm font-semibold flex items-center gap-2 mb-2" style="color: var(--text-secondary)">
              <i class="fas fa-palette text-xs" style="color: var(--primary)"></i>
              ${t('app.theme')}
            </label>
            <div class="flex gap-3">
              <button id="theme-light-btn" class="btn-neu flex-1" style="${state.theme === 'light' ? 'color: var(--primary); box-shadow: var(--neu-inset); background: var(--primary-soft)' : ''}">
                <i class="fas fa-sun mr-2"></i>${t('app.theme_light')}
              </button>
              <button id="theme-dark-btn" class="btn-neu flex-1" style="${state.theme === 'dark' ? 'color: var(--primary); box-shadow: var(--neu-inset); background: var(--primary-soft)' : ''}">
                <i class="fas fa-moon mr-2"></i>${t('app.theme_dark')}
              </button>
            </div>
          </div>

          <!-- Info Box -->
          <div class="info-box">
            <div class="flex items-center gap-2.5 text-xs" style="color: var(--text-tertiary)">
              <i class="fas fa-info-circle" style="color: var(--primary)"></i>
              <span>${t('app.engine_info')}</span>
            </div>
          </div>
        </div>

        <div class="mt-7 flex gap-3">
          <button id="save-settings-btn" class="btn-primary flex-1">
            <i class="fas fa-check mr-2"></i>${t('app.save')}
          </button>
          <button id="cancel-settings-btn" class="btn-neu px-5">
            ${t('app.cancel')}
          </button>
        </div>
      </div>
    </div>
  `;

  // Wire events
  const closeBtn = document.getElementById('close-settings-btn');
  if (closeBtn) closeBtn.addEventListener('click', handlers.onCloseSettings);

  const cancelBtn = document.getElementById('cancel-settings-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', handlers.onCloseSettings);

  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) saveBtn.addEventListener('click', handlers.onSaveSettings);

  // Theme buttons
  const lightBtn = document.getElementById('theme-light-btn');
  if (lightBtn) lightBtn.addEventListener('click', () => handlers.onThemeChange('light'));

  const darkBtn = document.getElementById('theme-dark-btn');
  if (darkBtn) darkBtn.addEventListener('click', () => handlers.onThemeChange('dark'));

  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) handlers.onCloseSettings();
    });
  }
}
