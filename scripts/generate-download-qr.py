#!/usr/bin/env python3
"""Generate QR PNG pointing to the Amenallah Android download page (not the raw APK)."""

from __future__ import annotations

import argparse
import os
import sys

try:
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
except ImportError:
    print("Install: pip install 'qrcode[pil]'", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    default_url = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000").rstrip("/") + "/download"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--url",
        default=default_url,
        help="Full URL of the download page (default: NEXT_PUBLIC_APP_URL/download)",
    )
    parser.add_argument(
        "--out",
        default=os.path.join(root, "public", "images", "android-download-qr.png"),
        help="Output PNG path",
    )
    args = parser.parse_args()

    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(args.url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    img.save(args.out)
    print(f"Wrote {args.out}")
    print(f"Encodes: {args.url}")


if __name__ == "__main__":
    main()
