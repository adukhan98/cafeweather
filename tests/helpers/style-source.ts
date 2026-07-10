import { readFileSync } from "node:fs";

const files = [
  "../../app/app.css",
  "../../app/styles/base.css",
  "../../app/styles/materials.css",
  "../../app/styles/motion.css",
  "../../app/styles/shell.css",
  "../../app/styles/home.css",
  "../../app/styles/catalogue.css",
  "../../app/styles/map.css",
  "../../app/styles/detail.css",
  "../../app/styles/roulette.css",
  "../../app/styles/community.css",
  "../../app/styles/legal.css",
];

export function readStyleSource() {
  return files
    .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
    .join("\n");
}
