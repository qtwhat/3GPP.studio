# Buffer Status Reporting (BSR) · 2

Choose an uplink grant using only the reported bucket. Reveal the UE queues to see what your decision cost.

What this lab simplifies. One UE, two logical channels, at most two LCGs. Every PDU carries a BSR, as if the periodic timer ran each slot. The grant counts payload bytes only; headers and the BSR itself ride free. Data is taken from the call first, then the backup, which is a fixed order and not full LCP (how a real phone divides a grant is in the LCP lab ). Format follows §5.4.5: Long when more than one LCG has data as the PDU is built, otherwise Short; values are the bytes left after assembly. Not modelled: timers, Padding, Truncated, Extended and Refined BSR, HARQ, SR timing, other UEs.

Sources. 3GPP TS 38.321, §5.4.5 (procedure) and §6.1.3.1 (formats, Tables 6.1.3.1-1 and 6.1.3.1-2). Index i means B[i−1] < BS ≤ B[i] . The specification is authoritative; this page is a teaching model. Specification archive
