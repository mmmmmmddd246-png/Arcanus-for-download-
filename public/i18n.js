// ══════════════════════════════════════
// i18n Module — lightweight localization
// ══════════════════════════════════════

const catalogs = {};
let currentLocale = 'en';

export async function loadLocale(locale) {
  if (catalogs[locale]) {
    currentLocale = locale;
    applyDirection(locale);
    localStorage.setItem('arcanus-locale', locale);
    return catalogs[locale];
  }
  try {
    const res = await fetch(`/locales/${locale}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    catalogs[locale] = await res.json();
    currentLocale = locale;
    applyDirection(locale);
    localStorage.setItem('arcanus-locale', locale);
    return catalogs[locale];
  } catch (err) {
    console.warn('[i18n] Failed to load locale:', locale, err);
    return null;
  }
}

export function t(key, values) {
  const keys = key.split('.');
  let result = catalogs[currentLocale];
  for (const k of keys) {
    if (result == null) return key;
    result = result[k];
  }
  if (typeof result !== 'string') return key;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      result = result.replace(`{${k}}`, v);
    }
  }
  return result;
}

export function getLocale() {
  return currentLocale;
}

export async function setLocale(locale) {
  if (locale === currentLocale) return;
  await loadLocale(locale);
}

export async function initI18n() {
  const saved = localStorage.getItem('arcanus-locale') || 'en';
  // Preload both locales
  await Promise.all([loadLocale('en'), loadLocale('ar')]);
  await loadLocale(saved);
}

function applyDirection(locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}
