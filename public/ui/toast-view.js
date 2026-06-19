// Toast notification system — Neumorphism design
let toastContainer = null;

export function initToasts() {
  toastContainer = document.getElementById('toast-container');
}

export function showToast(message, type = 'info', duration = 3500) {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
  }

  const toast = document.createElement('div');
  toast.className = 'toast';

  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  const colorMap = {
    success: 'var(--success)',
    error: 'var(--error)',
    warning: 'var(--warning)',
    info: 'var(--primary)',
  };

  const icon = iconMap[type] || iconMap.info;
  const color = colorMap[type] || colorMap.info;

  toast.innerHTML = `
    <span class="toast-icon" style="color: ${color}; font-size: 16px">
      <i class="fas ${icon}"></i>
    </span>
    <span style="color: var(--text-primary); font-weight: 600; font-size: 13px">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
