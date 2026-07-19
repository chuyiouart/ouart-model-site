from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
assets = root / "assets"


def scaled_points(points, scale):
    return [(round(x * scale), round(y * scale)) for x, y in points]


def render_mark(size):
    scale_factor = 8
    canvas_size = size * scale_factor
    scale = canvas_size / 64
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle(
        (0, 0, canvas_size - 1, canvas_size - 1),
        radius=round(14 * scale),
        fill=(0, 0, 0, 255),
    )
    draw.rectangle(
        (round(27 * scale), round(11 * scale), round(37 * scale), round(20 * scale)),
        fill=(255, 255, 255, 255),
    )
    draw.polygon(scaled_points([(22, 22), (42, 22), (39, 28), (25, 28)], scale), fill="white")
    draw.polygon(scaled_points([(17, 30), (47, 30), (43, 37), (21, 37)], scale), fill="white")
    draw.polygon(scaled_points([(11, 39), (53, 39), (47, 50), (17, 50)], scale), fill="white")
    draw.polygon(scaled_points([(32, 35), (38, 50), (26, 50)], scale), fill="black")

    return image.resize((size, size), Image.Resampling.LANCZOS)


outputs = {
    "favicon-16.png": 16,
    "favicon-32.png": 32,
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
}

for name, size in outputs.items():
    render_mark(size).save(assets / name, optimize=True)

render_mark(512).save(
    root / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)

print({"rendered": list(outputs), "ico": "favicon.ico"})
