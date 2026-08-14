// Copies the GSAP UMD builds we use as plain <script> tags (no bundler in this project)
// from node_modules into src/js/vendor, so Eleventy's passthrough copy picks them up.
const fs = require("fs");
const path = require("path");

const pairs = [
  ["gsap/dist/gsap.min.js", "gsap.min.js"],
  ["gsap/dist/ScrollTrigger.min.js", "ScrollTrigger.min.js"],
];

const vendorDir = path.join(__dirname, "..", "src", "js", "vendor");
fs.mkdirSync(vendorDir, { recursive: true });

for (const [from, to] of pairs) {
  const src = path.join(__dirname, "..", "node_modules", from);
  const dest = path.join(vendorDir, to);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${from} -> src/js/vendor/${to}`);
}
