"""Validate or export the public site.

Usage:
  python3 tools/prepare_release.py --check
  python3 tools/prepare_release.py --commit COMMIT OUTPUT_DIRECTORY

The commit mode copies only prototype/ from the given Git commit. The output
directory must not already exist. A JSON map of site paths to SHA-256 hashes
is printed to stdout.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_SUFFIXES = {".html", ".css", ".js", ".mjs", ".svg", ".jpg", ".png",
                    ".md", ".txt", ".xml", ".ico", ".webp"}
ALLOWED_NAMES = {"LICENSE", "robots.txt"}


def validate(files, labs):
    if not isinstance(labs, list) or not labs or len(set(labs)) != len(labs):
        raise ValueError("public-labs.json must contain a nonempty, unique labs list")
    if any(not isinstance(x, str) or not x or "/" in x or x.startswith(".") for x in labs):
        raise ValueError("Invalid lab name in public-labs.json")
    paths = set(files)
    for path in paths:
        p = PurePosixPath(path)
        if p.is_absolute() or ".." in p.parts or any(part.startswith(".") for part in p.parts):
            raise ValueError(f"Hidden or unsafe site path: {path}")
        if p.suffix not in ALLOWED_SUFFIXES and p.name not in ALLOWED_NAMES:
            raise ValueError(f"Unexpected site file type: {path}")
        if p.parts[0] == "lab" and (len(p.parts) < 3 or p.parts[1] not in labs):
            raise ValueError(f"Lab not listed in public-labs.json: {path}")
    for required in ["index.html", "404.html"]:
        if required not in paths:
            raise ValueError(f"Missing site file: {required}")
    for lab in labs:
        for name in ("index.html", "notes.md"):
            if f"lab/{lab}/{name}" not in paths:
                raise ValueError(f"Missing {name} for public lab {lab}")


def from_worktree():
    config = json.loads((ROOT / "public-labs.json").read_text())
    files = {}
    for path in (ROOT / "prototype").rglob("*"):
        if path.is_symlink():
            raise ValueError(f"Symlinks are not allowed in prototype/: {path}")
        if path.is_file():
            files[path.relative_to(ROOT / "prototype").as_posix()] = path.read_bytes()
    return files, config["labs"]


def from_commit(commit):
    archive = subprocess.run(
        ["git", "archive", "--format=tar", commit, "--", "prototype", "public-labs.json"],
        cwd=ROOT, check=True, stdout=subprocess.PIPE
    ).stdout
    files, config = {}, None
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:") as tar:
        for entry in tar:
            if entry.isdir():
                continue
            if not entry.isfile():
                raise ValueError(f"Non-file entry in release archive: {entry.name}")
            data = tar.extractfile(entry).read()
            if entry.name == "public-labs.json":
                config = json.loads(data)
            elif entry.name.startswith("prototype/"):
                files[entry.name[len("prototype/"):]] = data
            else:
                raise ValueError(f"Unexpected archive entry: {entry.name}")
    if config is None:
        raise ValueError("Missing public-labs.json in commit")
    return files, config["labs"]


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true")
    group.add_argument("--commit")
    parser.add_argument("output", nargs="?")
    args = parser.parse_args()
    if args.check:
        if args.output:
            parser.error("--check does not take an output directory")
        files, labs = from_worktree()
        validate(files, labs)
        print(f"Validated {len(files)} site files for {len(labs)} public labs")
        return
    if not args.output:
        parser.error("--commit requires an output directory")
    files, labs = from_commit(args.commit)
    validate(files, labs)
    target = Path(args.output).resolve()
    target.mkdir(parents=True, exist_ok=False)
    manifest = {}
    for path, data in sorted(files.items()):
        dest = target.joinpath(*PurePosixPath(path).parts)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        manifest[path] = hashlib.sha256(data).hexdigest()
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
