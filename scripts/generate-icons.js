#!/usr/bin/env node
/**
 * Generates app icons for Electron Builder from an inline SVG.
 * Outputs:
 *   build/icon.png  — 512×512 (Linux + source)
 *   build/icon.ico  — multi-size ICO (16,24,32,48,64,128,256) for Windows
 *   build/icon.icns — placeholder PNG renamed (macOS, real .icns needs iconutil)
 *
 * Requires: sharp (already a transitive dep)
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "..", "build");
if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });

// ── App icon SVG ─────────────────────────────────────────────────────────────
// A clean shopping-cart + POS terminal icon on a deep indigo background

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="96" ry="96" fill="#1e1b4b"/>

  <!-- Subtle gradient overlay -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#312e81;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" ry="96" fill="url(#bg)"/>

  <!-- POS Screen -->
  <rect x="136" y="110" width="240" height="165" rx="12" fill="#4338ca" opacity="0.9"/>
  <rect x="148" y="122" width="216" height="141" rx="8" fill="#1e1b4b"/>

  <!-- Screen lines (receipt) -->
  <rect x="168" y="142" width="130" height="8" rx="4" fill="#6366f1" opacity="0.9"/>
  <rect x="168" y="160" width="90"  height="7" rx="3" fill="#818cf8" opacity="0.6"/>
  <rect x="168" y="175" width="110" height="7" rx="3" fill="#818cf8" opacity="0.6"/>
  <rect x="168" y="190" width="75"  height="7" rx="3" fill="#818cf8" opacity="0.6"/>
  <!-- Total line -->
  <rect x="168" y="212" width="175" height="10" rx="5" fill="#6366f1"/>
  <!-- Amount -->
  <rect x="280" y="212" width="63"  height="10" rx="5" fill="#a5b4fc"/>

  <!-- POS Stand -->
  <rect x="234" y="275" width="44" height="30" rx="0" fill="#4338ca"/>
  <rect x="196" y="305" width="120" height="12" rx="6" fill="#4338ca"/>

  <!-- Keypad -->
  <rect x="148" y="325" width="216" height="90" rx="10" fill="#312e81"/>
  <!-- Key rows -->
  <!-- Row 1 -->
  <rect x="162" y="338" width="44" height="22" rx="5" fill="#4338ca"/>
  <rect x="214" y="338" width="44" height="22" rx="5" fill="#4338ca"/>
  <rect x="266" y="338" width="44" height="22" rx="5" fill="#4338ca"/>
  <rect x="318" y="338" width="34" height="22" rx="5" fill="#6366f1"/>
  <!-- Row 2 -->
  <rect x="162" y="368" width="44" height="22" rx="5" fill="#4338ca"/>
  <rect x="214" y="368" width="44" height="22" rx="5" fill="#4338ca"/>
  <rect x="266" y="368" width="44" height="22" rx="5" fill="#4338ca"/>
  <rect x="318" y="368" width="34" height="38" rx="5" fill="#4f46e5"/>

  <!-- Glow dot top-right -->
  <circle cx="400" cy="112" r="18" fill="#6366f1" opacity="0.35"/>
  <circle cx="400" cy="112" r="9"  fill="#818cf8" opacity="0.8"/>
</svg>`;

async function main() {
  console.log("Generating app icons…");

  const svgBuf = Buffer.from(SVG);

  // ── 512×512 PNG (Linux + source) ──────────────────────────────────────────
  const png512 = await sharp(svgBuf).png().toBuffer();
  fs.writeFileSync(path.join(BUILD_DIR, "icon.png"), png512);
  console.log("  ✓ build/icon.png  (512×512)");

  // ── ICO — pack multiple sizes into a single .ico file ─────────────────────
  const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
  const icoImages = await Promise.all(
    ICO_SIZES.map((size) =>
      sharp(svgBuf).resize(size, size).png().toBuffer()
    )
  );

  const icoBuf = buildIco(icoImages, ICO_SIZES);
  fs.writeFileSync(path.join(BUILD_DIR, "icon.ico"), icoBuf);
  console.log("  ✓ build/icon.ico  (16/24/32/48/64/128/256)");

  // ── ICNS placeholder — electron-builder handles real conversion on macOS ──
  // Write the 512px PNG as icon.icns so the build doesn't fail on non-macOS.
  fs.writeFileSync(path.join(BUILD_DIR, "icon.icns"), png512);
  console.log("  ✓ build/icon.icns (placeholder PNG — real .icns built on macOS)");

  console.log("Icons generated successfully.");
}

// ── Minimal ICO writer ────────────────────────────────────────────────────────
// ICO format: ICONDIR header + ICONDIRENTRY per image + image data
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const HEADER_SIZE = 6;
  const ENTRY_SIZE = 16;
  const dataOffset = HEADER_SIZE + ENTRY_SIZE * count;

  let totalDataSize = 0;
  const offsets = [];
  for (const buf of pngBuffers) {
    offsets.push(dataOffset + totalDataSize);
    totalDataSize += buf.length;
  }

  const totalSize = dataOffset + totalDataSize;
  const out = Buffer.alloc(totalSize);

  // ICONDIR
  out.writeUInt16LE(0, 0);     // reserved
  out.writeUInt16LE(1, 2);     // type: 1 = ICO
  out.writeUInt16LE(count, 4); // count

  // ICONDIRENTRY per image
  for (let i = 0; i < count; i++) {
    const base = HEADER_SIZE + i * ENTRY_SIZE;
    const sz = sizes[i];
    out.writeUInt8(sz >= 256 ? 0 : sz, base + 0); // width  (0 = 256)
    out.writeUInt8(sz >= 256 ? 0 : sz, base + 1); // height (0 = 256)
    out.writeUInt8(0, base + 2);                   // palette size
    out.writeUInt8(0, base + 3);                   // reserved
    out.writeUInt16LE(1, base + 4);                // color planes
    out.writeUInt16LE(32, base + 6);               // bits per pixel
    out.writeUInt32LE(pngBuffers[i].length, base + 8);
    out.writeUInt32LE(offsets[i], base + 12);
  }

  // Image data
  let pos = dataOffset;
  for (const buf of pngBuffers) {
    buf.copy(out, pos);
    pos += buf.length;
  }

  return out;
}

main().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
