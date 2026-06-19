const DEFAULT_ENDPOINT = '/api';

let apiEndpoint = DEFAULT_ENDPOINT;
let mockMode = false;

export function setApiEndpoint(endpoint) {
  apiEndpoint = endpoint;
}

export function getApiEndpoint() {
  return apiEndpoint;
}

export function setMockMode(enabled) {
  mockMode = enabled;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getInfo(url) {
  if (mockMode) {
    await delay(1500);
    return {
      title: 'Sample Video — Amazing Content Title Here',
      thumbnail: null,
      duration: '3:45',
      platform: 'YouTube',
      qualities: [
        { id: 'best', label: 'Best Quality', format: 'mp4', size: '~150 MB' },
        { id: '1080p', label: '1080p HD', format: 'mp4', size: '~120 MB' },
        { id: '720p', label: '720p', format: 'mp4', size: '~80 MB' },
        { id: '480p', label: '480p', format: 'mp4', size: '~50 MB' },
        { id: '360p', label: '360p', format: 'mp4', size: '~30 MB' },
        { id: 'audio', label: 'Audio Only', format: 'mp3', size: '~8 MB' },
      ],
    };
  }

  const response = await fetch(apiEndpoint + '/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get video info');
  }
  return response.json();
}

export async function downloadVideo(url, quality, onProgress) {
  if (mockMode) {
    // Simulate progress
    for (let p = 0; p <= 100; p += 10) {
      await delay(300);
      if (onProgress) onProgress({ percent: p, speed: '2.5 MiB/s', eta: `${Math.round((100 - p) / 10)}s` });
    }
    return {
      success: true,
      filename: 'video_download.mp4',
      downloadUrl: null,
    };
  }

  const response = await fetch(apiEndpoint + '/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Download failed');
  }

  const reader = response.body.getReader();
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
