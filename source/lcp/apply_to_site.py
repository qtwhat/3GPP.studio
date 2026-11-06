"""Apply the navigation adapter to a generated LCP page.

Usage: python3 source/lcp/apply_to_site.py GENERATED_HTML [--check]
"""
from pathlib import Path
import re
import sys

here = Path(__file__).resolve().parent
root = here.parents[1]
source = Path(sys.argv[1]).read_text()
adapter = (here / "lcp-nav.html").read_text()
body = re.search(r"<body\b[^>]*>", source)
if body is None:
    raise SystemExit("Generated page has no body element")
output = source[:body.end()] + "\n" + adapter + source[body.end():]
old = "<title>LCP, three channels</title>"
new = "<title>Logical Channel Prioritization (LCP) · 3gpp.studio</title>"
if output.count(old) != 1:
    raise SystemExit("Generated page has an unexpected title")
output = output.replace(old, new, 1)
target = root / "prototype/lab/lcp/index.html"
if "--check" in sys.argv[2:]:
    if target.read_text() != output:
        raise SystemExit("Generated page differs from the committed site page")
    print("Generated LCP page matches the site page")
else:
    target.write_text(output)
    print("Updated", target)
