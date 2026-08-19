# -*- coding: utf-8 -*-
from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")
start = html.index('<main id="main">') + len('<main id="main">')
end = html.index("</main>")
body = html[start:end].strip()

replacements = [
    ('href="#products"', 'href="/products/"'),
    ('href="#news"', 'href="/news/"'),
    ('href="#contact"', 'href="/contact/"'),
    ('href="#sustainability"', 'href="/sustainability/"'),
    ('href="#about"', 'href="/#about"'),
    ('href="mailto:partner@namvietgroup.vn"', 'href="/contact/?type=partner"'),
    ('href="mailto:contact@namvietgroup.vn"', 'href="/contact/"'),
]
for a, b in replacements:
    body = body.replace(a, b)

body = body.replace(
    """<div class="center reveal" data-delay="300">
      <a href="/contact/" class="btn btn--dark">
        <span class="btn__dot"></span>
        <span class="lang en">View All Products</span>""",
    """<div class="center reveal" data-delay="300">
      <a href="/products/" class="btn btn--dark">
        <span class="btn__dot"></span>
        <span class="lang en">View All Products</span>""",
)
body = body.replace(
    """<div class="center reveal" data-delay="300">
      <a href="/contact/" class="btn btn--dark">
        <span class="btn__dot"></span>
        <span class="lang en">View All News</span>""",
    """<div class="center reveal" data-delay="300">
      <a href="/news/" class="btn btn--dark">
        <span class="btn__dot"></span>
        <span class="lang en">View All News</span>""",
)

product_map = [
    (0, "#1d5c3f", "/products/gf-901/"),
    (80, "#9c2b2b", "/products/hf-901/"),
    (160, "#1f4f8f", "/products/v-234/"),
    (240, "#0f6f74", "/products/gf-22/"),
    (320, "#5c5218", "/products/s-234/"),
]
for delay, color, href in product_map:
    old = f'<a href="/contact/" class="pcard reveal" data-delay="{delay}" style="--pc:{color}">'
    new = f'<a href="{href}" class="pcard reveal" data-delay="{delay}" style="--pc:{color}">'
    body = body.replace(old, new, 1)

news_map = [
    (0, "/news/mekong-automation/"),
    (120, "/news/deep-water-port/"),
    (240, "/news/farming-households/"),
]
for delay, href in news_map:
    old = f'<a href="/contact/" class="ncard reveal" data-delay="{delay}">'
    new = f'<a href="{href}" class="ncard reveal" data-delay="{delay}">'
    body = body.replace(old, new, 1)

# Learn more ESG / Meet leadership stay on home anchors or dedicated pages
body = body.replace('href="/contact/" class="btn btn--dark">\n            <span class="btn__dot"></span>\n            <span class="lang en">Learn More About ESG</span>',
                    'href="/sustainability/" class="btn btn--dark">\n            <span class="btn__dot"></span>\n            <span class="lang en">Learn More About ESG</span>', 1)
body = body.replace('href="/contact/" class="btn btn--dark">\n            <span class="btn__dot"></span>\n            <span class="lang en">Meet Our Leadership</span>',
                    'href="/about/#leadership" class="btn btn--dark">\n            <span class="btn__dot"></span>\n            <span class="lang en">Meet Our Leadership</span>', 1)
body = body.replace('href="/contact/" class="btn btn--dark">\n      <span class="btn__dot"></span>\n      <span class="lang en">Become Our Partner</span>',
                    'href="/contact/?type=partner" class="btn btn--dark">\n      <span class="btn__dot"></span>\n      <span class="lang en">Become Our Partner</span>', 1)

out = Path("src/_includes/home-chapters.njk")
out.write_text(body + "\n", encoding="utf-8")
print("Wrote", out, "chars", len(body))
