import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function formatAboutSection(statement) {
  return `### ${statement.headline}

${statement.atelier}

${statement.craft}

> 💡 **Core Thesis:** Software should respect the machine it runs on and the person using it. Fast runtimes, local storage by default, zero telemetry, and rigorous execution.`;
}

function formatPrinciplesSection(principles) {
  let output = '<table width="100%">\n';
  for (let i = 0; i < principles.length; i += 2) {
    const left = principles[i];
    const right = principles[i + 1];

    output += '  <tr>\n';
    output += `    <td width="50%" valign="top">\n`;
    output += `      <b>${left.number}. ${left.title}</b><br/>\n`;
    output += `      <sub>${left.summary}</sub>\n`;
    output += `    </td>\n`;

    if (right) {
      output += `    <td width="50%" valign="top">\n`;
      output += `      <b>${right.number}. ${right.title}</b><br/>\n`;
      output += `      <sub>${right.summary}</sub>\n`;
      output += `    </td>\n`;
    } else {
      output += `    <td width="50%" valign="top"></td>\n`;
    }
    output += '  </tr>\n';
  }
  output += '</table>';
  return output;
}

function formatFeaturedProjects(projects) {
  return projects.map((p, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const tagsRow = p.tags.map(t => `\`${t}\``).join(' • ');
    const highlights = p.highlights.map(h => `  - ✦ ${h}`).join('\n');
    const releaseBadge = p.release
      ? `[![Release](https://img.shields.io/badge/Release-${encodeURIComponent(p.status)}-10b981?style=flat-square)](${p.release})`
      : `[![Status](https://img.shields.io/badge/Status-${encodeURIComponent(p.status)}-6366f1?style=flat-square)](${p.repo})`;
    const categoryBadge = `[![Category](https://img.shields.io/badge/Domain-${encodeURIComponent(p.category)}-0ea5e9?style=flat-square)](${p.repo})`;

    return `### ${num}. [${p.name}](${p.repo})
> **${p.tagline}**
> 
> ${categoryBadge} ${releaseBadge}

${p.description}

**Architecture & Highlights:**
${highlights}

**Stack:** ${tagsRow}

👉 [**Inspect Source Code →**](${p.repo}) &nbsp;|&nbsp; [**Download Release Artifacts →**](${p.release || p.repo})
`;
  }).join('\n---\n\n');
}

function formatStackSection(stack) {
  let output = '';
  for (const [domain, items] of Object.entries(stack)) {
    output += `#### ${domain}\n\n`;
    const badges = items.map(item => {
      return `![${item.name}](https://img.shields.io/badge/${item.badge})`;
    }).join(' ');
    output += `${badges}\n\n`;
  }
  return output.trim();
}

function formatConnectSection(profile, socials) {
  const socialBadges = socials.map(s => {
    if (s.name === 'GitHub') {
      return `[![GitHub](https://img.shields.io/badge/GitHub-${profile.handle}-181717?style=for-the-badge&logo=github&logoColor=white)](${s.url})`;
    }
    if (s.name === 'Email') {
      return `[![Email](https://img.shields.io/badge/Direct_Email-tutanota.de-EA4335?style=for-the-badge&logo=tutanota&logoColor=white)](${s.url})`;
    }
    return `[![Portfolio](https://img.shields.io/badge/Showcase_Catalogue-NODAYSIDLE-0ea5e9?style=for-the-badge&logo=safari&logoColor=white)](${s.url})`;
  }).join(' ');

  return `<div align="center">

${socialBadges}

<br/><br/>

\`${profile.email}\` • \`${profile.location}\` • \`${profile.pgp}\`

</div>`;
}

async function generate() {
  const dataPath = path.join(rootDir, 'data', 'profile.json');
  const templatePath = path.join(rootDir, 'templates', 'README.template.md');
  const readmePath = path.join(rootDir, 'README.md');

  const rawData = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(rawData);

  const template = await fs.readFile(templatePath, 'utf-8');

  // Format current UTC timestamp
  const now = new Date();
  const formattedDate = now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  // Update lastGenerated in profile.json
  data.meta.lastGenerated = now.toISOString();
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  // Interpolate template placeholders
  let result = template
    .replaceAll('{{PROFILE_NAME}}', data.profile.name)
    .replaceAll('{{PROFILE_TAGLINE}}', data.profile.tagline)
    .replaceAll('{{STATUS_LINE}}', data.profile.status)
    .replaceAll('{{ABOUT_SECTION}}', formatAboutSection(data.statement))
    .replaceAll('{{PRINCIPLES_SECTION}}', formatPrinciplesSection(data.principles))
    .replaceAll('{{FEATURED_PROJECTS_SECTION}}', formatFeaturedProjects(data.featuredProjects))
    .replaceAll('{{STACK_SECTION}}', formatStackSection(data.stack))
    .replaceAll('{{CONNECT_SECTION}}', formatConnectSection(data.profile, data.socials))
    .replaceAll('{{LAST_SYNCED}}', formattedDate);

  await fs.writeFile(readmePath, result, 'utf-8');
  console.log(`✓ Successfully compiled README.md (${result.length} bytes) at ${formattedDate}`);
}

// Watch mode support
if (process.argv.includes('--watch')) {
  console.log('Watching data/profile.json and templates/ for changes...');
  await generate();
  const watchFiles = [
    path.join(rootDir, 'data', 'profile.json'),
    path.join(rootDir, 'templates', 'README.template.md')
  ];
  for (const file of watchFiles) {
    fs.watch(file, async (eventType) => {
      if (eventType === 'change') {
        console.log(`File change detected in ${path.basename(file)}, regenerating...`);
        try {
          await generate();
        } catch (err) {
          console.error('Error during regeneration:', err);
        }
      }
    });
  }
} else {
  generate().catch((err) => {
    console.error('Generation failed:', err);
    process.exit(1);
  });
}
