const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || process.env.PORT || 3000;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '5', 10);

// ── Middleware ──
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));

// ── Simple rate limiter ──
const requestLog = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60000;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = requestLog.get(ip) || { count: 0, start: now };

  if (now - record.start > RATE_WINDOW) {
    record.count = 0;
    record.start = now;
  }

  record.count++;
  requestLog.set(ip, record);

  if (record.count > RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of requestLog) {
    if (now - rec.start > RATE_WINDOW * 2) requestLog.delete(ip);
  }
}, process.env.PORT || 300000);

// ── Active downloads tracking ──
let activeDownloads = 0;

// ── Downloads directory ──
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// ── File registry: maps fileId → { path, filename, mimeType, size, createdAt } ──
const fileRegistry = new Map();

function registerFile(filePath, filename, mimeType) {
  const fileId = crypto.randomBytes(16).toString('hex');
  const stat = fs.statSync(filePath);
  fileRegistry.set(fileId, {
    path: filePath,
    filename,
    mimeType,
    size: stat.size,
    createdAt: Date.now(),
  });
  return fileId;
}

// ── Platform Detection ──
function detectPlatform(url) {
  const platforms = [
    { id: 'youtube',     name: 'YouTube',     patterns: [/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts|youtube\.com\/embed/i] },
    { id: 'instagram',   name: 'Instagram',   patterns: [/instagram\.com\/(p|reel|stories|tv)\//i] },
    { id: 'tiktok',      name: 'TikTok',      patterns: [/tiktok\.com\/@/i] },
    { id: 'facebook',    name: 'Facebook',    patterns: [/facebook\.com|fb\.watch|fb\.com/i] },
    { id: 'twitter',     name: 'X / Twitter', patterns: [/(twitter\.com|x\.com)\/\w+\/status/i] },
    { id: 'vimeo',       name: 'Vimeo',       patterns: [/vimeo\.com\/\d+/i] },
    { id: 'dailymotion', name: 'Dailymotion', patterns: [/dailymotion\.com\/video/i] },
    { id: 'reddit',      name: 'Reddit',      patterns: [/reddit\.com\/r\/\w+\/comments/i] },
    { id: 'twitch',      name: 'Twitch',      patterns: [/twitch\.tv/i] },
    { id: 'soundcloud',  name: 'SoundCloud',  patterns: [/soundcloud\.com/i] },
    { id: 'pinterest',   name: 'Pinterest',   patterns: [/pinterest\.com\/pin/i] },
    { id: 'bilibili',    name: 'Bilibili',    patterns: [/bilibili\.com\/video/i] },
    { id: 'snapchat',    name: 'Snapchat',    patterns: [/snapchat\.com/i] },
  ];
  for (const p of platforms) {
    for (const pattern of p.patterns) {
      if (pattern.test(url)) return p;
    }
  }
  return { id: 'other', name: 'Other' };
}

// ── URL validation ──
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

// ── Run yt-dlp ──
function runYtDlp(args, timeoutMs = process.env.PORT || 300000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Operation timed out'));
    }, timeoutMs);

    proc.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });

    proc.on('error', err => {
      clearTimeout(timer);
      reject(new Error('yt-dlp is not installed. Install it: pip install yt-dlp'));
    });
  });
}

// ── Format duration helper ──
function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Cleanup old downloads and file registry (older than 30 min) ──
function cleanupDownloads() {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const now = Date.now();
    for (const file of files) {
      const fp = path.join(DOWNLOADS_DIR, file);
      try {
        const stat = fs.statSync(fp);
        if (now - stat.mtimeMs > 30 * 60 * 1000) {
          fs.unlinkSync(fp);
        }
      } catch {}
    }
  } catch {}

  // Clean file registry
  const now = Date.now();
  for (const [id, entry] of fileRegistry) {
    if (now - entry.createdAt > 30 * 60 * 1000) {
      fileRegistry.delete(id);
    }
  }
}
setInterval(cleanupDownloads, 10 * 60 * 1000);

// ══════════════════════════════════════
// ROUTES
// ══════════════════════════════════════

// ── GET /api/file/:fileId — Serve downloaded files by ID ──
app.get('/api/file/:fileId', (req, res) => {
  const entry = fileRegistry.get(req.params.fileId);
  if (!entry) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  if (!fs.existsSync(entry.path)) {
    fileRegistry.delete(req.params.fileId);
    return res.status(404).json({ error: 'File not found on disk' });
  }

  res.setHeader('Content-Type', entry.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${entry.filename}"`);
  res.setHeader('Content-Length', entry.size);
  res.setHeader('Cache-Control', 'no-store');

  const stream = fs.createReadStream(entry.path);
  stream.pipe(res);

  stream.on('end', () => {
    // Delete file after serving
    setTimeout(() => {
      try { fs.unlinkSync(entry.path); } catch {}
      fileRegistry.delete(req.params.fileId);
    }, 1000);
  });
});

// ── POST /api/info — Get video metadata ──
app.post('/api/info', rateLimit, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    const platform = detectPlatform(url);

    const raw = await runYtDlp([
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-playlist',
      url
    ]);

    const info = JSON.parse(raw);

    const formats = [];
    const seen = new Set();

    if (info.formats) {
      for (const f of info.formats) {
        if (!f.height || !f.vcodec || f.vcodec === 'none') continue;
        const label = f.height + 'p';
        if (seen.has(label)) continue;
        seen.add(label);
        formats.push({
          id: label,
          label: label + (f.height >= 1080 ? ' HD' : ''),
          format: 'mp4',
          size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(0)} MB` : null,
          height: f.height,
        });
      }
    }

    formats.sort((a, b) => b.height - a.height);
    formats.push({ id: 'audio', label: 'Audio Only', format: 'mp3', size: null, height: 0 });
    formats.unshift({ id: 'best', label: 'Best Quality', format: 'mp4', size: null, height: 99999 });

    res.json({
      title: info.title || 'Untitled Video',
      thumbnail: info.thumbnail || null,
      duration: info.duration_string || formatDuration(info.duration),
      uploader: info.uploader || info.channel || '',
      view_count: info.view_count || 0,
      platform: platform.name,
      platformId: platform.id,
      qualities: formats,
    });
  } catch (err) {
    console.error('[INFO ERROR]', err.message);
    res.status(500).json({ error: err.message || 'Failed to get video info' });
  }
});

// ── POST /api/download — Download with REAL SSE progress ──
app.post('/api/download', rateLimit, async (req, res) => {
  if (activeDownloads >= MAX_CONCURRENT) {
    return res.status(429).json({ error: 'Server is busy. Please try again in a moment.' });
  }

  activeDownloads++;

  try {
    const { url, quality } = req.body;
    if (!url || !isValidUrl(url)) {
      activeDownloads--;
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    const timestamp = Date.now();
    const randomId = crypto.randomBytes(6).toString('hex');
    const filename = `arcanus_${timestamp}_${randomId}`;

    let formatArg;
    if (quality === 'best') {
      formatArg = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    } else if (quality === 'audio') {
      formatArg = 'bestaudio/best';
    } else {
      const height = parseInt(quality);
      formatArg = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best`;
    }

    const outputTemplate = path.join(DOWNLOADS_DIR, `${filename}.%(ext)s`);

    const args = [
      '--format', formatArg,
      '--output', outputTemplate,
      '--merge-output-format', quality === 'audio' ? 'mp3' : 'mp4',
      '--no-warnings',
      '--no-playlist',
      '--newline',
      '--progress',
      '--progress-template', '%(progress._percent_str)s|||%(progress._speed_str)s|||%(progress._eta_str)s',
      url
    ];

    if (quality === 'audio') {
      args.push('--extract-audio', '--audio-format', 'mp3');
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const proc = spawn('yt-dlp', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let lastProgress = 0;

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const match = line.match(/(\d+\.?\d*)%\|\|\|([^\|]*)\|\|\|([^\|]*)/);
        if (match) {
          const percent = parseFloat(match[1]);
          const speed = match[2].trim();
          const eta = match[3].trim();
          if (percent > lastProgress) {
            lastProgress = percent;
            res.write(`data: ${JSON.stringify({ percent, speed, eta })}\n\n`);
          }
        }
      }
    });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      res.write(`data: ${JSON.stringify({ error: 'Download timed out. Try a lower quality.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      activeDownloads--;
    }, 600000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      activeDownloads--;

      if (code !== 0) {
        res.write(`data: ${JSON.stringify({ error: 'Download failed. Please try again.' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      try {
        const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(filename));
        if (files.length === 0) {
          res.write(`data: ${JSON.stringify({ error: 'Download completed but file not found' })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        const filePath = path.join(DOWNLOADS_DIR, files[0]);
        const ext = path.extname(files[0]);
        const downloadName = `Arcanus_${timestamp}${ext}`;
        const mimeType = quality === 'audio' ? 'audio/mpeg' : 'video/mp4';

        // Register file and get a download ID (NO base64!)
        const fileId = registerFile(filePath, downloadName, mimeType);
        const downloadUrl = `/api/file/${fileId}`;

        // Send completion with download URL
        res.write(`data: ${JSON.stringify({
          percent: 100,
          speed: '',
          eta: '',
          complete: true,
          filename: downloadName,
          mimeType,
          size: fileRegistry.get(fileId).size,
          downloadUrl,
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (err) {
        console.error('[FILE ERROR]', err.message);
        res.write(`data: ${JSON.stringify({ error: 'Failed to process downloaded file' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      activeDownloads--;
      res.write(`data: ${JSON.stringify({ error: 'yt-dlp is not installed. Install: pip install yt-dlp' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });

  } catch (err) {
    activeDownloads--;
    console.error('[DOWNLOAD ERROR]', err.message);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(500).json({ error: err.message || 'Download failed' });
    }
  }
});

// ── POST /api/formats — List formats ──
app.post('/api/formats', rateLimit, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const raw = await runYtDlp([
      '--list-formats', '--no-warnings', '--no-playlist', url
    ]);
    res.json({ formats: raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/health ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '4.0.0',
    engine: 'yt-dlp',
    activeDownloads,
    maxConcurrent: MAX_CONCURRENT,
    registeredFiles: fileRegistry.size,
  });
});

// ── GET /share-receiver ──
app.get('/share-receiver', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share-receiver.html'));
});

// ── Catch-all: SPA fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n  ╔═══════════════════════════════════════════════╗`);
  console.log(`  ║                                               ║`);
  console.log(`  ║   ⚡ Arcanus Video Downloader v3.0             ║`);
  console.log(`  ║   Running on http://localhost:${String(PORT).padEnd(5)}            ║`);
  console.log(`  ║   Max concurrent: ${String(MAX_CONCURRENT).padEnd(3)} downloads               ║`);
  console.log(`  ║   File transfer: streaming (no base64)        ║`);
  console.log(`  ║                                               ║`);
  console.log(`  ╚═══════════════════════════════════════════════╝\n`);
});
