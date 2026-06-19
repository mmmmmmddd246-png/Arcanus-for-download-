// ══════════════════════════════════════
// Notifications Module v2
// Manages permission, local & push notifications
// ══════════════════════════════════════

let swRegistration = null;

// ── Register Service Worker ──
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[SW] Registered:', swRegistration.scope);
    return swRegistration;
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
    return null;
  }
}

// ── Request notification permission ──
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

// ── Check if notifications are supported and allowed ──
export function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// ── Show a local notification ──
export function showNotification(title, options = {}) {
  if (!canNotify()) return;

  const defaults = {
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-96.svg',
    vibrate: [200, 100, 200],
    tag: 'arcanus',
    renotify: true,
  };

  const config = { ...defaults, ...options };

  // Try Service Worker notification first (works in background)
  if (swRegistration && swRegistration.showNotification) {
    swRegistration.showNotification(title, config);
    return;
  }

  // Fallback to regular Notification API
  new Notification(title, config);
}

// ── Download complete notification ──
export function notifyComplete(filename) {
  showNotification('⚡ Download Complete!', {
    body: `${filename} has been downloaded successfully`,
    tag: 'arcanus-complete',
    icon: '/icons/icon-192.svg',
    vibrate: [300, 150, 300, 150, 300],
  });
}

// ── Download error notification ──
export function notifyError(message) {
  showNotification('❌ Download Failed', {
    body: message || 'Something went wrong. Please try again.',
    tag: 'arcanus-error',
    icon: '/icons/icon-192.svg',
    vibrate: [500],
  });
}

// ── Initialize: register SW + auto-request permission ──
export async function initNotifications() {
  await registerServiceWorker();

  // Auto-request permission after user interacts
  if ('Notification' in window && Notification.permission === 'default') {
    const ask = async () => {
      await requestNotificationPermission();
      document.removeEventListener('click', ask);
      document.removeEventListener('touchstart', ask);
    };
    document.addEventListener('click', ask, { once: false });
    document.addEventListener('touchstart', ask, { once: false });
  }
}
