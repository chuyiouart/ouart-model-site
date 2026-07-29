#!/usr/bin/env python3
"""Build lightweight WebP derivatives for the public OUART website."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]


def load_window_array(relative_path: str) -> list[dict]:
    text = (ROOT / relative_path).read_text(encoding="utf-8")
    start = text.index("[")
    end = text.rindex("]") + 1
    return json.loads(text[start:end])


def local_asset_path(value: str) -> Path:
    return ROOT / value.removeprefix("./")


def prepare_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
        return image.convert("RGBA")
    return image.convert("RGB")


def build_webp(source: Path, destination: Path, max_width: int, quality: int, force: bool) -> tuple[int, int]:
    if not source.is_file():
        raise FileNotFoundError(source)
    if (
        not force
        and destination.is_file()
        and destination.stat().st_mtime_ns >= source.stat().st_mtime_ns
    ):
        return source.stat().st_size, destination.stat().st_size

    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = prepare_image(opened)
        if image.width > max_width:
            height = max(1, round(image.height * max_width / image.width))
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=quality, method=6)
    return source.stat().st_size, destination.stat().st_size


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="regenerate existing derivatives")
    args = parser.parse_args()

    models = [item for item in load_window_array("data/models.js") if item.get("published") is True]
    batches = [item for item in load_window_array("data/batches.js") if item.get("published") is True]
    jobs: list[tuple[Path, Path, int, int]] = []

    for model in models:
        model_id = model["id"]
        source = local_asset_path(model["image"])
        jobs.extend(
            [
                (source, ROOT / f"assets/thumbs/models/{model_id}-480.webp", 480, 72),
                (source, ROOT / f"assets/thumbs/models/{model_id}-960.webp", 960, 76),
            ]
        )
        for index, item in enumerate(model.get("gallery") or [], start=1):
            if item.get("src"):
                jobs.append(
                    (
                        local_asset_path(item["src"]),
                        ROOT / f"assets/thumbs/gallery/{model_id}-{index:02d}.webp",
                        640,
                        72,
                    )
                )

    for batch in batches:
        source = local_asset_path(batch["collage"])
        batch_id = batch["id"]
        jobs.extend(
            [
                (source, ROOT / f"assets/thumbs/batches/{batch_id}-720.webp", 720, 72),
                (source, ROOT / f"assets/thumbs/batches/{batch_id}-1200.webp", 1200, 76),
            ]
        )

    source_bytes = 0
    output_bytes = 0
    for source, destination, width, quality in jobs:
        current_source, current_output = build_webp(source, destination, width, quality, args.force)
        source_bytes += current_source
        output_bytes += current_output

    reduction = 100 * (1 - output_bytes / source_bytes) if source_bytes else 0
    print(
        f"Generated/verified {len(jobs)} WebP files: "
        f"{source_bytes / 1024 / 1024:.2f} MB -> {output_bytes / 1024 / 1024:.2f} MB "
        f"({reduction:.1f}% smaller)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
