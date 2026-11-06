# Logical Channel Prioritization: model notes

This experiment illustrates how three logical channels share a sequence of uplink grants. It uses a simplified model based on 3GPP TS 38.321 V19.3.0 §5.4.3.1. The page and model are under technical review; they are not a complete implementation of the specification.

## Inputs and assumptions

There are 40 grants, one every 10 ms. Channels A, B and C have independently configurable priority, prioritised bit rate (PBR) and bucket size duration (BSD). The bucket capacity is PBR multiplied by BSD. A channel's simulated `Bj` is replenished before each grant and capped at that capacity.

The model allocates bytes in two rounds. In the first round, channels are considered by priority while their `Bj` is positive; allocated bytes reduce `Bj`. In the second round, remaining bytes are allocated by priority. The simulation ignores MAC and RLC headers and limits each queue to 40 SDUs.

## Default example

Grants 1 to 10 and 21 to 40 each carry 1,500 bytes. Grants 11 to 20 each carry 300 bytes. Channel B has PBR 64 bytes/ms and BSD 50 ms, giving a capacity of 64 × 50 = 3,200 bytes.

During the ten smaller grants, A and B use the available bytes and C sends none. When the grant returns to 1,500 bytes, B still has accumulated allowance and data waiting. In the model, C next sends at grant 24. It has waited through grants 11 to 23: 13 grants × 10 ms = 130 ms.

| Grant | Grant bytes | B's `Bj` before allocation | A / B / C bytes sent |
| --- | --- | --- | --- |
| 21 | 1,500 | 3,200 | 100 / 1,400 / 0 |
| 22 | 1,500 | 2,440 | 0 / 1,500 / 0 |
| 23 | 1,500 | 1,580 | 100 / 1,400 / 0 |
| 24 | 1,500 | 820 | 0 / 1,200 / 300 |

At grant 24, B still begins the first round with a positive `Bj`; it sends 1,200 bytes and its `Bj` then becomes −380. C receives 300 bytes afterwards.

These are model outputs for the chosen inputs, not a guarantee of delay in a real network. The locally recorded review checked the default model against the page and did not independently recheck every rule in TS 38.321.

## Source and checks

The editable model, page generator, drawing-tool attribution and regeneration instructions are in [source/lcp](../../../source/lcp/README.md). Run `node source/lcp/model2.mjs` from the repository root to print the grant-by-grant results.
