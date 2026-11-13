window.S3_TOPICS = [
  {
    "id": "measurement",
    "label": "Measurement",
    "searchTerms": [
      "测量"
    ]
  },
  {
    "id": "scheduling",
    "label": "Scheduling",
    "searchTerms": [
      "调度"
    ]
  },
  {
    "id": "beam",
    "label": "Beam management",
    "searchTerms": [
      "波束",
      "波束管理"
    ]
  },
  {
    "id": "access",
    "label": "Random access",
    "searchTerms": [
      "随机接入"
    ]
  },
  {
    "id": "power",
    "label": "Power saving",
    "searchTerms": [
      "节能"
    ]
  }
];
window.S3_EXPERIMENTS = [
  {
    "id": "lcp",
    "status": "live",
    "order": 1,
    "title": "Logical Channel Prioritization (LCP) · 1",
    "summary": "Set the grant sizes and the priority, PBR and BSD of three logical channels, then step through how each grant’s bytes are shared out.",
    "topics": [
      "scheduling"
    ],
    "layer": "MAC",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/lcp-clean.jpg",
    "alt": "Screenshot of the LCP experiment: three logical-channel tanks on an isometric board.",
    "href": "lab/lcp/index.html",
    "searchTerms": [
      "LCP",
      "logical channel prioritization",
      "逻辑信道",
      "PBR",
      "prioritised bit rate",
      "BSD",
      "bucket size duration",
      "token bucket",
      "令牌桶",
      "grant",
      "上行授权",
      "LCH"
    ]
  },
  {
    "id": "lcp-2",
    "status": "live",
    "order": 2,
    "title": "Logical Channel Prioritization (LCP) · 2",
    "summary": "Priority says who goes first. PBR says for how many bytes.",
    "topics": [
      "scheduling"
    ],
    "layer": "MAC",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/lcp-2.jpg",
    "alt": "Logical Channel Prioritization interactive experiment",
    "href": "lab/lcp-2/index.html",
    "searchTerms": [
      "Logical Channel Prioritization",
      "LCP"
    ]
  },
  {
    "id": "bsr",
    "status": "live",
    "order": 3,
    "title": "Buffer Status Reporting (BSR) · 1",
    "summary": "Step through five moments and compare the UE’s exact bytes with the range the gNB receives: LCG aggregation, Short/Long format, quantization and staleness.",
    "topics": [
      "scheduling"
    ],
    "layer": "MAC",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/bsr-explainer.svg",
    "alt": "Two logical-channel bars in one LCG, a Short BSR octet, and a log-scale ruler where the UE’s current bytes sit outside the stale reported range.",
    "href": "lab/bsr/index.html",
    "searchTerms": [
      "BSR",
      "buffer status report",
      "LCG",
      "logical channel group",
      "Short BSR",
      "Long BSR",
      "SR",
      "quantization",
      "缓存状态报告",
      "缓冲区状态报告",
      "逻辑信道组"
    ]
  },
  {
    "id": "bsr-2",
    "status": "live",
    "order": 4,
    "title": "Buffer Status Reporting (BSR) · 2",
    "summary": "1,400 bytes are waiting. The network hears 5 bits.",
    "topics": [
      "scheduling"
    ],
    "layer": "MAC",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/bsr-2.jpg",
    "alt": "Buffer Status Report interactive experiment",
    "href": "lab/bsr-2/index.html",
    "searchTerms": [
      "Buffer Status Report",
      "BSR"
    ]
  },
  {
    "id": "bfr",
    "status": "live",
    "order": 5,
    "title": "Beam Failure Recovery (BFR) · 1",
    "summary": "Mark beam failure instances on a timeline, watch the counter and its timer decide detection, then see which gates SpCell recovery must pass.",
    "topics": [
      "beam"
    ],
    "layer": "MAC / L1",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/bfr.svg",
    "alt": "A timeline of beam failure instances, detection-timer bars and a counter rising to its maximum, followed by a five-step recovery chain ending in Recovered.",
    "href": "lab/bfr/index.html",
    "searchTerms": [
      "BFR",
      "beam failure recovery",
      "beam failure detection",
      "BFD",
      "BFI",
      "BFI_COUNTER",
      "beamFailureDetectionTimer",
      "beamFailureInstanceMaxCount",
      "beamFailureRecoveryTimer",
      "recoverySearchSpace",
      "CFRA",
      "candidate beam",
      "波束失败",
      "波束失败恢复",
      "波束恢复"
    ]
  },
  {
    "id": "bfr-2",
    "status": "live",
    "order": 6,
    "title": "Beam Failure Recovery (BFR) · 2",
    "summary": "One bad reading is a blip. Three close together is a failure.",
    "topics": [
      "beam"
    ],
    "layer": "MAC / L1",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/bfr-2.jpg",
    "alt": "Beam Failure Recovery interactive experiment",
    "href": "lab/bfr-2/index.html",
    "searchTerms": [
      "Beam Failure Recovery",
      "BFR"
    ]
  },
  {
    "id": "cells-triggered-list",
    "status": "live",
    "order": 7,
    "title": "cellsTriggeredList (event A3)",
    "summary": "Draw two neighbours’ RSRP against the A3 lines and watch cells enter and leave cellsTriggeredList, the report count reset and stop, and what each MeasurementReport carries.",
    "topics": [
      "measurement"
    ],
    "layer": "RRC",
    "spec": "TS 38.331",
    "thumb": "assets/thumbs/cells-triggered-list.svg",
    "alt": "Two neighbour RSRP traces crossing the A3 entry and leave lines, with the cellsTriggeredList membership bars, MeasurementReport markers and the numberOfReportsSent step plot below.",
    "href": "lab/cells-triggered-list/index.html",
    "searchTerms": [
      "cellsTriggeredList",
      "cells triggered list",
      "A3",
      "event A3",
      "MeasurementReport",
      "measurement report",
      "numberOfReportsSent",
      "reportAmount",
      "reportInterval",
      "maxReportCells",
      "reportOnLeave",
      "timeToTrigger",
      "TTT",
      "hysteresis",
      "a3-Offset",
      "VarMeasReportList",
      "测量报告",
      "触发小区列表",
      "事件触发"
    ]
  },
  {
    "id": "sr",
    "status": "live",
    "order": 8,
    "title": "Scheduling Request (SR)",
    "summary": "Data to send, and no permission. All the phone may send is one bit.",
    "topics": [
      "scheduling"
    ],
    "layer": "MAC",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/sr.jpg",
    "alt": "Scheduling Request interactive experiment",
    "href": "lab/sr/index.html",
    "searchTerms": [
      "Scheduling Request",
      "SR"
    ]
  },
  {
    "id": "random-access",
    "status": "live",
    "order": 9,
    "title": "Random Access (RA)",
    "summary": "Nobody is expecting you. Pick a door and knock.",
    "topics": [
      "access"
    ],
    "layer": "MAC / L1",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/random-access.jpg",
    "alt": "Random Access interactive experiment",
    "href": "lab/random-access/index.html",
    "searchTerms": [
      "Random Access",
      "RA"
    ]
  },
  {
    "id": "harq",
    "status": "live",
    "order": 10,
    "title": "HARQ",
    "summary": "A failed block is not thrown away. It is half of the next attempt.",
    "topics": [
      "scheduling"
    ],
    "layer": "MAC / L1",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/harq.jpg",
    "alt": "HARQ interactive experiment",
    "href": "lab/harq/index.html",
    "searchTerms": [
      "HARQ",
      "HARQ"
    ]
  },
  {
    "id": "drx-lp-wus",
    "status": "live",
    "order": 11,
    "title": "DRX and LP-WUS",
    "summary": "Listening costs battery. Sleeping costs delay.",
    "topics": [
      "power"
    ],
    "layer": "MAC / L1",
    "spec": "TS 38.321",
    "thumb": "assets/thumbs/drx-lp-wus.jpg",
    "alt": "DRX and LP-WUS interactive experiment",
    "href": "lab/drx-lp-wus/index.html",
    "searchTerms": [
      "DRX and LP-WUS",
      "DRX"
    ]
  }
];
