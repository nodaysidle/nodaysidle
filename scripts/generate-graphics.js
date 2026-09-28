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

  // 1. Dark Hero Banner SVG
  const darkHeroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 380" width="1200" height="380" fill="none">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080a0d"/>
      <stop offset="50%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#05070a"/>
    </linearGradient>

    <!-- Accent Radial Glow -->
    <radialGradient id="limeGlowDark" cx="15%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#c8ff00" stop-opacity="0.16"/>
      <stop offset="50%" stop-color="#c8ff00" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#c8ff00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cyanGlowDark" cx="85%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.12"/>
      <stop offset="60%" stop-color="#00e5ff" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
    </radialGradient>

    <!-- Card Backgrounds -->
    <linearGradient id="glassPillDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#161b22" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#21262d" stop-opacity="0.6"/>
    </linearGradient>

    <!-- Grid Pattern -->
    <pattern id="gridDark" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#30363d" stroke-width="0.75" stroke-opacity="0.25"/>
      <circle cx="0" cy="0" r="1" fill="#c8ff00" fill-opacity="0.3"/>
    </pattern>

    <filter id="shadowDark" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <style>
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .pulsing-dot {
      transform-origin: 916px 52px;
      animation: pulseDot 2.4s ease-in-out infinite;
    }
  </style>

  <!-- Base Canvas -->
  <rect width="1200" height="380" rx="16" fill="url(#bgGradDark)"/>
  <rect width="1200" height="380" rx="16" fill="url(#limeGlowDark)"/>
  <rect width="1200" height="380" rx="16" fill="url(#cyanGlowDark)"/>
  <rect width="1200" height="380" rx="16" fill="url(#gridDark)"/>
  <rect width="1200" height="380" rx="16" stroke="#30363d" stroke-width="1.5" fill="none"/>

  <!-- Top Status Bar -->
  <g transform="translate(48, 36)">
    <!-- Atelier Badge -->
    <rect x="0" y="0" width="220" height="32" rx="16" fill="url(#glassPillDark)" stroke="#30363d" stroke-width="1"/>
    <circle cx="16" cy="16" r="4" fill="#c8ff00"/>
    <text x="30" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="11.5" font-weight="700" fill="#c8ff00" letter-spacing="1.2">ATELIER // SYSTEM 01</text>

    <!-- Location & Target -->
    <text x="240" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="500" fill="#8b949e">
      <tspan fill="#6e7681">ENV:</tspan> macOS • Apple Silicon • Local-First
    </text>

    <!-- Status Indicator (Right aligned) -->
    <rect x="850" y="0" width="254" height="32" rx="16" fill="#161b22" stroke="#238636" stroke-width="1"/>
    <circle class="pulsing-dot" cx="868" cy="16" r="4.5" fill="#3fb950"/>
    <text x="882" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="11.5" font-weight="600" fill="#e6edf3" letter-spacing="0.5">${profile.status.toUpperCase()}</text>
  </g>

  <!-- Hero Typography -->
  <g transform="translate(48, 125)">
    <!-- Subtitle Kicker -->
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="13" font-weight="700" fill="#00e5ff" letter-spacing="3">INDEPENDENT SOFTWARE ATELIER</text>

    <!-- Brand Header -->
    <text x="0" y="64" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1.5">
      ${profile.name}
    </text>

    <!-- Accent bar -->
    <rect x="0" y="82" width="72" height="4" rx="2" fill="#c8ff00"/>
    <rect x="80" y="82" width="24" height="4" rx="2" fill="#00e5ff"/>

    <!-- Main Tagline -->
    <text x="0" y="126" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="22" font-weight="500" fill="#e6edf3" letter-spacing="-0.3">
      ${profile.tagline}
    </text>

    <!-- Secondary Manifesto -->
    <text x="0" y="156" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="14.5" font-weight="400" fill="#8b949e">
      Native macOS tooling • Local-first desktop runtimes • Spec-driven deterministic engineering
    </text>
  </g>

  <!-- Bottom Metric Pills -->
  <g transform="translate(48, 320)">
    <rect x="0" y="0" width="160" height="34" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="600" fill="#c8ff00">${stats.totalProjects} <tspan fill="#8b949e" font-weight="400">Repositories</tspan></text>

    <rect x="172" y="0" width="190" height="34" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="600" fill="#00e5ff" transform="translate(172, 0)">${stats.nativeMacApps} <tspan fill="#8b949e" font-weight="400">Native macOS Apps</tspan></text>

    <rect x="374" y="0" width="175" height="34" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="600" fill="#7ee787" transform="translate(374, 0)">Local-First <tspan fill="#8b949e" font-weight="400">By Default</tspan></text>

    <rect x="561" y="0" width="175" height="34" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="600" fill="#f0883e" transform="translate(561, 0)">Zero Cloud <tspan fill="#8b949e" font-weight="400">Lock-in</tspan></text>
  </g>
</svg>`;

  // 2. Light Hero Banner SVG
  const lightHeroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 380" width="1200" height="380" fill="none">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>

    <!-- Accent Radial Glow -->
    <radialGradient id="accentGlowLight" cx="15%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#16a34a" stop-opacity="0.08"/>
      <stop offset="50%" stop-color="#16a34a" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#16a34a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cyanGlowLight" cx="85%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.08"/>
      <stop offset="60%" stop-color="#0284c7" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </radialGradient>

    <!-- Grid Pattern -->
    <pattern id="gridLight" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#cbd5e1" stroke-width="0.75" stroke-opacity="0.45"/>
      <circle cx="0" cy="0" r="1.2" fill="#0284c7" fill-opacity="0.35"/>
    </pattern>
  </defs>

  <style>
    @keyframes pulseDotLight {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .pulsing-dot-light {
      transform-origin: 916px 52px;
      animation: pulseDotLight 2.4s ease-in-out infinite;
    }
  </style>

  <!-- Base Canvas -->
  <rect width="1200" height="380" rx="16" fill="url(#bgGradLight)"/>
  <rect width="1200" height="380" rx="16" fill="url(#accentGlowLight)"/>
  <rect width="1200" height="380" rx="16" fill="url(#cyanGlowLight)"/>
  <rect width="1200" height="380" rx="16" fill="url(#gridLight)"/>
  <rect width="1200" height="380" rx="16" stroke="#e2e8f0" stroke-width="1.5" fill="none"/>

  <!-- Top Status Bar -->
  <g transform="translate(48, 36)">
    <!-- Atelier Badge -->
    <rect x="0" y="0" width="220" height="32" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <circle cx="16" cy="16" r="4" fill="#16a34a"/>
    <text x="30" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="11.5" font-weight="700" fill="#15803d" letter-spacing="1.2">ATELIER // SYSTEM 01</text>

    <!-- Location & Target -->
    <text x="240" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="500" fill="#64748b">
      <tspan fill="#475569">ENV:</tspan> macOS • Apple Silicon • Local-First
    </text>

    <!-- Status Indicator (Right aligned) -->
    <rect x="850" y="0" width="254" height="32" rx="16" fill="#f8fafc" stroke="#86efac" stroke-width="1"/>
    <circle class="pulsing-dot-light" cx="868" cy="16" r="4.5" fill="#16a34a"/>
    <text x="882" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="11.5" font-weight="600" fill="#0f172a" letter-spacing="0.5">${profile.status.toUpperCase()}</text>
  </g>

  <!-- Hero Typography -->
  <g transform="translate(48, 125)">
    <!-- Subtitle Kicker -->
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="13" font-weight="700" fill="#0284c7" letter-spacing="3">INDEPENDENT SOFTWARE ATELIER</text>

    <!-- Brand Header -->
    <text x="0" y="64" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="64" font-weight="900" fill="#0f172a" letter-spacing="-1.5">
      ${profile.name}
    </text>

    <!-- Accent bar -->
    <rect x="0" y="82" width="72" height="4" rx="2" fill="#16a34a"/>
    <rect x="80" y="82" width="24" height="4" rx="2" fill="#0284c7"/>

    <!-- Main Tagline -->
    <text x="0" y="126" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" font-size="22" font-weight="600" fill="#1e293b" letter-spacing="-0.3">
      ${profile.tagline}
    </text>

    <!-- Secondary Manifesto -->
    <text x="0" y="156" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="14.5" font-weight="400" fill="#64748b">
      Native macOS tooling • Local-first desktop runtimes • Spec-driven deterministic engineering
    </text>
  </g>

  <!-- Bottom Metric Pills -->
  <g transform="translate(48, 320)">
    <rect x="0" y="0" width="160" height="34" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="700" fill="#15803d">${stats.totalProjects} <tspan fill="#64748b" font-weight="400">Repositories</tspan></text>

    <rect x="172" y="0" width="190" height="34" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="700" fill="#0284c7" transform="translate(172, 0)">${stats.nativeMacApps} <tspan fill="#64748b" font-weight="400">Native macOS Apps</tspan></text>

    <rect x="374" y="0" width="175" height="34" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="700" fill="#047857" transform="translate(374, 0)">Local-First <tspan fill="#64748b" font-weight="400">By Default</tspan></text>

    <rect x="561" y="0" width="175" height="34" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="700" fill="#c2410c" transform="translate(561, 0)">Zero Cloud <tspan fill="#64748b" font-weight="400">Lock-in</tspan></text>
  </g>
</svg>`;

  // 3. Stats Card Dark SVG
  const darkStatsCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 170" width="1200" height="170" fill="none">
  <defs>
    <linearGradient id="metricCardGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#161b22"/>
      <stop offset="100%" stop-color="#0d1117"/>
    </linearGradient>
  </defs>

  <!-- Metric 1 -->
  <g transform="translate(0, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradDark)" stroke="#30363d" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#c8ff00" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-1">${stats.totalProjects}</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#e6edf3">Repositories Shipped</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#8b949e">Autonomous, self-contained tools</text>
  </g>

  <!-- Metric 2 -->
  <g transform="translate(306, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradDark)" stroke="#30363d" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#00e5ff" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-1">${stats.nativeMacApps}</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#e6edf3">Native macOS Tools</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#8b949e">Swift 6, AppKit, Metal, Core ML</text>
  </g>

  <!-- Metric 3 -->
  <g transform="translate(612, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradDark)" stroke="#30363d" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#7ee787" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-1">100%</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#e6edf3">Local-First By Default</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#8b949e">On-device storage &amp; zero phone-home</text>
  </g>

  <!-- Metric 4 -->
  <g transform="translate(918, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradDark)" stroke="#30363d" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#f0883e" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-1">0</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#e6edf3">Demos or Waitlists</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#8b949e">Finished code with public releases</text>
  </g>
</svg>`;

  // 4. Stats Card Light SVG
  const lightStatsCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 170" width="1200" height="170" fill="none">
  <defs>
    <linearGradient id="metricCardGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>

  <!-- Metric 1 -->
  <g transform="translate(0, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradLight)" stroke="#cbd5e1" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#0f172a" letter-spacing="-1">${stats.totalProjects}</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#1e293b">Repositories Shipped</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#64748b">Autonomous, self-contained tools</text>
  </g>

  <!-- Metric 2 -->
  <g transform="translate(306, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradLight)" stroke="#cbd5e1" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#0f172a" letter-spacing="-1">${stats.nativeMacApps}</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#1e293b">Native macOS Tools</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#64748b">Swift 6, AppKit, Metal, Core ML</text>
  </g>

  <!-- Metric 3 -->
  <g transform="translate(612, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradLight)" stroke="#cbd5e1" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#0f172a" letter-spacing="-1">100%</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#1e293b">Local-First By Default</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#64748b">On-device storage &amp; zero phone-home</text>
  </g>

  <!-- Metric 4 -->
  <g transform="translate(918, 0)">
    <rect width="282" height="170" rx="14" fill="url(#metricCardGradLight)" stroke="#cbd5e1" stroke-width="1.2"/>
    <line x1="24" y1="20" x2="60" y2="20" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="76" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="44" font-weight="900" fill="#0f172a" letter-spacing="-1">0</text>
    <text x="24" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" font-size="14.5" font-weight="700" fill="#1e293b">Demos or Waitlists</text>
    <text x="24" y="136" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" font-size="12" font-weight="400" fill="#64748b">Finished code with public releases</text>
  </g>
</svg>`;

  // Write SVGs to assets/
  await fs.writeFile(path.join(assetsDir, 'hero-dark.svg'), darkHeroSvg, 'utf-8');
  await fs.writeFile(path.join(assetsDir, 'hero-light.svg'), lightHeroSvg, 'utf-8');
  await fs.writeFile(path.join(assetsDir, 'stats-card-dark.svg'), darkStatsCardSvg, 'utf-8');
  await fs.writeFile(path.join(assetsDir, 'stats-card-light.svg'), lightStatsCardSvg, 'utf-8');

  console.log('✓ Successfully generated dark/light SVG graphics in assets/');
}

main().catch((err) => {
  console.error('Error generating graphics:', err);
  process.exit(1);
});
