const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon with Arcanus lightning bolt
function createIconSVG(size) {
  const cx = size / 2;
  const cy = size / 2;
  const pad = size * 0.15;
  const bs = size * 0.7;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e2e8f0"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.015}" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <g filter="url(#glow)">
    <polygon points="${cx - bs * 0.18},${pad + bs * 0.05} ${cx + bs * 0.12},${cy - bs * 0.08} ${cx - bs * 0.02},${cy - bs * 0.02} ${cx + bs * 0.18},${cy + bs * 0.35} ${cx - bs * 0.12},${cy + bs * 0.08} ${cx + bs * 0.02},${cy + bs * 0.02} ${cx - bs * 0.18},${pad + bs * 0.05}" fill="url(#bolt)" transform="translate(0, ${bs * 0.12})"/>
  </g>
</svg>`;
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('⚡ Generating Arcanus PWA icons...\n');

for (const size of sizes) {
  const svg = createIconSVG(size);
  const filePath = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`  ✓ icon-${size}.svg`);
}

// Also create a favicon
const faviconSvg = createIconSVG(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log('  ✓ favicon.svg');

console.log('\n✅ All icons generated successfully!');
console.log('\n📋 For APK conversion, SVG icons work in Chrome Android.');
console.log('   If you need PNG icons (for older Android), use:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - npm install sharp  (Node.js image processing)');
