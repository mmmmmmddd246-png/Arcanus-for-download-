import { detectPlatform, isValidUrl, getAllPlatforms } from './platform-detector.js';
import { getInfo, downloadVideo } from './api.js';
import { showToast, initToasts } from './ui/toast-view.js';
import { renderInputView } from './ui/input-view.js';
import { renderPreviewView } from './ui/preview-view.js';
import { renderHistoryView } from './ui/history-view.js';
import { renderSettingsView } from './ui/settings-view.js';
import { initNotifications, canNotify, requestNotificationPermission, notifyComplete, notifyError } from './notifications.js';
import { initI18n, t, getLocale, setLocale } from './i18n.js';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────
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
  notifGranted: false,
};

const areas = {};

// ──────────────────────────────────────────────
// Theme
// ──────────────────────────────────────────────
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  // Animate transition
  document.body.classList.add('theme-transitioning');
  setTimeout(() => document.body.classList.remove('theme-transitioning'), 500);

  // Update theme icon
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }

  // Update theme-color meta
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#1E2328' : '#F0F3F8';
}

function toggleTheme() {
  const next = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  saveSettings();
}

// ──────────────────────────────────────────────
// Storage
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Render All Views
// ──────────────────────────────────────────────
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

function renderStaticText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
}

// ──────────────────────────────────────────────
// Handle incoming shared URL
// ──────────────────────────────────────────────
function handleIncomingUrl() {
  const params = new URLSearchParams(window.location.search);
  const sharedUrl = params.get('url') || params.get('text') || '';

  if (sharedUrl) {
    const urlRegex = /https?:\/\/[^\s]+/i;
    const match = sharedUrl.match(urlRegex);
    const videoUrl = match ? match[0] : sharedUrl.trim();

    if (videoUrl && isValidUrl(videoUrl)) {
      state.url = videoUrl;
      state.platform = detectPlatform(videoUrl);
      renderAll();
      window.history.replaceState({}, '', '/');
      setTimeout(() => handleDownload(), 500);
      return true;
    }
  }
  return false;
}

// ──────────────────────────────────────────────
// Event Handlers
// ──────────────────────────────────────────────
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
    showToast(t('app.error_empty_url'), 'warning');
    return;
  }

  if (!isValidUrl(state.url)) {
    state.errorMessage = t('app.error_invalid_url');
    state.status = 'error';
    renderAll();
    return;
  }

  // Phase 1: Get video info
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

  // Phase 2: Download with real progress
  state.status = 'downloading';
  state.progress = 0;
  state.speed = '';
  state.eta = '';
  renderAll();

  try {
    const result = await downloadVideo(state.url, state.selectedQuality, (progressData) => {
      state.progress = progressData.percent;
      state.speed = progressData.speed;
      state.eta = progressData.eta;
      renderAll();
    });

    state.progress = 100;
    state.status = 'complete';
    state.filename = result.filename || 'video.mp4';
    state.downloadUrl = result.downloadUrl || '';

    if (result.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.filename || 'video.mp4';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

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

    notifyComplete(state.videoInfo?.title || state.filename);
    showToast(t('app.download_complete'), 'success');
    renderAll();
  } catch (err) {
    state.status = 'error';
    state.errorMessage = err.message || t('app.error_download_failed');
    notifyError(state.errorMessage);
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

async function handleSaveSettings() {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    state.language = langSelect.value;
    await setLocale(state.language);
  }
  saveSettings();
  state.showSettings = false;
  showToast(t('app.settings_saved'), 'success');
  renderAll();
  renderStaticText();
}

async function handleNotificationToggle() {
  if (canNotify()) {
    showToast(t('app.notif_already'), 'info');
    return;
  }
  const result = await requestNotificationPermission();
  state.notifGranted = result === 'granted';
  if (state.notifGranted) {
    showToast(t('app.notif_enabled'), 'success');
  } else {
    showToast(t('app.notif_blocked'), 'warning');
  }
  renderAll();
}

// ──────────────────────────────────────────────
// Bottom Navigation
// ──────────────────────────────────────────────
function setupBottomNav() {
  const navHome = document.getElementById('nav-home');
  const navDownloads = document.getElementById('nav-downloads');
  const navSettings = document.getElementById('nav-settings');

  if (navHome) navHome.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNav('nav-home');
  });

  if (navDownloads) navDownloads.addEventListener('click', () => {
    const historyArea = document.getElementById('history-area');
    if (historyArea) historyArea.scrollIntoView({ behavior: 'smooth' });
    setActiveNav('nav-downloads');
  });

  if (navSettings) navSettings.addEventListener('click', () => {
    state.showSettings = true;
    renderAll();
    setActiveNav('nav-settings');
  });
}

function setActiveNav(id) {
  document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ──────────────────────────────────────────────
// Bootstrap
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  areas.input = document.getElementById('input-area');
  areas.preview = document.getElementById('preview-area');
  areas.history = document.getElementById('history-area');
  areas.settings = document.getElementById('settings-area');

  initToasts();

  // Initialize i18n first
  await initI18n();
  loadSettings();

  // Apply saved language
  if (state.language !== 'en') {
    await setLocale(state.language);
  }

  // Apply saved theme
  applyTheme(state.theme);

  // Initialize notifications
  await initNotifications();
  state.notifGranted = canNotify();

  // Load persisted data
  loadHistory();

  // Apply language direction
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      state.showSettings = !state.showSettings;
      renderAll();
    });
  }

  // Bottom navigation
  setupBottomNav();

  renderPlatforms();
  renderStaticText();
  renderAll();

  // Check for incoming shared URL
  handleIncomingUrl();
});
