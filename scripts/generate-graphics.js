import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  const dataPath = path.join(rootDir, 'data', 'profile.json');
  const rawData = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(rawData);

  const assetsDir = path.join(rootDir, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });

  const { profile, stats } = data;

  // 1. Dark Hero Banner SVG — SpaceX / x.ai Aerospace Aesthetic
  const darkHeroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 376" width="1200" height="376" fill="none">
  <defs>
    <linearGradient id="spaceXBgDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>

    <!-- Hairline Aerospace Grid Pattern -->
    <pattern id="spaceXGridDark" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#171717" stroke-width="0.8"/>
    </pattern>

    <style>
      @keyframes pulseDotDark {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(0.85); }
      }
      .pulsing-dot-dark {
        transform-origin: 932px 51px;
        animation: pulseDotDark 2.5s ease-in-out infinite;
      }
      .mono-txt {
        font-family: 'SF Mono', 'Geist Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
      }
      .sans-txt {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', 'Segoe UI', sans-serif;
      }
    </style>
  </defs>

  <!-- Base Canvas -->
  <rect width="1200" height="376" rx="6" fill="url(#spaceXBgDark)"/>
  <rect width="1200" height="376" rx="6" fill="url(#spaceXGridDark)"/>
  <rect width="1200" height="376" rx="6" stroke="#222222" stroke-width="1" fill="none"/>

  <!-- Technical Corner Marks (Left: 56px, Right: 1144px) -->
  <path d="M 50 42 L 50 32 L 60 32" stroke="#444444" stroke-width="1.2" fill="none"/>
  <path d="M 1150 42 L 1150 32 L 1140 32" stroke="#444444" stroke-width="1.2" fill="none"/>
  <path d="M 50 344 L 50 354 L 60 354" stroke="#444444" stroke-width="1.2" fill="none"/>
  <path d="M 1150 344 L 1150 354 L 1140 354" stroke="#444444" stroke-width="1.2" fill="none"/>

  <!-- Top Status Bar (x=56 to x=1144, width=1088) -->
  <!-- Left Pill (starts x=56, width=190) -->
  <rect x="56" y="36" width="190" height="30" rx="3" fill="#0d0d0d" stroke="#262626" stroke-width="1"/>
  <text class="mono-txt" x="72" y="55" font-size="11" font-weight="600" fill="#d4d4d4" letter-spacing="2">ATELIER // SYSTEM 01</text>

  <!-- Telemetry Spec Text (starts x=262) -->
  <text class="mono-txt" x="262" y="55" font-size="11" fill="#666666" letter-spacing="1.2">SPEC: APPLE SILICON • UNIX • LOCAL-FIRST</text>

  <!-- Right Pill (ends exactly at x=1144: x = 1144 - 230 = 914) -->
  <rect x="914" y="36" width="230" height="30" rx="3" fill="#0d0d0d" stroke="#262626" stroke-width="1"/>
  <circle class="pulsing-dot-dark" cx="932" cy="51" r="4" fill="#22c55e"/>
  <text class="mono-txt" x="946" y="55" font-size="10.5" font-weight="600" fill="#f5f5f5" letter-spacing="1">ACTIVE IN STUDIO // 2026</text>

  <!-- Main Hero Content (Left aligned exactly at x=56) -->
  <!-- Kicker -->
  <text class="mono-txt" x="56" y="122" font-size="11" font-weight="600" fill="#737373" letter-spacing="3.5">INDEPENDENT SYSTEMS ATELIER</text>

  <!-- Title -->
  <text class="sans-txt" x="56" y="180" font-size="62" font-weight="800" fill="#ffffff" letter-spacing="-0.8">
    ${profile.name}
  </text>

  <!-- Hairline Precision Divider (from x=56 to x=1144) -->
  <line x1="56" y1="202" x2="1144" y2="202" stroke="#1f1f1f" stroke-width="1"/>

  <!-- Tagline -->
  <text class="sans-txt" x="56" y="234" font-size="20" font-weight="500" fill="#e5e5e5" letter-spacing="-0.2">
    ${profile.tagline}
  </text>

  <!-- Subtitle -->
  <text class="sans-txt" x="56" y="260" font-size="13.5" font-weight="400" fill="#888888">
    Native macOS engineering • Local-first desktop runtimes • Spec-driven deterministic systems
  </text>

  <!-- Bottom 4 Telemetry Modules (x=56 to x=1144, width=1088, gaps=16, 4 cols of 260px) -->
  <!-- Module 1: x=56 -->
  <g transform="translate(56, 296)">
    <rect width="260" height="48" rx="3" fill="#0a0a0a" stroke="#1f1f1f" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#666666" letter-spacing="1.5">// 01 REPOSITORIES</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#ffffff" letter-spacing="0.4">${stats.totalProjects} SHIPPED TOOLS</text>
  </g>

  <!-- Module 2: x=332 -->
  <g transform="translate(332, 296)">
    <rect width="260" height="48" rx="3" fill="#0a0a0a" stroke="#1f1f1f" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#666666" letter-spacing="1.5">// 02 NATIVE PLATFORM</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#ffffff" letter-spacing="0.4">${stats.nativeMacApps} macOS APPS</text>
  </g>

  <!-- Module 3: x=608 -->
  <g transform="translate(608, 296)">
    <rect width="260" height="48" rx="3" fill="#0a0a0a" stroke="#1f1f1f" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#666666" letter-spacing="1.5">// 03 ARCHITECTURE</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#ffffff" letter-spacing="0.4">100% LOCAL-FIRST</text>
  </g>

  <!-- Module 4: x=884 (Ends at exactly 884 + 260 = 1144) -->
  <g transform="translate(884, 296)">
    <rect width="260" height="48" rx="3" fill="#0a0a0a" stroke="#1f1f1f" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#666666" letter-spacing="1.5">// 04 TELEMETRY</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#ffffff" letter-spacing="0.4">ZERO CLOUD LOCK-IN</text>
  </g>
</svg>`;

  // 2. Light Hero Banner SVG — Minimalist Clean Aerospace Lab
  const lightHeroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 376" width="1200" height="376" fill="none">
  <defs>
    <linearGradient id="spaceXBgLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f9fafb"/>
    </linearGradient>

    <!-- Hairline Grid Pattern -->
    <pattern id="spaceXGridLight" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#f0f0f0" stroke-width="0.8"/>
    </pattern>

    <style>
      @keyframes pulseDotLight {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(0.85); }
      }
      .pulsing-dot-light {
        transform-origin: 932px 51px;
        animation: pulseDotLight 2.5s ease-in-out infinite;
      }
      .mono-txt {
        font-family: 'SF Mono', 'Geist Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
      }
      .sans-txt {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', 'Segoe UI', sans-serif;
      }
    </style>
  </defs>

  <!-- Base Canvas -->
  <rect width="1200" height="376" rx="6" fill="url(#spaceXBgLight)"/>
  <rect width="1200" height="376" rx="6" fill="url(#spaceXGridLight)"/>
  <rect width="1200" height="376" rx="6" stroke="#e5e7eb" stroke-width="1" fill="none"/>

  <!-- Technical Corner Marks (Left: 56px, Right: 1144px) -->
  <path d="M 50 42 L 50 32 L 60 32" stroke="#9ca3af" stroke-width="1.2" fill="none"/>
  <path d="M 1150 42 L 1150 32 L 1140 32" stroke="#9ca3af" stroke-width="1.2" fill="none"/>
  <path d="M 50 344 L 50 354 L 60 354" stroke="#9ca3af" stroke-width="1.2" fill="none"/>
  <path d="M 1150 344 L 1150 354 L 1140 354" stroke="#9ca3af" stroke-width="1.2" fill="none"/>

  <!-- Top Status Bar (x=56 to x=1144, width=1088) -->
  <!-- Left Pill (starts x=56, width=190) -->
  <rect x="56" y="36" width="190" height="30" rx="3" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="1"/>
  <text class="mono-txt" x="72" y="55" font-size="11" font-weight="600" fill="#111827" letter-spacing="2">ATELIER // SYSTEM 01</text>

  <!-- Telemetry Spec Text (starts x=262) -->
  <text class="mono-txt" x="262" y="55" font-size="11" fill="#6b7280" letter-spacing="1.2">SPEC: APPLE SILICON • UNIX • LOCAL-FIRST</text>

  <!-- Right Pill (ends exactly at x=1144: x = 1144 - 230 = 914) -->
  <rect x="914" y="36" width="230" height="30" rx="3" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="1"/>
  <circle class="pulsing-dot-light" cx="932" cy="51" r="4" fill="#16a34a"/>
  <text class="mono-txt" x="946" y="55" font-size="10.5" font-weight="600" fill="#111827" letter-spacing="1">ACTIVE IN STUDIO // 2026</text>

  <!-- Main Hero Content (Left aligned exactly at x=56) -->
  <!-- Kicker -->
  <text class="mono-txt" x="56" y="122" font-size="11" font-weight="600" fill="#6b7280" letter-spacing="3.5">INDEPENDENT SYSTEMS ATELIER</text>

  <!-- Title -->
  <text class="sans-txt" x="56" y="180" font-size="62" font-weight="800" fill="#000000" letter-spacing="-0.8">
    ${profile.name}
  </text>

  <!-- Hairline Precision Divider (from x=56 to x=1144) -->
  <line x1="56" y1="202" x2="1144" y2="202" stroke="#e5e7eb" stroke-width="1"/>

  <!-- Tagline -->
  <text class="sans-txt" x="56" y="234" font-size="20" font-weight="500" fill="#111827" letter-spacing="-0.2">
    ${profile.tagline}
  </text>

  <!-- Subtitle -->
  <text class="sans-txt" x="56" y="260" font-size="13.5" font-weight="400" fill="#6b7280">
    Native macOS engineering • Local-first desktop runtimes • Spec-driven deterministic systems
  </text>

  <!-- Bottom 4 Telemetry Modules (x=56 to x=1144, width=1088, gaps=16, 4 cols of 260px) -->
  <!-- Module 1: x=56 -->
  <g transform="translate(56, 296)">
    <rect width="260" height="48" rx="3" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#6b7280" letter-spacing="1.5">// 01 REPOSITORIES</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#000000" letter-spacing="0.4">${stats.totalProjects} SHIPPED TOOLS</text>
  </g>

  <!-- Module 2: x=332 -->
  <g transform="translate(332, 296)">
    <rect width="260" height="48" rx="3" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#6b7280" letter-spacing="1.5">// 02 NATIVE PLATFORM</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#000000" letter-spacing="0.4">${stats.nativeMacApps} macOS APPS</text>
  </g>

  <!-- Module 3: x=608 -->
  <g transform="translate(608, 296)">
    <rect width="260" height="48" rx="3" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#6b7280" letter-spacing="1.5">// 03 ARCHITECTURE</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#000000" letter-spacing="0.4">100% LOCAL-FIRST</text>
  </g>

  <!-- Module 4: x=884 (Ends at exactly 884 + 260 = 1144) -->
  <g transform="translate(884, 296)">
    <rect width="260" height="48" rx="3" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="16" y="20" font-size="9.5" font-weight="600" fill="#6b7280" letter-spacing="1.5">// 04 TELEMETRY</text>
    <text class="sans-txt" x="16" y="38" font-size="13" font-weight="700" fill="#000000" letter-spacing="0.4">ZERO CLOUD LOCK-IN</text>
  </g>
</svg>`;

  // 3. Stats Card Dark SVG — 4 Telemetry Modules (1200 x 136)
  const darkStatsCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 136" width="1200" height="136" fill="none">
  <defs>
    <style>
      .mono-txt {
        font-family: 'SF Mono', 'Geist Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
      }
      .sans-txt {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', 'Segoe UI', sans-serif;
      }
    </style>
  </defs>

  <!-- Col 1: x=56 -->
  <g transform="translate(56, 12)">
    <rect width="260" height="112" rx="4" fill="#0a0a0a" stroke="#222222" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#737373" letter-spacing="1.5">METRIC // 01</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${stats.totalProjects}</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#a3a3a3">Repositories Shipped</text>
  </g>

  <!-- Col 2: x=332 -->
  <g transform="translate(332, 12)">
    <rect width="260" height="112" rx="4" fill="#0a0a0a" stroke="#222222" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#737373" letter-spacing="1.5">METRIC // 02</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${stats.nativeMacApps}</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#a3a3a3">Native macOS Apps</text>
  </g>

  <!-- Col 3: x=608 -->
  <g transform="translate(608, 12)">
    <rect width="260" height="112" rx="4" fill="#0a0a0a" stroke="#222222" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#737373" letter-spacing="1.5">METRIC // 03</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#ffffff" letter-spacing="-0.5">100%</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#a3a3a3">Local-First Storage</text>
  </g>

  <!-- Col 4: x=884 (Ends at 1144) -->
  <g transform="translate(884, 12)">
    <rect width="260" height="112" rx="4" fill="#0a0a0a" stroke="#222222" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#737373" letter-spacing="1.5">METRIC // 04</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#ffffff" letter-spacing="-0.5">0</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#a3a3a3">Cloud Lock-in / Telemetry</text>
  </g>
</svg>`;

  // 4. Stats Card Light SVG (1200 x 136)
  const lightStatsCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 136" width="1200" height="136" fill="none">
  <defs>
    <style>
      .mono-txt {
        font-family: 'SF Mono', 'Geist Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
      }
      .sans-txt {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', 'Segoe UI', sans-serif;
      }
    </style>
  </defs>

  <!-- Col 1: x=56 -->
  <g transform="translate(56, 12)">
    <rect width="260" height="112" rx="4" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#6b7280" letter-spacing="1.5">METRIC // 01</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#000000" letter-spacing="-0.5">${stats.totalProjects}</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#4b5563">Repositories Shipped</text>
  </g>

  <!-- Col 2: x=332 -->
  <g transform="translate(332, 12)">
    <rect width="260" height="112" rx="4" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#6b7280" letter-spacing="1.5">METRIC // 02</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#000000" letter-spacing="-0.5">${stats.nativeMacApps}</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#4b5563">Native macOS Apps</text>
  </g>

  <!-- Col 3: x=608 -->
  <g transform="translate(608, 12)">
    <rect width="260" height="112" rx="4" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#6b7280" letter-spacing="1.5">METRIC // 03</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#000000" letter-spacing="-0.5">100%</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#4b5563">Local-First Storage</text>
  </g>

  <!-- Col 4: x=884 (Ends at 1144) -->
  <g transform="translate(884, 12)">
    <rect width="260" height="112" rx="4" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <text class="mono-txt" x="20" y="28" font-size="10" font-weight="600" fill="#6b7280" letter-spacing="1.5">METRIC // 04</text>
    <text class="sans-txt" x="20" y="68" font-size="36" font-weight="800" fill="#000000" letter-spacing="-0.5">0</text>
    <text class="sans-txt" x="20" y="92" font-size="12" font-weight="500" fill="#4b5563">Cloud Lock-in / Telemetry</text>
  </g>
</svg>`;

  // Write SVGs to assets/
  await fs.writeFile(path.join(assetsDir, 'hero-dark.svg'), darkHeroSvg, 'utf-8');
  await fs.writeFile(path.join(assetsDir, 'hero-light.svg'), lightHeroSvg, 'utf-8');
  await fs.writeFile(path.join(assetsDir, 'stats-card-dark.svg'), darkStatsCardSvg, 'utf-8');
  await fs.writeFile(path.join(assetsDir, 'stats-card-light.svg'), lightStatsCardSvg, 'utf-8');

  console.log('✓ Successfully generated SpaceX/x.ai aligned SVG graphics in assets/');
}

main().catch((err) => {
  console.error('Error generating graphics:', err);
  process.exit(1);
});
