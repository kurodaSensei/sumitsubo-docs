/**
 * The install commands, in one place because the landing and the install page
 * both print them and must not drift.
 *
 * `npx sumitsubo` now that the package is published: `npm view sumitsubo
 * version` answers 0.6.1 and the command prints its own banner. This file
 * briefly pointed at the repository instead, while npm was still a 404 — which
 * is the argument for having it. Switching back was one line, in one place.
 */
export const INSTALL = {
  /** One command, inside the project. Needs Node 18+. */
  primary: 'npx sumitsubo',
  /** Inside Claude Code, no Node required. */
  claudeCode: [
    '/plugin marketplace add kurodaSensei/sumitsubo',
    '/plugin install sumi-design@sumitsubo',
    '/plugin install sumi-nuxt@sumitsubo',
  ],
  /** From a clone — the plugins load in place and `git pull` updates them. */
  clone: [
    'git clone https://github.com/kurodaSensei/sumitsubo.git',
    'claude plugin marketplace add ./sumitsubo',
    'claude plugin install sumi-design@sumitsubo',
  ],
  /** Throwaway profile via CLAUDE_CONFIG_DIR; the real configuration is untouched. */
  sandbox: 'npx sumitsubo --sandbox',
  /** Simulates a machine with no GitHub SSH keys. */
  noSsh: 'npx sumitsubo --sandbox --no-ssh',
  maintain: [
    ['doctor', 'npx sumitsubo doctor'],
    ['update', 'npx sumitsubo update'],
    ['uninstall', 'npx sumitsubo uninstall'],
  ] as const,
} as const
