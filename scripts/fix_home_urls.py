# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path("src/_includes/home-chapters.njk")
t = p.read_text(encoding="utf-8")


def href_repl(m):
    href = m.group(1)
    if href.startswith(("http", "#", "{{", "mailto:", "tel:")):
        return m.group(0)
    if href.startswith("/"):
        return f"href=\"{{{{ '{href}' | url }}}}\""
    return m.group(0)


t = re.sub(r'href="([^"]+)"', href_repl, t)
t = re.sub(
    r'src="assets/img/([^"]+)"',
    'src="{{ \'/assets/img/\\1\' | url }}"',
    t,
)
p.write_text(t, encoding="utf-8")
print("done")
