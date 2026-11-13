# Beam Failure Recovery (BFR) · 2

Hold to block the serving beam. Compare a brief obstruction with a sustained one and watch recovery unfold.

What this lab simplifies. One cell, one set of detection reference signals, no DRX. A blocked beam is simply bad and an unblocked one good; there is no real radio channel. The reporting period is an illustrative 20 ms and the animation runs about 12 times slower than real time. Recovery takes a fixed 60 ms with a reserved preamble and 120 ms with the contention-based fallback; real timings depend on configuration, and retries, power ramping, back-off and beamFailureRecoveryTimer are not modelled. The phone here picks the strongest qualifying beam; the specification allows any qualifying one. When a bad reading lands exactly as the timer would expire, the reading is counted first, so pbfdN tolerates N−1 quiet periods; the specification does not order those two events. SCell recovery (a MAC CE instead of random access) and two-TRP operation are out of scope.

Sources. 3GPP TS 38.321 §5.17 (beam failure detection and recovery), §5.1 (random access for recovery). TS 38.213 §6 (link recovery). TS 38.331 RadioLinkMonitoringConfig and BeamFailureRecoveryConfig (value ranges). The specification is authoritative; this page is a teaching model. Specification archive
