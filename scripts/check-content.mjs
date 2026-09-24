#!/usr/bin/env node
/**
 * Content-integrity guard (AGENTS.md rule 4: never fabricate).
 *
 * Scans shipped source for claim patterns that were found unverifiable in the
 * Milestone 2 prototype (see docs/CLAUDE_HANDOFF.md §8.C). A hit means a metric,
 * deployment status, or guarantee has crept back in without a source in docs/CONTENT.md.
 * If a hit is legitimate and sourced, narrow the pattern here and note why.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/content', 'src/components', 'src/app'];
const EXTENSIONS = new Set(['.ts', '.tsx']);

const BANNED = [
  [/\bP99\b/i, 'latency percentile claim'],
  [/\b\d+(\.\d+)?\s?ms\b/i, 'millisecond latency figure'],
  [/\b60\s?FPS\b/i, 'hard-coded frame-rate claim'],
  [/\b100\s?%/i, 'absolute-percentage claim'],
  [/\b15\s?\+/i, 'unsourced project count'],
  [/authentic data/i, 'meta-claim tile'],
  [/\bdeployed\b/i, 'deployment status (none documented)'],
  [/zero (race|lab|errors?)/i, 'absolute-guarantee claim'],
  [/tamper/i, 'security guarantee claim'],
  [/verified (architecture|schema)/i, 'invented code presented as verified'],
  [/R3F SIMULATOR/i, 'false engine label'],
  [/\bSSL\s*\/\s*TLS\b/i, 'transport-security claim on a mailto form'],
  [/whatsapp/i, 'WhatsApp is not documented in CONTENT.md'],
  [/gaussian/i, 'algorithm name unconfirmed in CONTENT.md'],
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf('.')))) yield full;
  }
}

/** Removes comments so explanatory notes (which name banned terms) are not flagged. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

const findings = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, index) => {
      for (const [pattern, reason] of BANNED) {
        if (pattern.test(line)) {
          findings.push(`${relative('.', file)}:${index + 1}  [${reason}]  ${line.trim()}`);
        }
      }
    });
  }
}

if (findings.length > 0) {
  console.error(`Content-integrity check FAILED (${findings.length} finding${findings.length === 1 ? '' : 's'}):\n`);
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}
console.log('Content-integrity check passed: no banned claim patterns found in src/.');
