#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function usage() {
  console.log(`Usage:
  node scripts/init-clone.mjs <slug> [--url <url>] [--mode <mode>] [--level <L1-L6>]

Creates:
  ~/projects/website-clones/<slug>-clone/
  ~/projects/website-clones/<slug>-clone/NOTES.md
  ~/projects/website-clones/<slug>-clone/RECON/screenshots/
`);
}

function parseArgs(argv) {
  const out = { slug: null, url: "", mode: "", level: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--url") out.url = argv[++i] || "";
    else if (arg === "--mode") out.mode = argv[++i] || "";
    else if (arg === "--level") out.level = argv[++i] || "";
    else if (arg === "--root") out.root = argv[++i] || "";
    else if (!out.slug) out.slug = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  return out;
}

function cleanSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function notesTemplate({ name, url, mode, level }) {
  return `# ${name} · Clone notes

## Source info
- Original URL: ${url}
- Source repo:
- Original author:
- License:
- Attribution requirements:

## Tech stack
- Framework / key libraries / Node version:

## Pre-clone assessment
- Complexity level: ${level}
- Recommended mode: ${mode}
- Parts achievable at high fidelity:
- Parts needing approximation or substitution:
- Parts NOT cloned:
- Main risks:

## Run it
\`\`\`bash
cd ~/projects/website-clones/${name}
python3 -m http.server 8123
\`\`\`

## What changed (vs original)
-

## Original vs clone
| Module | Original behavior | Clone implementation | Difference / tradeoff | Evidence |
|---|---|---|---|---|
| Hero |  |  |  |  |
| Navigation |  |  |  |  |
| Core motion |  |  |  |  |
| Content sections |  |  |  |  |
| Mobile |  |  |  |  |

## Clone scores
- Source evidence: /5
- Structure fidelity: /5
- Visual fidelity: /5
- Motion/interaction: /5
- Responsive: /5
- Functional completeness: /5
- Content replacement: /5
- Legal/deploy risk: /5
- Overall:

## Replacement map (what to change, where)
- Text -> file, line
- Images/media -> directory
- Colors -> CSS variables / theme
- 3D models / fonts ->

## Verification
- [ ] Runs locally, console 0 errors
- [ ] Screenshots compared against original (RECON/screenshots/)
- Points that could NOT be verified (record honestly, never fake):
`;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.slug) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const slug = cleanSlug(args.slug);
  if (!slug) throw new Error("Slug is empty after normalization.");
  const name = slug.endsWith("-clone") ? slug : `${slug}-clone`;
  const root = args.root
    ? path.resolve(args.root)
    : process.env.CLONE_HUB
      ? path.resolve(process.env.CLONE_HUB)
      : path.join(os.homedir(), "projects", "website-clones");
  const project = path.join(root, name);

  if (fs.existsSync(project)) {
    throw new Error(`Project already exists: ${project}`);
  }

  fs.mkdirSync(path.join(project, "RECON", "screenshots"), { recursive: true });
  fs.writeFileSync(
    path.join(project, "NOTES.md"),
    notesTemplate({
      name,
      url: args.url,
      mode: args.mode,
      level: args.level,
    })
  );
  fs.writeFileSync(path.join(project, ".gitignore"), "node_modules/\n.DS_Store\n");

  console.log(project);
} catch (error) {
  console.error(`init-clone failed: ${error.message}`);
  process.exit(1);
}
