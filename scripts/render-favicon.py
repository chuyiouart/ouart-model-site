from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
assets = root / "assets"
source_path = assets / "logo-generated-master.png"


def normalized_symbol():
    source = Image.open(source_path).convert("L")
    binary = source.point(lambda pixel: 255 if pixel >= 128 else 0)
    bounds = binary.getbbox()
    if bounds is None:
        raise RuntimeError("Generated logo does not contain a visible symbol")
    return binary.crop(bounds)


symbol = normalized_symbol()


def render_mark(size):
    canvas = Image.new("RGB", (size, size), "black")
    target_height = max(1, round(size * 0.78))
    target_width = max(1, round(target_height * symbol.width / symbol.height))
    resized = symbol.resize((target_width, target_height), Image.Resampling.LANCZOS)
    x = round((size - target_width) / 2)
    y = round((size - target_height) / 2)
    canvas.paste(Image.merge("RGB", (resized, resized, resized)), (x, y))
    return canvas


outputs = {
    "logo-mark.png": 512,
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

print({"source": source_path.name, "rendered": list(outputs), "ico": "favicon.ico"})
