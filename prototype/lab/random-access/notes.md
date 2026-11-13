# Random Access (RA)

Choose a preamble, follow the four messages, then increase the crowd and watch collisions.

What this lab simplifies. Contention-based, 4-step random access only, on one beam. Sixteen doors in the first part so they fit on screen. When phones share a door, the gNB decodes one of them half the time and nobody the other half; real outcomes depend on received power and timing. Whether the first knock is loud enough is a hidden random level, not a path-loss calculation, and each attempt adds 2 dB. A failed attempt costs a fixed 40 ms before the backoff starts; a successful one takes 30 ms. Occasions come every 10 ms. Not modelled: beam (SSB) selection and its mapping to occasions, preamble groups A and B, the response window and contention timer as separate clocks, HARQ on message 3, contention-free and 2-step random access, prioritised access.

Sources. 3GPP TS 38.321 §5.1 (random access procedure: resource selection, preamble transmission, response reception, contention resolution) and Table 7.2-1 (backoff values). TS 38.331 RACH-ConfigCommon and RACH-ConfigGeneric (value ranges). The specification is authoritative; this page is a teaching model. Specification archive
