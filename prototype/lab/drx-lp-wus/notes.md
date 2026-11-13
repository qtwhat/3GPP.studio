# DRX and LP-WUS

Place downlink packets on a timeline and compare receiver activity and delivery delay across listening modes.

What this lab simplifies. Downlink only, one phone, one cell, one packet delivered per millisecond while awake. Energy is in made-up relative units: awake 100 per ms, asleep 1, wake-up receiver 1 more while the main radio sleeps, and 200 for each wake-up; real figures depend on the device and on how deeply it can sleep. With LP-WUS before the cycle, the occasion sits 3 ms ahead of the on-duration; on its own clock, the main radio starts listening 2 ms after the signal. Not modelled: the short DRX cycle, DRX command MAC CEs, HARQ round-trip and retransmission timers, uplink and scheduling requests (which also wake the phone), the older PDCCH-based wake-up indication (DCP), CSI reporting rules, two DRX groups, and LP-WUS in idle mode.

Sources. 3GPP TS 38.321 Release 19, §5.7 (DRX, Active Time, LP-WUS indication and lpwus-PDCCH-MonitoringTimer). TS 38.213 (LP-WUS monitoring occasions). TS 38.331 DRX-Config (value ranges). The specification is authoritative; this page is a teaching model. Specification archive
