#!/usr/bin/env python3
"""מאחד את המשחק לקובץ HTML יחיד (בלי תלויות חיצוניות).

הרצה:  python3 tools/build_single.py
פלט:   dist/gefenway-surfers.html
"""
import base64
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULES = ["util", "audio", "characters", "world", "game", "main"]

IMPORT_RE = re.compile(r"^import\s+[\s\S]*?from\s+'[^']+';[ \t]*\n", re.MULTILINE)
EXPORT_RE = re.compile(r"^export\s+(?=(const|let|var|function|class)\b)", re.MULTILINE)


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as f:
        return f.read()


def bundle_js():
    out = []
    for name in MODULES:
        src = read("js", f"{name}.js")
        src = IMPORT_RE.sub("", src)
        src = EXPORT_RE.sub("", src)
        if "export" in re.sub(r"//.*", "", src):
            leftovers = [l for l in src.splitlines() if l.strip().startswith("export")]
            if leftovers:
                raise SystemExit(f"{name}.js: לא הצלחתי להסיר את {leftovers}")
        out.append(f"/* ===== js/{name}.js ===== */\n{src.strip()}\n")
    return "(function(){\n'use strict';\n" + "\n".join(out) + "\n})();"


def data_uri(path, mime):
    with open(os.path.join(ROOT, path), "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def main():
    html = read("index.html")

    # גוף המסמך בלבד — הפריסה החיצונית מסופקת על ידי המארח
    body = html.split("<body>", 1)[1].rsplit("</body>", 1)[0]
    body = body.replace('<script type="module" src="js/main.js"></script>', "")

    css = read("css", "style.css")
    js = bundle_js()
    icon = data_uri("icons/apple-touch-icon-180.png", "image/png")

    head = (
        "<title>גפן ווי סרפרס</title>\n"
        '<meta name="viewport" content="width=device-width, initial-scale=1, '
        'maximum-scale=1, user-scalable=no, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0d1b3e">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
        '<meta name="apple-mobile-web-app-title" content="גפן ווי">\n'
        f'<link rel="apple-touch-icon" href="{icon}">\n'
    )

    doc = (
        f"{head}"
        f"<style>\nhtml,body{{margin:0;padding:0;height:100%;overflow:hidden}}\n{css}\n</style>\n"
        f'<div dir="rtl" lang="he" id="gefenway-root">{body}</div>\n'
        f"<script>\n{js}\n</script>\n"
    )

    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    out = os.path.join(ROOT, "dist", "gefenway-surfers.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"wrote dist/gefenway-surfers.html  ({len(doc) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
