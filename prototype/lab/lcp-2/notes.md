# Logical Channel Prioritization (LCP) · 2

Split a single grant across three queues, then see which channels can sustain their rates over one second.

What this lab simplifies. Bytes flow like liquid: there are no SDU boundaries, so Bj never goes below zero here (in the specification it can, because a whole SDU may be served once Bj is positive). No MAC or RLC headers, and no MAC control elements, which are placed ahead of data. All three channels are allowed on every grant; the selection rules of §5.4.3.1.2 (subcarrier spacing, PUSCH duration, configured-grant restrictions) are not modelled. One grant every 10 ms. Waiting time is time in the phone's queue only. The flow needs shown (rates, budgets) and their mapping to the three numbers are examples.

Sources. 3GPP TS 38.321 §5.4.3.1 (Logical Channel Prioritization: Bj, the two allocation steps, equal-priority channels served equally). TS 38.331 LogicalChannelConfig (value ranges). TS 23.501 §5.7 (QoS flows, 5QI characteristics). The specification is authoritative; this page is a teaching model. Specification archive
