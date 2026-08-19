import { readFileSync } from "node:fs";

for (const file of [2, 3, 4, 6, 1]) {
  const s = readFileSync(`.tmp-shots/mockup/${file}.svg`, "utf8");
  const view = s.match(/viewBox="([^"]+)"/)?.[1];
  const paths = [...s.matchAll(/\sd="([^"]{80,})"/g)].map((m) => m[1]);
  console.log("\n==", file, "viewBox", view, "long-paths", paths.length);
  paths.slice(0, 3).forEach((p, i) => {
    console.log(i, "len", p.length, p.slice(0, 220));
  });
}
