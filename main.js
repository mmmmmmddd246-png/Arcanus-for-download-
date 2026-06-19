import { detectPlatform, isValidUrl, getAllPlatforms } from './platform-detector.js';
import { getInfo, downloadVideo, setApiEndpoint, getApiEndpoint } from './api.js';
import { showToast, initToasts } from './ui/toast-view.js';
import { renderInputView } from './ui/input-view.js';
import { renderPreviewView } from './ui/preview-view.js';
import { renderHistoryView } from './ui/history-view.js';
import { renderSettingsView } from './ui/settings-view.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;

const state = {
  url: '',
  platform: null,
  status: 'idle',
  videoInfo: null,
  selectedQuality: 'best',
  progress: 0,
  speed: '',
  eta: '',
  errorMessage: '',
  filename: '',
  downloadUrl: '',
  history: [],
  showSettings: false,
  language: 'en',
  theme: 'light',
};

const areas = {};

// ─── Theme ───────────────────────────────────────────

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#1E2328' : '#F0F3F8';

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }

  document.body.classList.add('theme-transitioning');
  setTimeout(() => document.body.classList.remove('theme-transitioning'), 500);
}

function toggleTheme() {
  const next = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  saveSettings();
}

// ─── Storage ─────────────────────────────────────────

function saveHistory() {
  try { localStorage.setItem('arcanus-history', JSON.stringify(state.history)); } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem('arcanus-history');
    if (raw) state.history = JSON.parse(raw);
  } catch {}
}

function saveSettings() {
  try {
    localStorage.setItem('arcanus-settings', JSON.stringify({
      language: state.language,
      theme: state.theme,
    }));
  } catch {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('arcanus-settings');
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.language) state.language = settings.language;
      if (settings.theme) state.theme = settings.theme;
    }
  } catch {}
}

// ─── Render ──────────────────────────────────────────

function renderAll() {
  renderInputView(areas.input, state, {
    onUrlInput: handleUrlInput,
    onPaste: handlePaste,
    onClear: handleClear,
    onDownload: handleDownload,
  });
  renderPreviewView(areas.preview, state, {
    onDownload: handleDownload,
    onClear: handleClear,
    onSelectQuality: handleSelectQuality,
  });
  renderHistoryView(areas.history, state, {
    onClearHistory: handleClearHistory,
  });
  renderSettingsView(areas.settings, state, {
    onCloseSettings: handleCloseSettings,
    onSaveSettings: handleSaveSettings,
    onThemeChange: handleThemeChange,
  });
}

function renderPlatforms() {
  const platforms = getAllPlatforms();
  const grid = document.getElementById('platforms-grid');
  if (!grid) return;
  grid.innerHTML = platforms.map(p => `
    <div class="platform-card">
      <i class="${p.icon}" style="color: ${p.color}"></i>
      <span>${p.name}</span>
    </div>
  `).join('');
}

// ─── Event Handlers ──────────────────────────────────

function handleUrlInput(e) {
  state.url = e.target.value.trim();
  state.platform = detectPlatform(state.url);
  state.errorMessage = '';

  if (!state.url) {
    state.status = 'idle';
    state.platform = null;
  }

  renderAll();
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      state.url = text.trim();
      state.platform = detectPlatform(state.url);
      state.status = 'idle';
      state.errorMessage = '';
      renderAll();
    }
  } catch {
    showToast(t('app.error_clipboard'), 'error');
  }
}

function handleClear() {
  state.url = '';
  state.platform = null;
  state.status = 'idle';
  state.videoInfo = null;
  state.selectedQuality = 'best';
  state.progress = 0;
  state.speed = '';
  state.eta = '';
  state.errorMessage = '';
  state.filename = '';
  state.downloadUrl = '';
  renderAll();
}

function handleSelectQuality(quality) {
  state.selectedQuality = quality;
  renderAll();
}

async function handleDownload() {
  if (!state.url) {
    showToast(t('app.error_empty_url') || t('app.error_invalid_url'), 'warning');
    return;
  }

  if (!isValidUrl(state.url)) {
    state.errorMessage = t('app.error_invalid_url');
    state.status = 'error';
    renderAll();
    return;
  }

  // Phase 1: Detect platform and get info
  state.status = 'detecting';
  state.platform = detectPlatform(state.url);
  renderAll();

  try {
    const info = await getInfo(state.url);
    state.videoInfo = info;
    state.status = 'detected';
    renderAll();
  } catch (err) {
    state.status = 'error';
    state.errorMessage = err.message || t('app.error_unsupported');
    renderAll();
    return;
  }

  // Phase 2: Start download with real progress
  state.status = 'downloading';
  state.progress = 0;
  state.speed = '';
  state.eta = '';
  renderAll();

  try {
    const result = await downloadVideo(state.url, state.selectedQuality, (progress) => {
      state.progress = progress.percent || 0;
      state.speed = progress.speed || '';
      state.eta = progress.eta || '';
      renderAll();
    });

    state.progress = 100;
    state.status = 'complete';
    state.filename = result.filename || 'video.mp4';
    state.downloadUrl = result.downloadUrl || '';

    // Download the file if URL available
    if (result.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.filename || 'video.mp4';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    // Add to history
    const qualityLabel = state.videoInfo?.qualities?.find(q => q.id === state.selectedQuality)?.label || state.selectedQuality;
    state.history.unshift({
      title: state.videoInfo?.title || state.url,
      url: state.url,
      quality: qualityLabel,
      platformIcon: state.platform?.icon || 'fas fa-video',
      platformColor: state.platform?.color || '#5B85F9',
      platformName: state.platform?.name || 'Unknown',
      date: new Date().toLocaleDateString(),
    });
    if (state.history.length > 30) state.history = state.history.slice(0, 30);
    saveHistory();

    showToast(t('app.download_complete'), 'success');
    renderAll();
  } catch (err) {
    state.status = 'error';
    state.errorMessage = err.message || t('app.error_download_failed');
    showToast(t('app.error_download_failed'), 'error');
    renderAll();
  }
}

function handleClearHistory() {
  state.history = [];
  saveHistory();
  showToast(t('app.history_cleared'), 'info');
  renderAll();
}

function handleCloseSettings() {
  state.showSettings = false;
  renderAll();
}

function handleThemeChange(theme) {
  applyTheme(theme);
  renderAll();
}

function handleSaveSettings() {
  const langSelect = document.getElementById('language-select');

  if (langSelect) {
    state.language = langSelect.value;
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    if (window.miniappI18n?.setLocale) {
      window.miniappI18n.setLocale(state.language);
    }
  }

  saveSettings();
  state.showSettings = false;
  showToast(t('app.settings_saved'), 'success');
  renderAll();
}

// ─── Bootstrap ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  areas.input = document.getElementById('input-area');
  areas.preview = document.getElementById('preview-area');
  areas.history = document.getElementById('history-area');
  areas.settings = document.getElementById('settings-area');

  initToasts();

  // Load persisted data
  loadHistory();
  loadSettings();

  // Apply saved theme
  applyTheme(state.theme);

  // Apply saved language direction
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      state.showSettings = !state.showSettings;
      renderAll();
    });
  }

  // Render platforms
  renderPlatforms();

  // Initial render
  renderAll();
});
