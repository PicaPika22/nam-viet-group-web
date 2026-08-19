import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:8125/";
const OUT = ".tmp-shots";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
});

const viewports = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "1100", width: 1100, height: 900, mobile: false },
  { name: "820", width: 820, height: 1000, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];

const langs = ["en", "vi", "zh"];

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  await page.goto(URL, { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.setItem("nv-cookie-consent", "accepted"));

  for (const lang of langs) {
    await page.evaluate((l) => localStorage.setItem("nv-lang", l), lang);
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 900));

    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowing = [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1);
        })
        .slice(0, 6)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className.toString().split(" ")[0]}`);
      const hero = document.querySelector(".hero");
      const title = document.querySelector(".hero__title");
      const leaf = document.querySelector(".hero__leaf");
      const facts = document.querySelectorAll(".hero__fact").length;
      const rect = (el) => (el ? [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)] : null);
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        overflowing,
        heroH: hero ? Math.round(hero.getBoundingClientRect().height) : null,
        titleSize: title ? getComputedStyle(title).fontSize : null,
        titleBox: rect(title),
        leafBox: rect(leaf),
        facts,
        railLight: !!document.querySelector(".rail--light"),
      };
    });
    console.log(vp.name, lang, JSON.stringify(info));

    if (lang === "en" || vp.name === "390") {
      await page.screenshot({ path: `${OUT}/hero-${vp.name}-${lang}.png`, clip: await page.evaluate(() => {
        const h = document.querySelector(".hero").getBoundingClientRect();
        return { x: 0, y: 0, width: Math.round(h.width), height: Math.min(Math.round(h.height), 1400) };
      }) });
    }
  }
  await page.close();
}

await browser.close();
