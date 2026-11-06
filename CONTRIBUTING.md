# Contributing

Thank you for helping improve 3GPP.studio. You can report an error, suggest a clearer explanation, improve an existing experiment or propose a new one.

## Propose a change

1. For a question or a larger idea, open an issue with the mechanism and the problem you would like to address.
2. Fork this repository and create a branch for your change.
3. Add or update the relevant code and Markdown notes. Run the checks described below.
4. Open a pull request describing what changed, the sources you used and what you checked. The maintainer will review it before deciding whether to merge.

Small corrections can also be proposed directly through GitHub's file editor. English is preferred for content intended to appear on the site.

## Technical content

- Name the specification or public contribution, its version or meeting and the relevant clause or document number. Link to the original source when possible.
- Distinguish a specification requirement, a meeting agreement, a company proposal and an interpretation. Give example inputs and explain any simplification.
- Include a note explaining what the experiment demonstrates, its assumptions and the behavior it does not model.
- Submit only material you have the right to share. Do not add confidential information or unpublished material belonging to another person or organization.

## Develop and check

Serve `prototype/` using the command in the [README](README.md). Run `node --test tests/*.test.mjs` from the repository root. Exercise changed controls in a browser and check both desktop and mobile layouts when applicable. These Node.js checks include model checks and page smoke checks; they do not replace browser testing.

The LCP experiment is generated. Its editable source and regeneration instructions are in [source/lcp](source/lcp/README.md). Do not replace its model with an edit to generated HTML alone.

## License

By submitting a contribution, you confirm that you have the right to submit it under the repository's licenses: MIT for project code and CC BY 4.0 for original Markdown documentation and notes. Identify third-party material and its license or permission separately. See [NOTICE.md](NOTICE.md).
