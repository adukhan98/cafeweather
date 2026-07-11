import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const assetDirectory = resolve("build/client/assets");
const limitBytes = 250_000;
export function isExcludedMapChunk(name) {
  return name.includes("maplibre") || name.includes("CafeMap");
}

async function main() {

let entries;
try {
  entries = await readdir(assetDirectory, { withFileTypes: true });
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`Client budget failed: cannot read ${assetDirectory}: ${detail}`);
  process.exitCode = 1;
  return;
}

const javascriptFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

if (javascriptFiles.length === 0) {
  console.error(`Client budget failed: no JavaScript assets found in ${assetDirectory}`);
  process.exitCode = 1;
  return;
}

const measured = [];
for (const name of javascriptFiles) {
  const { size } = await stat(resolve(assetDirectory, name));
  measured.push({ name, size, excluded: isExcludedMapChunk(name) });
}

for (const asset of measured) {
  const suffix = asset.excluded ? " (map excluded)" : "";
  console.log(`${asset.name}: ${asset.size} bytes${suffix}`);
}

const failures = measured.filter(
  (asset) => !asset.excluded && asset.size > limitBytes,
);

if (failures.length > 0) {
  console.error(
    `Client budget failed: ${failures.length} non-map chunk(s) exceed ${limitBytes} bytes.`,
  );
  process.exitCode = 1;
  return;
}

console.log(
  `Client budget passed: ${measured.length} JavaScript assets checked; non-map chunks are at most ${limitBytes} bytes.`,
);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
