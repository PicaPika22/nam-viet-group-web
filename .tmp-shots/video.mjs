import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.setRequestInterception(true);
page.on("request", (req) => {
  // Never actually hit YouTube from the test.
  if (/youtube|youtu\.be|ytimg|google/.test(req.url())) req.abort().catch(() => {});
  else req.continue().catch(() => {});
});
await page.goto("http://localhost:8125/", { waitUntil: "networkidle2" });
await page.evaluate(() => {
  localStorage.setItem("nv-cookie-consent", "accepted");
  localStorage.setItem("nv-lang", "vi");
});
await page.reload({ waitUntil: "networkidle2" });

const state = async (label) =>
  console.log(
    label,
    JSON.stringify(
      await page.evaluate(() => {
        const modal = document.getElementById("videoModal");
        const frame = document.getElementById("videoFrame");
        const active = document.activeElement;
        return {
          modalOpen: modal ? !modal.hidden : null,
          frameSrc: frame?.getAttribute("src") || null,
          frameTitle: frame?.title || null,
          mainInert: document.getElementById("main")?.hasAttribute("inert") ?? null,
          headerInert: document.getElementById("header")?.hasAttribute("inert") ?? null,
          focus: active ? `${active.tagName.toLowerCase()}#${active.id}.${active.className}` : null,
        };
      })
    )
  );

console.log("openerExists", await page.$("[data-video-open]") !== null);
await page.focus("[data-video-open]");
await state("before");
await page.click("[data-video-open]");
await new Promise((r) => setTimeout(r, 400));
await state("opened");
await page.keyboard.press("Tab");
await state("tab1");
await page.keyboard.press("Tab");
await state("tab2");
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 300));
await state("escaped");

await browser.close();
