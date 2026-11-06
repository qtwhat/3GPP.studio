# Publishing the site

The public checkout is the working copy for website releases. Keep the site files, experiment notes and editable sources in this repository. The live site is served from `prototype/`.

Before publishing, review the changes and test the affected experiment in a browser. Then run:

```sh
bash scripts/publish.sh --check
bash scripts/publish.sh
```

The first command runs local checks without publishing. The second command:

1. Runs the model checks, verifies that the LCP generator reproduces its page and validates the public site files.
2. Fetches GitHub's `main` branch. If GitHub has commits that are not in the local checkout, it stops so they can be integrated first.
3. Commits local changes, pushes to GitHub and checks that GitHub points to the same commit.
4. Builds the site from that exact commit, deploys it to Cloudflare Pages and compares the live files with a SHA-256 manifest.

The release includes only the labs listed in `public-labs.json`. Each public lab needs an `index.html` and `notes.md`. Update the list when a new experiment has been reviewed and is ready for publication.

If GitHub is ahead, integrate its changes into the local `main` branch and resolve any conflicts before running the command again. The script never force-pushes. If deployment or verification fails after the push, GitHub may be ahead of the live site; correct the problem and rerun the command. The script prints the release manifest location on success.

GitHub push access and Cloudflare Wrangler authentication must already be configured. Set `WRANGLER_JS` to use an existing local Wrangler installation; otherwise the script uses Wrangler 4.156.2 through `npx`. `PUBLISH_MESSAGE` can override the default commit message. `RELEASE_MANIFEST` can point to a location where a copy of the manifest should be saved. The default verification URL is `https://3gpp.studio`; `SITE_CHECK_URL` can override it for an explicit verification target.
