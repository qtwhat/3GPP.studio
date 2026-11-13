# Scheduling Request (SR)

Add uplink data and watch the UE request a grant. Change how often requests are missed to explore retries and random access.

What this lab simplifies. One phone, one request configuration, one slot per millisecond. Every grant is large enough to empty the buffer, so one grant ends the story; sizing grants is the job of the buffer status report. Whether the gNB hears a request is a coin flip at the rate you set. The random access fallback takes a fixed 60 ms and always works, and afterwards the reserved slots are assumed to be configured again. Not modelled: several request configurations and their mapping to logical channels, requests triggered by beam failure or other causes, the delay timer for low-priority data, overlap with other uplink transmissions, and DRX.

Sources. 3GPP TS 38.321 §5.4.4 (scheduling request: SR_COUNTER, sr-ProhibitTimer, sr-TransMax, fallback to random access) and §5.4.5 (the buffer status report that triggers and cancels it). TS 38.331 SchedulingRequestConfig and SchedulingRequestResourceConfig (value ranges). The specification is authoritative; this page is a teaching model. Specification archive
