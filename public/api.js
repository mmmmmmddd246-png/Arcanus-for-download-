// ──────────────────────────────────────────────
// API Client — talks to Express backend
// Real-time progress via SSE, streaming downloads
// ──────────────────────────────────────────────

const API_BASE = '/api';

export async function getInfo(url) {
  const res = await fetch(`${API_BASE}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get video info');
  }

  return res.json();
}

/**
 * Download video with real-time SSE progress.
 * Now receives a download URL instead of base64 data.
 */
export async function downloadVideo(url, quality, onProgress) {
  const res = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Download failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') break;

      try {
        const data = JSON.parse(payload);

        if (data.error) throw new Error(data.error);

        if (onProgress && data.percent != null) {
          onProgress({
            percent: data.percent,
            speed: data.speed || '',
            eta: data.eta || '',
          });
        }

        if (data.complete) {
          result = {
            success: true,
            filename: data.filename || 'arcanus_download.mp4',
            downloadUrl: data.downloadUrl || null,
            mimeType: data.mimeType || 'video/mp4',
            size: data.size || 0,
          };
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
  }

  if (!result) {
    throw new Error('Download completed but no file was received');
  }

  return result;
}
