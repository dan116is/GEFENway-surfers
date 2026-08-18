#!/usr/bin/env python3
"""מייצר את אייקוני האפליקציה (PNG) בלי תלות בספריות חיצוניות.

הרצה:  python3 tools/make_icons.py
"""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
SS = 4  # דגימת-על לקצוות חלקים


def write_png(path, w, h, pixels):
    """pixels: bytearray של RGB בגודל w*h*3"""
    raw = bytearray()
    stride = w * 3
    for y in range(h):
        raw.append(0)  # filter type 0
        raw += pixels[y * stride:(y + 1) * stride]
    comp = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", comp)
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


class Canvas:
    def __init__(self, size):
        self.n = size
        self.buf = [[0, 0, 0] for _ in range(size * size)]

    def put(self, x, y, rgb, a=1.0):
        if 0 <= x < self.n and 0 <= y < self.n:
            i = y * self.n + x
            p = self.buf[i]
            for k in range(3):
                p[k] = int(p[k] * (1 - a) + rgb[k] * a)

    def bg_gradient(self, top, bottom):
        for y in range(self.n):
            t = y / (self.n - 1)
            c = [int(top[k] + (bottom[k] - top[k]) * t) for k in range(3)]
            for x in range(self.n):
                self.buf[y * self.n + x] = list(c)

    def disc(self, cx, cy, r, rgb, a=1.0):
        for y in range(max(0, int(cy - r)), min(self.n, int(cy + r) + 1)):
            for x in range(max(0, int(cx - r)), min(self.n, int(cx + r) + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.put(x, y, rgb, a)

    def polygon(self, pts, rgb, a=1.0):
        ys = [p[1] for p in pts]
        for y in range(max(0, int(min(ys))), min(self.n, int(max(ys)) + 1)):
            xs = []
            for i in range(len(pts)):
                x1, y1 = pts[i]
                x2, y2 = pts[(i + 1) % len(pts)]
                if (y1 <= y < y2) or (y2 <= y < y1):
                    xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(max(0, int(xs[i])), min(self.n, int(xs[i + 1]) + 1)):
                    self.put(x, y, rgb, a)

    def downsample(self, factor):
        m = self.n // factor
        out = bytearray(m * m * 3)
        for y in range(m):
            for x in range(m):
                acc = [0, 0, 0]
                for dy in range(factor):
                    row = (y * factor + dy) * self.n
                    for dx in range(factor):
                        p = self.buf[row + x * factor + dx]
                        acc[0] += p[0]; acc[1] += p[1]; acc[2] += p[2]
                i = (y * m + x) * 3
                n2 = factor * factor
                out[i] = acc[0] // n2
                out[i + 1] = acc[1] // n2
                out[i + 2] = acc[2] // n2
        return m, out


def star_points(cx, cy, R, r, spikes=5, rot=-math.pi / 2):
    pts = []
    for i in range(spikes * 2):
        ang = rot + i * math.pi / spikes
        rad = R if i % 2 == 0 else r
        pts.append((cx + math.cos(ang) * rad, cy + math.sin(ang) * rad))
    return pts


def build(size, pad_ratio=0.0):
    """pad_ratio > 0 מייצר גרסת maskable עם שוליים בטוחים."""
    n = size * SS
    c = Canvas(n)
    c.bg_gradient((92, 196, 255), (108, 74, 232))

    inset = n * pad_ratio
    span = n - inset * 2

    # כביש בפרספקטיבה
    road = [
        (inset + span * 0.10, n - inset - span * 0.06),
        (inset + span * 0.90, n - inset - span * 0.06),
        (inset + span * 0.60, inset + span * 0.52),
        (inset + span * 0.40, inset + span * 0.52),
    ]
    c.polygon(road, (58, 66, 104))

    # פסי מסלול
    for k in range(4):
        t0 = 0.06 + k * 0.13
        t1 = t0 + 0.07
        def lerp(a, b, t):
            return a + (b - a) * t
        y0 = lerp(n - inset - span * 0.06, inset + span * 0.52, t0)
        y1 = lerp(n - inset - span * 0.06, inset + span * 0.52, t1)
        w0 = lerp(span * 0.030, span * 0.010, t0)
        w1 = lerp(span * 0.030, span * 0.010, t1)
        cxm = n / 2
        c.polygon([(cxm - w0, y0), (cxm + w0, y0), (cxm + w1, y1), (cxm - w1, y1)], (236, 242, 255))

    # כוכב גדול
    cx, cy = n / 2, inset + span * 0.42
    R = span * 0.30
    c.polygon(star_points(cx, cy + R * 0.06, R * 1.06, R * 0.50), (214, 148, 12))
    c.polygon(star_points(cx, cy, R, R * 0.47), (255, 200, 46))
    c.disc(cx - R * 0.30, cy - R * 0.26, R * 0.10, (255, 244, 200))

    return c.downsample(SS)


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [
        ("icon-192.png", 192, 0.0),
        ("icon-512.png", 512, 0.0),
        ("apple-touch-icon-180.png", 180, 0.0),
        ("maskable-512.png", 512, 0.13),
    ]
    for name, size, pad in jobs:
        m, px = build(size, pad)
        write_png(os.path.join(OUT, name), m, m, px)
        print("wrote", name, f"{m}x{m}")


if __name__ == "__main__":
    main()
