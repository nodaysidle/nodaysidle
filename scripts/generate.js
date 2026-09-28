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

> ⚙️ **Operational Thesis:** Software should respect the machine it executes on and the operator directing it. Native runtimes, local storage by default, zero telemetry, and rigorous deterministic execution.`;
}

function formatPrinciplesSection(principles) {
  let output = '<table width="100%">\n';
  for (let i = 0; i < principles.length; i += 2) {
    const left = principles[i];
    const right = principles[i + 1];

    output += '  <tr>\n';
    output += `    <td width="50%" valign="top">\n`;
    output += `      <code>// ${left.number}</code> <b>${left.title}</b><br/>\n`;
    output += `      <sub>${left.summary}</sub>\n`;
    output += `    </td>\n`;

    if (right) {
      output += `    <td width="50%" valign="top">\n`;
      output += `      <code>// ${right.number}</code> <b>${right.title}</b><br/>\n`;
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
    const starBadge = p.isStar
      ? `[![Star System](https://img.shields.io/badge/%E2%98%85_STAR_PROJECT-CASCADE_V3-000000?style=flat-square&labelColor=171717&color=262626)](${p.repo}) `
      : '';
    const releaseBadge = p.release
      ? `[![Release](https://img.shields.io/badge/Release-${encodeURIComponent(p.status)}-0a0a0a?style=flat-square&labelColor=171717&color=262626)](${p.release})`
      : `[![Status](https://img.shields.io/badge/Status-${encodeURIComponent(p.status)}-0a0a0a?style=flat-square&labelColor=171717&color=262626)](${p.repo})`;
    const categoryBadge = `[![Domain](https://img.shields.io/badge/Domain-${encodeURIComponent(p.category)}-0a0a0a?style=flat-square&labelColor=171717&color=262626)](${p.repo})`;
    const heading = p.isStar
      ? `### // ${num} • ★ [${p.name}](${p.repo})`
      : `### // ${num} • [${p.name}](${p.repo})`;

    return `${heading}
> **${p.tagline}**
> 
> ${starBadge}${categoryBadge} ${releaseBadge}

${p.description}

**Architecture & Systems Spec:**
${highlights}

**Stack:** ${tagsRow}

[**Inspect Source Repository →**](${p.repo}) &nbsp;|&nbsp; [**Download Release Artifacts →**](${p.release || p.repo})
`;
  }).join('\n---\n\n');
}

function formatStackSection(stack) {
  let output = '';
  for (const [domain, items] of Object.entries(stack)) {
    output += `#### ${domain.toUpperCase()}\n\n`;
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
      return `[![GitHub](https://img.shields.io/badge/GitHub-${profile.handle}-000000?style=for-the-badge&logo=github&logoColor=white)](${s.url})`;
    }
    if (s.name === 'Email') {
      return `[![Email](https://img.shields.io/badge/Direct_Channel-tutanota.de-171717?style=for-the-badge&logo=tutanota&logoColor=white)](${s.url})`;
    }
    return `[![Portfolio](https://img.shields.io/badge/Studio_Index-NODAYSIDLE-262626?style=for-the-badge&logo=safari&logoColor=white)](${s.url})`;
  }).join(' ');

  return `<div align="center">

${socialBadges}

<br/><br/>

<code>${profile.email}</code> • <code>${profile.location}</code> • <code>${profile.pgp}</code>

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
