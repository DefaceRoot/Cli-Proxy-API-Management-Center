/**
 * Red test: asserts that MainLayout exposes a dedicated usage/statistics
 * sidebar nav item with a route distinct from /logs, /quota, and /system,
 * and that the corresponding route is registered in MainRoutes.
 *
 * This test is expected to FAIL until the usage navigation feature is
 * implemented (see MON-3).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const mainLayoutSrc = readFileSync(
  join(projectRoot, 'src/components/layout/MainLayout.tsx'),
  'utf8',
);
const mainRoutesSrc = readFileSync(
  join(projectRoot, 'src/router/MainRoutes.tsx'),
  'utf8',
);

// ---------------------------------------------------------------------------
// 1. Extract the paths declared in the navItems array inside MainLayout.
//    We look for the `navItems = [` block and pull out `path:` string values.
// ---------------------------------------------------------------------------
const navItemsBlockMatch = mainLayoutSrc.match(
  /const navItems\s*=\s*\[([\s\S]*?)\];/,
);
if (!navItemsBlockMatch) {
  console.error('FAIL: could not locate navItems array in MainLayout.tsx');
  process.exit(1);
}

const navItemsBlock = navItemsBlockMatch[1];
const navItemPaths = [
  ...navItemsBlock.matchAll(/path:\s*['"`]([^'"`]+)['"`]/g),
].map((m) => m[1]);

// ---------------------------------------------------------------------------
// 2. Identify a dedicated usage / statistics nav item.
//    It must have a path that is NOT /logs, /quota, or /system and whose
//    label or path suggests usage/statistics semantics.
// ---------------------------------------------------------------------------
const excludedPaths = new Set(['/logs', '/quota', '/system', '/']);

const usagePaths = navItemPaths.filter(
  (p) =>
    !excludedPaths.has(p) &&
    /usage|statistic/i.test(p),
);

if (usagePaths.length === 0) {
  console.error(
    'FAIL: no dedicated usage/statistics sidebar item found in MainLayout navItems.',
  );
  console.error(
    '  Current nav paths: ' + navItemPaths.join(', '),
  );
  console.error(
    '  Expected a path containing "usage" or "statistic" distinct from /logs, /quota, /system.',
  );
  process.exit(1);
}

const usagePath = usagePaths[0];

// ---------------------------------------------------------------------------
// 3. Verify that the route is registered in MainRoutes.
// ---------------------------------------------------------------------------
const routeRegistered = mainRoutesSrc.includes(`'${usagePath}'`) ||
  mainRoutesSrc.includes(`"${usagePath}"`) ||
  mainRoutesSrc.includes('`' + usagePath + '`');

if (!routeRegistered) {
  console.error(
    `FAIL: usage path "${usagePath}" found in sidebar but NOT registered in MainRoutes.`,
  );
  process.exit(1);
}

console.log(`PASS: usage/statistics nav item found at "${usagePath}" with a registered route.`);
