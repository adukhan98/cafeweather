import { readFileSync } from "node:fs";

const files = [
  "../../app/app.css",
  "../../app/styles/base.css",
  "../../app/styles/materials.css",
  "../../app/styles/motion.css",
  "../../app/styles/roulette.css",
];

export function readStyleSource() {
  return files
    .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
    .join("\n");
}
