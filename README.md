# 3GPP.studio

I used to spend hours reading 3GPP specifications before I could picture how a procedure like random access or beam failure recovery worked. I kept wishing I could change one thing in the diagram and see what happened next. With help from AI, I built 3GPP.studio so anyone could try that.

[Play the 11 experiments](https://3gpp.studio/) · [Help maintain the project](#contribute)

## Pick a lab

| Mechanism | What you can try |
| --- | --- |
| Random access (RACH) | [Pick a preamble](https://3gpp.studio/lab/random-access/) and see what happens when another phone picks the same one. |
| Beam failure recovery (BFR) | [1 · Place bad readings on a timeline](https://3gpp.studio/lab/bfr/) to test the detection timer. [2 · Block the serving beam](https://3gpp.studio/lab/bfr-2/) briefly, then hold it blocked and watch the phone recover. |
| Logical channel prioritization (LCP) | [1 · Configure three logical channels](https://3gpp.studio/lab/lcp/) and step through their grants (under technical review). [2 · Split one grant](https://3gpp.studio/lab/lcp-2/), then run the same queues for a second. |
| Buffer status reporting (BSR) | [1 · Follow a report](https://3gpp.studio/lab/bsr/) as new data arrives. [2 · Play the scheduler](https://3gpp.studio/lab/bsr-2/) and choose a grant before revealing the queue. |
| Scheduling request (SR) | [Add data to an empty queue](https://3gpp.studio/lab/sr/) and see how the phone responds when its request goes unanswered. |
| Hybrid ARQ (HARQ) | [Interfere with a transmission](https://3gpp.studio/lab/harq/) and follow the block through retransmission and combining. |
| DRX and low-power wake-up signals | [Place a downlink packet on the timeline](https://3gpp.studio/lab/drx-lp-wus/) and compare when the phone wakes and how long the packet waits. |
| Event A3 measurement reporting | [Draw two neighbours’ signal levels](https://3gpp.studio/lab/cells-triggered-list/) and see which cells enter the triggered list and which appear in the report. |

3GPP.studio is an independent educational project. Each lab uses a simplified model. Refer to the cited specifications for the protocol requirements.

## Run locally

No package installation is needed to serve the site. From the repository root, run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1 --directory prototype
```

Open [http://127.0.0.1:8767/](http://127.0.0.1:8767/). Python 3 is needed for the local server; Node.js is needed for the model checks and the LCP page generator.

```sh
node --test tests/*.test.mjs
```

Most experiments keep their HTML, CSS, JavaScript and notes in `prototype/lab/`. Shared site assets are in `prototype/assets/`. The first LCP lab is generated from the editable model and drawing code in [source/lcp](source/lcp/README.md).

## Contribute

I’d love to maintain these labs with others in the 3GPP community. If a lab behaves differently from what you expect, [open an issue](https://github.com/qtwhat/3GPP.studio/issues) with the settings you tried and the relevant clause. Ideas for new labs are welcome too. To improve a lab or contribute one of your own, see the [contribution guide](CONTRIBUTING.md).

The maintainer publishes reviewed changes to the live site. A pull request merged on GitHub does not go live until the next site publication.

For maintainers, [the publishing guide](docs/publishing.md) describes how the local checkout, GitHub and the live site are synchronized.

## License and attribution

Project code is available under the [MIT License](LICENSE). Original Markdown notes and documentation are available under [CC BY 4.0](LICENSES/CC-BY-4.0.txt). See [NOTICE.md](NOTICE.md) for third-party code, specification material and trademarks.
