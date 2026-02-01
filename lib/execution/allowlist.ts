/**
 * Execution allowlist for runner.
 * Only script names and allowed args listed here may be run from approved handoffs.
 * Prevents arbitrary shell commands from planner/ClawDBot output.
 */

/** npm script names the runner is allowed to invoke (e.g. from approved handoff). */
export const ALLOWED_SCRIPT_NAMES = new Set([
  'planner',
  'antigravity',
  'clawdbot',
  'clawdbot:fresh',
  'intel:validate:movies',
  'intel:movie-audit:status',
  'ingest:tmdb:telugu:status',
  'movies:coverage:status',
  'reviews:coverage:status',
]);

/** Args that are never allowed (e.g. --execute without --dry, destructive flags). */
const FORBIDDEN_ARG_PATTERNS = [
  /^--execute$/,
  /^--fix$/,
  /^--apply$/,
  /^--purge/,
  /^--reset$/,
  /^--full$/,
];

/**
 * Check if a script name is in the allowlist.
 */
export function isScriptAllowed(scriptName: string): boolean {
  return ALLOWED_SCRIPT_NAMES.has(scriptName);
}

/**
 * Check if args are safe (no forbidden patterns).
 */
export function areArgsAllowed(args: string[]): boolean {
  for (const arg of args) {
    for (const pattern of FORBIDDEN_ARG_PATTERNS) {
      if (pattern.test(arg)) return false;
    }
  }
  return true;
}

/**
 * Check if a run_script action is allowed.
 */
export function isRunScriptActionAllowed(scriptName: string, args: string[] = []): boolean {
  return isScriptAllowed(scriptName) && areArgsAllowed(args);
}

export interface RunScriptAction {
  type: 'run_script';
  script_name: string;
  args?: string[];
  reason?: string;
}

/**
 * Parse handoff actions and return only allowed run_script actions.
 */
export function getAllowedRunScriptActions(actions: unknown[]): RunScriptAction[] {
  const result: RunScriptAction[] = [];
  for (const a of actions) {
    if (typeof a !== 'object' || a === null) continue;
    const o = a as Record<string, unknown>;
    if (o.type !== 'run_script' || typeof o.script_name !== 'string') continue;
    const args = Array.isArray(o.args) ? (o.args as string[]) : [];
    if (isRunScriptActionAllowed(o.script_name, args)) {
      result.push({ type: 'run_script', script_name: o.script_name, args, reason: o.reason as string });
    }
  }
  return result;
}
