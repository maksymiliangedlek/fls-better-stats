/**
 * Run a full Ogniwo sync into the local filesystem cache (.cache/).
 * No Redis needed. Discovers the roster, caches every player profile, and the team page.
 *
 *   npx tsx scripts/sync-local.ts
 */
import { runFullSync } from "../lib/cache/sync";

async function main() {
  const started = Date.now();
  const { buildId, discovery } = await runFullSync((msg) => console.error(`  ${msg}`));
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log("\n─── Sync complete ───");
  console.log("buildId:        ", buildId);
  console.log("roster size:    ", discovery.rosterSize);
  console.log("combos:         ", discovery.combos);
  console.log("profiles cached:", discovery.profilesCached);
  console.log("elapsed:        ", `${secs}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
