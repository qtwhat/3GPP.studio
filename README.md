# 3GPP.studio

**3GPP, playable.** [3GPP.studio](https://3gpp.studio/) is a place to explore radio access mechanisms through interactive experiments.

Each experiment focuses on one mechanism. Change a parameter, step through the process and watch how the UE, the network or their internal state responds. The aim is to help engineers, researchers and students understand why a result occurs, using concrete examples and links to the relevant specifications.

This repository brings the experiments, their source code and model notes together so that others can learn from them, suggest corrections and contribute new explanations. We hope to build the collection with the 3GPP community.

3GPP.studio is an independent educational project. Its experiments are simplified teaching models; consult the cited 3GPP specification and version for the actual requirements.

## Experiments

| Experiment | Page | Model notes |
| --- | --- | --- |
| Logical Channel Prioritization (LCP) | [Open experiment](https://3gpp.studio/lab/lcp/) | [Notes](prototype/lab/lcp/notes.md) |
| Buffer Status Reporting (BSR) | [Open experiment](https://3gpp.studio/lab/bsr/) | [Notes](prototype/lab/bsr/notes.md) |
| Beam Failure Recovery (BFR) | [Open experiment](https://3gpp.studio/lab/bfr/) | [Notes](prototype/lab/bfr/notes.md) |
| cellsTriggeredList | [Open experiment](https://3gpp.studio/lab/cells-triggered-list/) | [Notes](prototype/lab/cells-triggered-list/notes.md) |

The notes describe the source specification, example assumptions, model boundaries and relevant checks. The LCP experiment is marked as under technical review.

## Run locally

No package installation is needed to serve the site. From the repository root, run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1 --directory prototype
```

Open [http://127.0.0.1:8767/](http://127.0.0.1:8767/). Python 3 is needed for the local server; Node.js is needed for the model checks and the LCP page generator.

```sh
node --test tests/*.test.mjs
```

Most experiments keep their HTML, CSS, JavaScript and notes in `prototype/lab/`. Shared site assets are in `prototype/assets/`. The LCP page is generated from the editable model and drawing code in [source/lcp](source/lcp/README.md).

## Contribute

Corrections, explanations, new examples and interactive experiments are welcome. Open an issue to discuss an idea, or fork the repository and submit a pull request. The maintainer reviews proposed changes before merging them. See [CONTRIBUTING.md](CONTRIBUTING.md).

The maintainer publishes reviewed changes to the live site. A pull request merged on GitHub does not go live until the next site publication.

For maintainers, [the publishing guide](docs/publishing.md) describes how the local checkout, GitHub and the live site are synchronized.

## License and attribution

Project code is available under the [MIT License](LICENSE). Original Markdown notes and documentation are available under [CC BY 4.0](LICENSES/CC-BY-4.0.txt). See [NOTICE.md](NOTICE.md) for third-party code, specification material and trademarks.
