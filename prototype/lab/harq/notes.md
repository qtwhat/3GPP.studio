# HARQ

Jam transmissions and see how retransmissions combine while other HARQ processes keep sending.

What this lab simplifies. One direction, one cell, one block per slot, always more data to send. Signal quality is three made-up levels: a clean transmission carries all that decoding needs, a weak one 60%, a jammed one 30%, and with combining the copies simply add. Real combining gain depends on the code, the redundancy versions and the channel. The answer for a block arrives a fixed number of slots after it was sent, and the process can be reused in that same slot. Retransmissions go before new data. A dropped block is skipped by the in-order row as soon as the sender gives up. Not modelled: feedback errors, code block groups, bundled or multiplexed ACKs, HARQ with feedback disabled, the DRX timers that keep a phone awake for retransmissions, and RLC retransmission.

Sources. 3GPP TS 38.321 §5.3.2 (downlink HARQ operation) and §5.4.2 (uplink HARQ operation). TS 38.212 (redundancy versions, new data indicator in the grant). TS 38.331 PDSCH-ServingCellConfig (number of processes). The specification is authoritative; this page is a teaching model. Specification archive
