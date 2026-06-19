# ⚡ Arcanus Video Downloader

Download videos from **YouTube, Instagram, TikTok, Facebook, Twitter, Vimeo, Reddit, Twitch, SoundCloud, Bilibili, Pinterest, Dailymotion, Snapchat** and 1000+ other sites.

## 🎯 Features

- ✅ **1000+ Supported Sites** — YouTube, Instagram, TikTok, Facebook, Twitter, and more
- ✅ **Real-Time Progress** — Live download progress with speed and ETA from yt-dlp
- ✅ **Multiple Qualities** — Best, 1080p, 720p, 480p, 360p, Audio Only
- ✅ **Smart Detection** — Auto-detects the platform from URL
- ✅ **Share Sheet Integration** — Share from any app → Arcanus downloads it!
- ✅ **Push Notifications** — Get notified when downloads complete or fail
- ✅ **Download History** — Track your downloads locally
- ✅ **Arabic + English** — Full bilingual UI with RTL support
- ✅ **Light & Dark Theme** — Neumorphism design with light/dark mode toggle
- ✅ **PWA Ready** — Install as app on any device
- ✅ **APK Ready** — Convert to Android APK with one command
- ✅ **Docker Ready** — One command deployment
- ✅ **Rate Limiting** — Built-in server protection
- ✅ **Concurrent Limits** — Max 5 simultaneous downloads

## 📸 How It Works

1. Open Instagram/YouTube/TikTok
2. Find a video you like
3. Tap **Share** → Select **Arcanus**
4. Download starts automatically! 🎉

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed globally
- [FFmpeg](https://ffmpeg.org/) (for merging video+audio)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/arcanus-download.git
cd arcanus-download

# Install dependencies
npm install

# Make sure yt-dlp is installed
pip install yt-dlp

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Docker

```bash
# Build
docker build -t arcanus .

# Run
docker run -p 3000:3000 arcanus
```

## 📱 Converting to Android APK

### Method 1: PWABuilder (Recommended — Easiest)

1. Deploy your app to a public URL (Vercel, Railway, Render, etc.)
2. Go to [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
3. Enter your app URL
4. Click **Package for stores**
5. Select **Android** → **Google Play**
6. Download the APK/AAB
7. Install on your device!

**PWABuilder automatically creates:**
- ✅ Android project with TWA (Trusted Web Activity)
- ✅ Share Intent filter (share sheet integration)
- ✅ Notification permissions
- ✅ Storage/download permissions
- ✅ Signed APK

### Method 2: Bubblewrap CLI

```bash
# Install Bubblewrap
npm install -g @nicolo-ribaudo/chokidar-3

# Create TWA project from your manifest
npx @nicolo-ribaudo/chokidar-3 init --manifest https://YOUR_APP_URL/manifest.json

# Build the APK
cd android
./gradlew assembleRelease

# APK output: android/app/build/outputs/apk/release/app-release.apk
```

### Method 3: Capacitor (Full Native Control)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init Arcanus com.arcanus.downloader --web-dir public

# Add Android platform
npm install @nicolo-ribaudo/chokidar-3
npx cap add android

# Copy web assets to Android project
npx cap copy android

# Open in Android Studio
npx cap open android
```

**In Android Studio, add to `AndroidManifest.xml`:**

```xml
<!-- Share Intent Filter -->
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
</intent-filter>

<!-- Storage Permission for Downloads -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Notification Permission (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Method 4: Deploy to Free Hosting First

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Railway:**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Deploy automatically!

**Render:**
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service → Connect repo
4. Build: `npm install && pip install yt-dlp`
5. Start: `node server.js`

Then use PWABuilder with your deployed URL to get the APK!

## 📁 Project Structure

```
arcanus-download/
├── server.js                 # Express backend with yt-dlp (real progress via SSE)
├── package.json              # Node.js dependencies
├── Dockerfile                # Docker deployment with health check
├── .gitignore
├── README.md
├── scripts/
│   └── generate-icons.js     # SVG icon generator
└── public/                   # Frontend (static files)
    ├── index.html            # Main HTML shell (SPA)
    ├── styles.css            # Neumorphism design system (light & dark themes)
    ├── main.js               # App entry point & state management
    ├── api.js                # API client with SSE real-time progress
    ├── platform-detector.js  # URL pattern matching for 13+ platforms
    ├── i18n.js               # Internationalization module
    ├── notifications.js      # Notification management module
    ├── sw.js                 # Service Worker (caching + notifications)
    ├── manifest.json         # PWA manifest with share_target
    ├── share-receiver.html   # Handles incoming shared URLs
    ├── locales/
    │   ├── en.json           # English translations
    │   └── ar.json           # Arabic translations
    ├── icons/                # PWA icons (SVG)
    │   ├── icon-72.svg
    │   ├── icon-96.svg
    │   ├── icon-128.svg
    │   ├── icon-144.svg
    │   ├── icon-152.svg
    │   ├── icon-192.svg
    │   ├── icon-384.svg
    │   └── icon-512.svg
    └── ui/                   # UI modules
        ├── input-view.js     # URL input & platform detection
        ├── preview-view.js   # Video info, quality, real progress
        ├── history-view.js   # Download history
        ├── settings-view.js  # Settings modal (language)
        └── toast-view.js     # Toast notifications
```

## 🔧 API Endpoints

| Method | Endpoint           | Description                           |
|--------|--------------------|---------------------------------------|
| POST   | `/api/info`        | Get video info & available formats    |
| POST   | `/api/download`    | Download video (SSE real-time progress) |
| POST   | `/api/formats`     | List all available formats            |
| GET    | `/api/health`      | Health check + active downloads       |
| GET    | `/share-receiver`  | Handle incoming shared URLs           |

### POST /api/info

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": "3:45",
  "uploader": "Channel Name",
  "platform": "YouTube",
  "qualities": [
    { "id": "best", "label": "Best Quality", "format": "mp4" },
    { "id": "1080p", "label": "1080p HD", "format": "mp4" },
    { "id": "720p", "label": "720p", "format": "mp4" }
  ]
}
```

### POST /api/download

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "1080p"
}
```

**Response:** SSE stream with real-time progress:
```
data: {"percent":45.2,"speed":"2.5MiB/s","eta":"00:32"}

data: {"percent":100,"complete":true,"filename":"Arcanus_123456.mp4","mimeType":"video/mp4","size":157286400,"downloadUrl":"/api/file/abc123..."}
```

## 🌍 Supported Platforms

| Platform    | Status |
|-------------|--------|
| YouTube     | ✅     |
| Instagram   | ✅     |
| TikTok      | ✅     |
| Facebook    | ✅     |
| X/Twitter   | ✅     |
| Vimeo       | ✅     |
| Reddit      | ✅     |
| Twitch      | ✅     |
| SoundCloud  | ✅     |
| Pinterest   | ✅     |
| Bilibili    | ✅     |
| Dailymotion | ✅     |
| Snapchat    | ✅     |
| + 1000 more via yt-dlp | ✅ |

## 🔔 Notifications

Arcanus supports browser notifications to alert you when:
- ✅ Download completes
- ✅ Download fails

**To enable:**
1. Click the bell icon (🔔) in the app header
2. Allow notifications when prompted
3. You'll receive alerts for all download events

## 📲 Share Sheet Integration (Android)

Once converted to APK, Arcanus appears in the Android share menu:

1. Open any app (Instagram, YouTube, TikTok, etc.)
2. Find a video
3. Tap **Share**
4. Select **Arcanus** from the share sheet
5. The app opens and starts downloading automatically!

**Technical Details:**
- Uses `share_target` in PWA manifest
- `/share-receiver` endpoint extracts the URL
- Redirects to main app with `?url=` parameter
- Auto-detects platform and starts download

## 🛠 Environment Variables

| Variable           | Default | Description                      |
|--------------------|---------|----------------------------------|
| `PORT`             | `3000`  | Server port                      |
| `MAX_CONCURRENT`   | `5`     | Max simultaneous downloads       |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Credits

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — The download engine
- [Express](https://expressjs.com/) — Web framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Font Awesome](https://fontawesome.com/) — Icons

---

**Made with ⚡ by Arcanus**
