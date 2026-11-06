"""Compare each published site file with a SHA-256 release manifest."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from urllib.parse import quote

manifest = json.loads(Path(sys.argv[1]).read_text())
base = sys.argv[2].rstrip("/")
failures = []
for path, expected in manifest.items():
    url = base + "/" + quote(path, safe="/")
    result = subprocess.run(
        ["curl", "--fail", "--silent", "--show-error", "--location",
         "--retry", "2", "--max-time", "30", url],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    if result.returncode:
        failures.append(f"{path}: download failed")
    elif hashlib.sha256(result.stdout).hexdigest() != expected:
        failures.append(f"{path}: content differs")
if failures:
    print("\n".join(failures), file=sys.stderr)
    raise SystemExit(f"{len(failures)} of {len(manifest)} published files failed verification")
print(f"Verified {len(manifest)} published files against the release manifest")
