/**
 * Fetch and parse one player, Ogniwo-filtered.
 *   npx tsx scripts/fetch-player.ts mariusz-bednarczyk
 *   npx tsx scripts/fetch-player.ts --fixture   (parse fixtures/mariusz-bednarczyk.json offline)
 */
import { readFileSync } from "node:fs";
import { getBuildId, fetchPlayerData } from "../lib/fls/client";
import { parsePlayer, filterOgniwo } from "../lib/fls/players";
import type { NextDataResponse } from "../lib/fls/resolver";

async function main() {
  const args = process.argv.slice(2);
  let data: NextDataResponse;

  if (args.includes("--fixture")) {
    data = JSON.parse(readFileSync("fixtures/mariusz-bednarczyk.json", "utf8"));
  } else {
    const slug = args[0] ?? "mariusz-bednarczyk";
    console.error(`Fetching ${slug}...`);
    const buildId = await getBuildId();
    data = await fetchPlayerData(buildId, slug);
  }

  const raw = parsePlayer(data);
  const ogniwo = filterOgniwo(raw);
  console.log(JSON.stringify(ogniwo, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
