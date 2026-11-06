# cellsTriggeredList: model notes

Teaching model for one A3 measurement in TS 38.331 V19.3.0. The page answers two questions: which neighbour cells are in cellsTriggeredList at a given moment, and what each MeasurementReport carries. The sections below separate what the specification says, which conventions this page adds, and what it leaves out.

## What the specification says

All references are to TS 38.331 V19.3.0, for reportType eventTriggered without numberOfTriggeringCells.

- **Entry and leaving conditions (§5.5.4.4).** A3-1, the entering condition, is Mn + Ofn + Ocn − Hys > Mp + Ofp + Ocp + Off. A3-2, the leaving condition, is Mn + Ofn + Ocn + Hys < Mp + Ofp + Ocp + Off. Both inequalities are strict. hysteresis and a3-Offset are coded in steps of 0.5 dB.
- **Adding a cell (§5.5.4.1).** A cell is added when the entry condition is fulfilled for all L3-filtered measurements taken during timeToTrigger. If no reporting entry exists for the measId yet (a first cell), the UE creates one, sets numberOfReportsSent to 0, adds the cell(s) and initiates reporting. If an entry already exists and the cell is not yet in the list (a subsequent cell), the UE also sets numberOfReportsSent to 0, adds the cell(s) and initiates reporting. A cell already in the list is not added again.
- **Removing a cell (§5.5.4.1).** A listed cell is removed when the leaving condition is fulfilled for all measurements taken during timeToTrigger. If reportOnLeave is true, reporting is initiated after the removal. Removal does not reset numberOfReportsSent. If the list is then empty, the reporting entry for the measId is removed and the periodical reporting timer is stopped.
- **Report content (§5.5.5.1, §5.5.5.3).** measResultNeighCells contains the best cells from cellsTriggeredList, up to maxReportCells, ordered by the sorting quantity, which for A3 is the trigger quantity (RSRP here). The serving-cell results are included in every report. If no neighbour cell is left to report, measResultNeighCells is absent.
- **Count and timer (§5.5.5.1).** Each report increments numberOfReportsSent and stops the periodical reporting timer if it is running. The timer is restarted with reportInterval only if numberOfReportsSent < reportAmount. For eventTriggered reporting, reaching reportAmount does not delete the reporting entry or the list. When the timer expires, the UE initiates a report with the current list (§5.5.4.1).

## Worked states (default walkthrough)

Inputs: SpCell −90 dBm, Off 3 dB, Hys 1 dB, so a cell enters above −86 dBm and leaves below −88 dBm. timeToTrigger 160 ms, reportInterval 240 ms, reportAmount r2, maxReportCells 1, reportOnLeave true. Samples every 40 ms.

| Time | What happens | List after | numberOfReportsSent | Report content |
| --- | --- | --- | --- | --- |
| 200 ms | A rises to −84 dBm; its timeToTrigger starts | empty | none | none |
| 360 ms | A has held for 160 ms. First cell: entry created, count 0, A added, report sent | A | 1 | A −84 |
| 400 ms | B rises to −83 dBm; its timeToTrigger starts | A | 1 | none |
| 560 ms | Subsequent cell B: count reset to 0, B added, report sent. Timer due at 600 ms is stopped and restarted to 800 ms | A, B | 1 | B −83 only (A is listed but maxReportCells is 1) |
| 800 ms | Timer expires, report sent. Count reaches r2, so the timer is not restarted | A, B | 2 | B −83 |
| 840 ms | A drops to −89 dBm; its leaving timeToTrigger starts | A, B | 2 | none |
| 1000 ms | A removed. reportOnLeave true: report with the remaining list | B | 3 | B −83 |
| 1200 ms | B drops to −89 dBm | B | 3 | none |
| 1360 ms | B removed, report sent, then the empty list removes the reporting entry | empty | 4, then no entry | no neighbour cells; serving result only |
| 1760 ms | A back at −84 dBm since 1600 ms. First cell again: new entry, count 0, report | A | 1 | A −84 |
| 2000 ms | Timer expires, report sent | A | 2 | A −84 |

With reportOnLeave false, the reports at 1000 and 1360 ms are not sent, the count stays at 2, and the reporting entry is still removed at 1360 ms.

Other presets on the page:

- **Between the lines:** A enters at 360 ms and then sits at −87 dBm. It stays listed to the end. After two reports (r2) reporting stops while A is still listed.
- **Short dip:** A drops to −89 dBm at 760 ms and returns at 840 ms. The pending leave is cancelled after 80 ms. A second dip from 1400 ms lasts long enough and removes A at 1560 ms.
- **Exactly on the line:** A at exactly −86 dBm from 200 ms does not enter, because A3-1 is strict. It rises to −85 dBm at 1000 ms and enters at 1160 ms. B enters at 360 ms and then sits at exactly −88 dBm, which does not meet A3-2, so it never leaves.
- **New cell restarts reports:** A uses up r2 by 600 ms and reporting stops. B enters at 1160 ms, the count is reset to 0, and reports resume at 1160 and 1400 ms.

## Teaching conventions (not from the specification)

- Inputs are already L3 filtered and arrive every 40 ms with no missing samples. The SpCell is fixed at −90 dBm. offsetMO and cellIndividualOffset are zero.
- timeToTrigger counts from the first qualifying sample. A change happens on the first sample where the condition has held on every sample since then and at least timeToTrigger has passed. Only timeToTrigger values that are whole multiples of 40 ms are offered (ms0, 40, 80, 160, 320, 480, 640), so the change happens exactly timeToTrigger after the first qualifying sample.
- When a periodical timer expiry falls on a sample instant, the expiry is handled first. On one sample, entries are handled before leaves, following the order of the §5.5.4.1 text.
- Equal RSRP in a report is listed A before B. The specification does not order ties.
- RSRP is shown in dBm. The real message carries an RSRP-Range index.
- All times and levels are constructed examples, not required latencies.

## Not modelled

numberOfTriggeringCells, enteringLeavingReport and cellsMetLeavingCond (the leaving report on this page does not name the departed cell), reportOnBestCellChange, useT312, other events and several measIds, reportAddNeighMeas and other optional result fields, beam-level results, measurement gaps and irregular sampling. AS security is assumed to be active, as reporting requires.

## How the figure is organised

One time axis, five numbered panels in causal order: (1) measured input, which the reader draws; (2) timeToTrigger, the UE's check; (3) cellsTriggeredList, the UE's state; (4) MeasurementReport, what is sent to the network; (5) numberOfReportsSent, the UE's counter. Each report in panel 4 is a box with maxReportCells slots, and listed cells that did not fit are drawn dashed below it. reportAmount is the dashed line in panel 5. It stops periodic reports only: a newly listed cell resets the count, and with reportOnLeave true a report is still sent when a cell leaves, so the count can pass the line.

## Colours

Cell A `#2E6E9E` (solid line, circle marker) and cell B `#B9842A` (dashed line, square marker). Both pass the six light-mode checks of a categorical palette validator (lightness, chroma, colour-vision separation ΔE 21.3, normal-vision ΔE 25.6, contrast). Cell identity is also given by text labels, marker shape and line style.

## Source

3GPP TS 38.331 V19.3.0, §5.5.4.1, §5.5.4.4, §5.5.5.1, §5.5.5.3 and §6.3.2 (ReportConfigNR, EventTriggerConfig). [Specification archive](https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/).
