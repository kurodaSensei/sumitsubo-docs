/**
 * The install commands, in one place because the landing and the install page
 * both print them and must not drift.
 *
 * `npx github:…` rather than `npx sumitsubo`: the package is not on npm yet
 * (`npm view sumitsubo version` is a 404 as of v0.6.0's release). The GitHub
 * form is verified to run and prints `sumitsubo 0.6.0 — install and maintain…`.
 *
 * ponytail: swap PRIMARY to `npx sumitsubo` after the first publish; nothing
 * else here changes. The reference page for /sumi:init already says the short
 * form, because it is vendored verbatim from the framework, so the two disagree
 * on the site until then — a visible inconsistency is better than a headline
 * command that 404s.
 */
export const INSTALL = {
  /** One command, inside the project. Needs Node 18+. */
  primary: 'npx github:kurodaSensei/sumitsubo',
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
  sandbox: 'npx github:kurodaSensei/sumitsubo --sandbox',
  /** Simulates a machine with no GitHub SSH keys. */
  noSsh: 'npx github:kurodaSensei/sumitsubo --sandbox --no-ssh',
  maintain: [
    ['doctor', 'npx github:kurodaSensei/sumitsubo doctor'],
    ['update', 'npx github:kurodaSensei/sumitsubo update'],
    ['uninstall', 'npx github:kurodaSensei/sumitsubo uninstall'],
  ] as const,
} as const
