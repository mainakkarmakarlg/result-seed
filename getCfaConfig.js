export const CFA_LEVELS = {
  L1: {
    id: "L1",
    name: "CFA Level 1",
    topics: [
      "Ethical and Professional Standards",
      "Quantitative Methods",
      "Economics",
      "Financial Statement Analysis",
      "Corporate Issuers",
      "Equity Investments",
      "Fixed Income",
      "Derivatives",
      "Alternative Investments",
      "Portfolio Management",
    ],
    dimensions: {
      width: 1008,
      height: 612,
      baseDimensions: {
        BASE_WIDTH: 2016,
        BASE_HEIGHT: 1224,
      },
      pdfDimensions: {
        width: 1008,
        height: 612,
      },
    },
    calibration: {
      yZeroPercent: 368,
      yHundredPercent: 247,
      xPositions: [134, 220, 305, 390, 475, 560, 645, 725, 805, 895],
    },
  },
  L2: {
    id: "L2",
    name: "CFA Level 2",
    topics: [
      "Ethical and Professional Standards",
      "Quantitative Methods",
      "Economics",
      "Financial Statement Analysis",
      "Corporate Issuers",
      "Equity Investments",
      "Fixed Income",
      "Derivatives",
      "Alternative Investments",
      "Portfolio Management",
    ],
    dimensions: {
      width: 1224,
      height: 792,
      baseDimensions: {
        BASE_WIDTH: 2448,
        BASE_HEIGHT: 1584,
      },
      pdfDimensions: {
        width: 1224,
        height: 792,
      },
    },
    calibration: {
      yZeroPercent: 329,
      yHundredPercent: 209,
      xPositions: [176, 274, 372, 470, 568, 666, 764, 862, 960, 1058],
    },
  },
  L3: {
    id: "L3",
    name: "CFA Level 3",
    topics: [
      "Ethical and Professional Standards",
      "Economics",
      "Equity Investments",
      "Fixed Income",
      "Alternative Investments",
      "Portfolio Management",
    ],
    dimensions: {
      width: 1008,
      height: 612,
      baseDimensions: {
        BASE_WIDTH: 2016,
        BASE_HEIGHT: 1224,
      },
      pdfDimensions: {
        width: 1008,
        height: 612,
      },
    },
    calibration: {
      yZeroPercent: 344,
      yHundredPercent: 224,
      xPositions: [173, 309, 445, 581, 717, 853],
    },
  },
  L1_2025: {
    id: "L1_2025",
    name: "CFA L1 2025 May result",
    topics: [
      "Ethical and Professional Standards",
      "Quantitative Methods",
      "Economics",
      "Financial Statement Analysis",
      "Corporate Issuers",
      "Equity Investments",
      "Fixed Income",
      "Derivatives",
      "Alternative Investments",
      "Portfolio Management",
    ],
    dimensions: {
      width: 1008,
      height: 612,
      baseDimensions: {
        BASE_WIDTH: 2016,
        BASE_HEIGHT: 1224,
      },
      pdfDimensions: {
        width: 1008,
        height: 612,
      },
    },
    calibration: {
      yZeroPercent: 344,
      yHundredPercent: 224,
      xPositions: [145, 220, 305, 390, 475, 560, 640, 720, 805, 887],
    },
  },
};

// Default CFA level
export const DEFAULT_CFA_LEVEL = "L1";

// Get configuration for a specific CFA level
export const getCfaLevelConfig = (level) => {
  return CFA_LEVELS[level] || CFA_LEVELS[DEFAULT_CFA_LEVEL];
};
