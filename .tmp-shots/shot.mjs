import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:8125/";

const targets = process.argv.slice(2).map((a) => {
  const [w, lang = "en", h = "900"] = a.split(":");
  return { w: Number(w), h: Number(h), lang };
});

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
});

for (const t of targets) {
  const page = await browser.newPage();
  await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1, isMobile: t.w < 600, hasTouch: t.w < 600 });
  await page.goto(URL, { waitUntil: "networkidle2" });
  await page.evaluate((l) => {
    localStorage.setItem("nv-cookie-consent", "accepted");
    localStorage.setItem("nv-lang", l);
  }, t.lang);
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));
  const box = await page.evaluate(() => {
    const h = document.querySelector(".hero").getBoundingClientRect();
    const art = document.querySelector(".hero__art")?.getBoundingClientRect();
    return {
      clip: { x: 0, y: 0, width: Math.round(h.width), height: Math.min(Math.round(h.height), 1500) },
      art: art ? [Math.round(art.width), Math.round(art.height)] : null,
      scroll: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  await page.screenshot({ path: `.tmp-shots/hero-${t.w}-${t.lang}.png`, clip: box.clip });
  console.log(t.w, t.lang, "art", box.art && box.art.join("x"), "scroll", box.scroll.join("/"), "overflow", box.overflow);
  await page.close();
}

await browser.close();
