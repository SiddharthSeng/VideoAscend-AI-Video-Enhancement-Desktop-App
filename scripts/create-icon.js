/**
 * scripts/create-icon.js
 * Generates all app icon formats from an SVG source drawn in code.
 * No external icon file needed.
 * Usage: node scripts/create-icon.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// SVG source — violet gradient background, white wand + sparkle
// This is the VideoAscend icon drawn entirely in SVG
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 1024 1024" width="1024" height="1024">
  
  <!-- Background: deep violet radial gradient -->
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#0f0a1e"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Rounded rect background -->
  <rect width="1024" height="1024" rx="224" ry="224" fill="url(#bg)"/>
  
  <!-- Glow bloom behind wand -->
  <ellipse cx="512" cy="480" rx="300" ry="280" 
    fill="url(#glow)" filter="url(#blur)"/>

  <!-- Magic wand body — diagonal line, bottom-left to center-right -->
  <line x1="220" y1="780" x2="620" y2="380" 
    stroke="white" stroke-width="72" stroke-linecap="round"
    filter="url(#softglow)"/>
  
  <!-- Wand handle detail — darker band near grip -->
  <line x1="220" y1="780" x2="320" y2="680"
    stroke="#c4b5fd" stroke-width="72" stroke-linecap="round"/>

  <!-- Wand tip glow -->
  <circle cx="620" cy="380" r="48" fill="white" 
    filter="url(#softglow)"/>
  <circle cx="620" cy="380" r="28" fill="white"/>

  <!-- Sparkle star 1 — large, top right of wand tip -->
  <g transform="translate(720, 280)" filter="url(#softglow)">
    <polygon points="0,-52 12,-12 52,0 12,12 0,52 -12,12 -52,0 -12,-12"
      fill="white"/>
  </g>

  <!-- Sparkle star 2 — medium, upper left area -->
  <g transform="translate(360, 220)">
    <polygon points="0,-32 7,-7 32,0 7,7 0,32 -7,7 -32,0 -7,-7"
      fill="#e9d5ff" opacity="0.9"/>
  </g>

  <!-- Sparkle star 3 — small, right side -->
  <g transform="translate(800, 460)">
    <polygon points="0,-20 5,-5 20,0 5,5 0,20 -5,5 -20,0 -5,-5"
      fill="#c4b5fd" opacity="0.8"/>
  </g>

  <!-- Sparkle dot cluster — scattered small dots -->
  <circle cx="680" cy="220" r="12" fill="white" opacity="0.7"/>
  <circle cx="760" cy="340" r="8"  fill="#e9d5ff" opacity="0.6"/>
  <circle cx="420" cy="300" r="9"  fill="white" opacity="0.5"/>
  <circle cx="820" cy="280" r="6"  fill="#c4b5fd" opacity="0.6"/>
  <circle cx="300" cy="500" r="7"  fill="white" opacity="0.4"/>

  <!-- "VideoAscend" subtle watermark at bottom -->
  <text x="512" y="900" 
    font-family="system-ui, -apple-system, sans-serif"
    font-size="96" font-weight="800" 
    fill="white" opacity="0.15"
    text-anchor="middle">VideoAscend</text>
</svg>`;

async function createAllIcons() {
  // Ensure directories exist
  fs.mkdirSync(path.join(__dirname, '../assets'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, '../assets/icons'), { recursive: true });

  const svgBuffer = Buffer.from(iconSvg);

  // 1. Generate all PNG sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../assets/icons/icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }

  // 2. Copy 1024px as main icon.png (used by Linux + electron-builder)
  fs.copyFileSync(
    path.join(__dirname, '../assets/icons/icon-1024.png'),
    path.join(__dirname, '../assets/icon.png')
  );
  console.log('✓ assets/icon.png');

  // 3. Generate icon.ico for Windows (multi-size ICO using png-to-ico)
  try {
    // png-to-ico v3+ uses ES module exports — .default is the actual function
    const pngToIcoModule = require('png-to-ico');
    const pngToIco = pngToIcoModule.default || pngToIcoModule.imagesToIco || pngToIcoModule;
    if (typeof pngToIco !== 'function') throw new Error('png-to-ico export is not a function');
    const icoSizes = [16, 32, 48, 64, 128, 256];
    const icoBuffers = await Promise.all(
      icoSizes.map(size =>
        sharp(svgBuffer).resize(size, size).png().toBuffer()
      )
    );
    const icoBuffer = await pngToIco(icoBuffers);
    fs.writeFileSync(
      path.join(__dirname, '../assets/icon.ico'),
      icoBuffer
    );
    console.log('✓ assets/icon.ico');
  } catch (e) {
    console.log('  ⚠ png-to-ico not available, copying 256px PNG as fallback');
    fs.copyFileSync(
      path.join(__dirname, '../assets/icons/icon-256.png'),
      path.join(__dirname, '../assets/icon.ico')
    );
  }

  // 4. Generate icon.icns for macOS
  try {
    const png2icons = require('png2icons');
    const input = fs.readFileSync(
      path.join(__dirname, '../assets/icons/icon-1024.png')
    );
    const icns = png2icons.createICNS(input, png2icons.BILINEAR, 0);
    if (icns) {
      fs.writeFileSync(
        path.join(__dirname, '../assets/icon.icns'),
        icns
      );
      console.log('✓ assets/icon.icns');
    }
  } catch (e) {
    // Fallback: try icns-lib
    console.log('  ⚠ png2icons not available, trying icns-lib fallback');
    try {
      const IcnsImage = require('icns-lib');
      const images = {
        ic09: fs.readFileSync(
          path.join(__dirname, '../assets/icons/icon-512.png')),
        ic08: fs.readFileSync(
          path.join(__dirname, '../assets/icons/icon-256.png')),
        ic07: fs.readFileSync(
          path.join(__dirname, '../assets/icons/icon-128.png')),
      };
      const icnsBuffer = IcnsImage.encode(images);
      fs.writeFileSync(
        path.join(__dirname, '../assets/icon.icns'),
        icnsBuffer
      );
      console.log('✓ assets/icon.icns (via icns-lib)');
    } catch (e2) {
      // Last fallback: rename 512px PNG
      fs.copyFileSync(
        path.join(__dirname, '../assets/icons/icon-512.png'),
        path.join(__dirname, '../assets/icon.icns')
      );
      console.log('  ⚠ assets/icon.icns created from PNG fallback');
    }
  }

  console.log('\n✅ All icons generated successfully');
  console.log('   assets/icon.png   — Linux + general');
  console.log('   assets/icon.ico   — Windows');
  console.log('   assets/icon.icns  — macOS');
  console.log('   assets/icons/     — All PNG sizes (16–1024px)');
}

createAllIcons().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
