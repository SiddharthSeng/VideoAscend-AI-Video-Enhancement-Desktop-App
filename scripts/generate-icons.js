/**
 * scripts/generate-icons.js
 * Generate all icon sizes from a source PNG.
 * Usage: node scripts/generate-icons.js
 * Requires: npm install sharp
 */
const path = require('path');
const fs   = require('fs');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp not found. Run: npm install sharp');
    process.exit(1);
  }

  const SOURCE   = path.join(__dirname, '../assets/icon-source.png');
  const ICON_DIR = path.join(__dirname, '../assets/icons');

  if (!fs.existsSync(SOURCE)) {
    console.error(`Source icon not found: ${SOURCE}`);
    console.log('Place a 1024×1024 PNG at assets/icon-source.png');
    process.exit(1);
  }

  fs.mkdirSync(ICON_DIR, { recursive: true });

  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  for (const size of sizes) {
    const outPath = path.join(ICON_DIR, `icon-${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`✓ icon-${size}.png`);
  }

  // Also copy the 256px as icon.png for Linux
  fs.copyFileSync(
    path.join(ICON_DIR, 'icon-256.png'),
    path.join(__dirname, '../assets/icon.png')
  );
  console.log('✓ assets/icon.png (256px copy)');

  console.log('\nNext steps:');
  console.log('→ macOS: iconutil -c icns icon.iconset  (from icons/)');
  console.log('→ Windows: magick convert icon-256.png icon-128.png icon-64.png icon-32.png icon-16.png icon.ico');
}

generateIcons().catch(console.error);
