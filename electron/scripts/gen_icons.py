"""토끼 아이콘 생성 스크립트 (앱 아이콘 / 트레이 아이콘)"""
import math
from PIL import Image, ImageDraw

OUT = "/home/user/hwan/electron/assets"


def rabbit_face(size, bg=None):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size * 0.58
    s = size

    if bg:
        d.ellipse([0, 0, s, s], fill=bg)

    white = (255, 255, 255, 255)
    pink = (255, 200, 210, 255)
    dark = (40, 35, 40, 255)
    nose = (235, 150, 165, 255)

    # ears
    ear_w = s * 0.16
    for dx in (-1, 1):
        ex = cx + dx * s * 0.19
        d.ellipse([ex - ear_w / 2, s * 0.02, ex + ear_w / 2, s * 0.62], fill=white)
        d.ellipse([ex - ear_w / 2 + s * 0.035, s * 0.10, ex + ear_w / 2 - s * 0.035, s * 0.52], fill=pink)

    # head
    r = s * 0.34
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=white)

    # cheeks / muzzle
    r2 = s * 0.14
    d.ellipse([cx - r2 - s * 0.10, cy + s * 0.06, cx + s * 0.10 - r2 + s * 0.24 - s*0.10, cy + s * 0.06 + r2 * 2 - s*0.0], fill=white)

    # eyes
    eye_r = s * 0.028
    for dx in (-1, 1):
        ex = cx + dx * s * 0.11
        ey = cy - s * 0.03
        d.ellipse([ex - eye_r, ey - eye_r, ex + eye_r, ey + eye_r], fill=dark)

    # nose
    nr = s * 0.03
    d.polygon(
        [
            (cx, cy + s * 0.06),
            (cx - nr, cy + s * 0.02),
            (cx + nr, cy + s * 0.02),
        ],
        fill=nose,
    )

    # cute blush
    blush = (255, 170, 185, 140)
    br = s * 0.035
    d.ellipse([cx - s * 0.20 - br, cy + s * 0.03 - br, cx - s * 0.20 + br, cy + s * 0.03 + br], fill=blush)
    d.ellipse([cx + s * 0.20 - br, cy + s * 0.03 - br, cx + s * 0.20 + br, cy + s * 0.03 + br], fill=blush)

    return img


def main():
    import os
    os.makedirs(OUT, exist_ok=True)

    # transparent app icon (largest master)
    master = rabbit_face(1024)
    master.save(f"{OUT}/icon-1024.png")

    sizes = [16, 24, 32, 48, 64, 128, 256]
    for sz in sizes:
        im = master.resize((sz, sz), Image.LANCZOS)
        if sz in (32, 256):
            im.save(f"{OUT}/icon-{sz}.png")

    # ICO for windows build: PIL이 master로부터 각 사이즈를 직접 리사이즈해서 담는다
    master.save(
        f"{OUT}/icon.ico",
        format="ICO",
        sizes=[(sz, sz) for sz in sizes],
    )

    # tray icon with cyan circle bg (matches concept art accent)
    tray = rabbit_face(64, bg=(20, 24, 30, 0))
    tray.save(f"{OUT}/tray-icon.png")
    tray32 = rabbit_face(32, bg=(20, 24, 30, 0))
    tray32.save(f"{OUT}/tray-icon-32.png")

    print("done")


if __name__ == "__main__":
    main()
