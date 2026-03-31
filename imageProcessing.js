
// import Tesseract from "tesseract.js";
// import Fuse from "fuse.js";
export const analyzeExamScore = async (imageElement, level, examDetails) => {
  // console.log("level to be processed is " , level)

  // Target dimensions based on level
  const match = examDetails.match(/2025\s+may/i);
  let targetDimensions = { width: 2550, height: 1650 }; // Default L1
  if (level === 2) {
    targetDimensions = { width: 1224, height: 792 }; // L2
  } else if (level === 3) {
    targetDimensions = { width: 1008, height: 612 }; // L3
  }

  // console.log(match, "match in analyzeExamScore");
  if (match) {
    // If the exam details mention May 2025, adjust the target dimensions
    targetDimensions = { width: 1008, height: 612 };
  }

  // Preprocess the image to ensure consistent dimensions for reliable analysis
  const preprocessedImage = await preprocessImage(
    imageElement,
    targetDimensions
  );

  // Setup canvas with preprocessed image
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = preprocessedImage.width;
  canvas.height = preprocessedImage.height;
  ctx.drawImage(preprocessedImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Define topics
  const topics1 = [
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
  ];
  const topics3 = [
    "Ethical and Professional Standards",
    "Economics",
    "Equity Investments",
    "Fixed Income",
    "Alternative Investments",
    "Portfolio Management",
  ];
  const topics2 = [
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
  ];
  let topics;
  if (level == 1) {
    topics = topics1;
  } else if (level == 2) {
    topics = topics2;
  }
  if (level == 3) {
    topics = topics3;
  }
  // console.log(topics);

  // Calculate calibration values based on level
  let baseWidth, baseHeight, yZeroPercent, yHundredPercent, xPositions;

  if (level == 1) {
    // L1 calibration
    baseWidth = 3000;
    baseHeight = 2000;
    const scaleFactorX = width / baseWidth;
    const scaleFactorY = height / baseHeight;

    yZeroPercent = Math.round(831 * scaleFactorY);
    yHundredPercent = Math.round(526 * scaleFactorY);

    xPositions = [434, 674, 914, 1154, 1394, 1634, 1874, 2114, 2354, 2594].map(
      (x) => Math.round(x * scaleFactorX)
    );
  } else if (level === 2) {
    // L2 calibration - values from cfaLevelConfig.js
    xPositions = [176, 274, 372, 470, 568, 666, 764, 862, 960, 1058];
    yZeroPercent = 329;
    yHundredPercent = 209;
  } else if (level == 3) {
    // L3 calibration - values from cfaLevelConfig.js
    xPositions = [173, 309, 445, 581, 717, 853];
    yZeroPercent = 344;
    yHundredPercent = 224;
  }

  if (match) {
    xPositions = [145, 220, 305, 390, 475, 560, 640, 720, 805, 887];
    yZeroPercent = 344;
    yHundredPercent = 224;
  }

  // Create enhanced grayscale for better detection
  let grayscale = createGrayscaleArray(data, width, height);
  // Enhance contrast to better identify the score lines
  grayscale = enhanceContrast(grayscale, width, height);

  // Function to calculate percentage from y-coordinate
  const yToPercentage = (y) => {
    // Add tolerance to avoid interference with gridlines
    if (y <= yHundredPercent - 5) {
      return 100.0;
    } else if (y >= yZeroPercent + 5) {
      return 0.0;
    } else {
      return (
        100 - ((y - yHundredPercent) / (yZeroPercent - yHundredPercent)) * 100
      );
    }
  };

  // Extract scores
  const scores = {};
  const debugPoints = [];

  // Setup debug canvas
  const debugCanvas = document.createElement("canvas");
  const debugCtx = debugCanvas.getContext("2d");
  debugCanvas.width = width;
  debugCanvas.height = height;
  debugCtx.drawImage(preprocessedImage, 0, 0);
  debugCtx.font = "16px Arial";

  // Draw reference gridlines
  debugCtx.strokeStyle = "rgba(0, 255, 0, 0.5)";
  debugCtx.lineWidth = 2;

  // Draw 100% and 0% reference lines
  debugCtx.beginPath();
  debugCtx.moveTo(0, yHundredPercent);
  debugCtx.lineTo(width, yHundredPercent);
  debugCtx.stroke();
  debugCtx.fillStyle = "green";
  debugCtx.fillText("100%", 20, yHundredPercent);

  debugCtx.beginPath();
  debugCtx.moveTo(0, yZeroPercent);
  debugCtx.lineTo(width, yZeroPercent);
  debugCtx.stroke();
  debugCtx.fillText("0%", 20, yZeroPercent);

  // Improved analysis for each topic column
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const x = xPositions[i];

    // Mark column position on debug image
    debugCtx.fillStyle = "blue";
    debugCtx.fillRect(x, 0, 2, height);
    debugCtx.fillText(topic.substring(0, 10), x, 20);

    // Define vertical region of interest strictly within the calibrated 0-100% range
    const roiYStart = yHundredPercent; // Top of the score range (100% line)
    const roiYEnd = yZeroPercent; // Bottom of the score range (0% line)
    // Increase ROI width for better detection
    const roiWidth = 40; // Wider region to capture the score bar
    const roiXStart = Math.max(x - roiWidth / 2, 0);
    const roiXEnd = Math.min(x + roiWidth / 2, width);

    // Multi-pass strategy to find the score line
    let bestLineY = null;
    let minIntensity = 255;

    // First pass: Look for the darkest horizontal line in the ROI
    for (let y = roiYStart; y <= roiYEnd; y++) {
      // Calculate average intensity with greater weight on center pixels
      let totalIntensity = 0;
      let pixelCount = 0;

      for (let dx = roiXStart; dx < roiXEnd; dx++) {
        const grayValue = grayscale[y * width + dx];
        // Weight pixels closer to center more heavily
        const distanceFromCenter = Math.abs(dx - x);
        const weight = 1 - (distanceFromCenter / (roiWidth / 2)) * 0.5;
        totalIntensity += grayValue * weight;
        pixelCount += weight;
      }

      const avgIntensity = totalIntensity / pixelCount;

      // Find the darkest line
      if (avgIntensity < minIntensity) {
        minIntensity = avgIntensity;
        bestLineY = y;
      }
    }

    // Second pass: If first pass didn't find a strong signal, look for red markers
    // which often indicate score positions in these charts
    if (minIntensity > 150) {
      // Threshold to identify if detection likely failed
      // Look for red markers which could indicate score positions
      let bestRedY = null;
      let maxRedScore = 0;

      for (let y = roiYStart; y <= roiYEnd; y++) {
        let redScore = 0;

        for (let dx = roiXStart; dx < roiXEnd; dx++) {
          const idx = (y * width + dx) * 4;
          // Calculate "redness" - how much red dominates over other colors
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Red detection formula - red must be high, other channels lower
          if (r > 100 && r > g * 1.5 && r > b * 1.5) {
            // Weight by how "red" the pixel is
            redScore += (r - Math.max(g, b)) / 255;
          }
        }

        // Keep track of the y-position with the highest red score
        if (redScore > maxRedScore) {
          maxRedScore = redScore;
          bestRedY = y;
        }
      }

      // If we found a significant red feature, use it instead
      if (bestRedY !== null && maxRedScore > 3.0) {
        bestLineY = bestRedY;
      }
    }

    // Third pass: Use edge detection to find horizontal lines
    // This helps when the score line is thin but distinct
    if (minIntensity > 150 && !bestLineY) {
      let bestEdgeY = null;
      let maxEdgeStrength = 0;

      // Simple horizontal Sobel-like edge detector
      for (let y = roiYStart + 1; y < roiYEnd - 1; y++) {
        let edgeStrength = 0;

        for (let dx = roiXStart; dx < roiXEnd; dx++) {
          // Calculate vertical gradient (difference between pixels above and below)
          const above = grayscale[(y - 1) * width + dx];
          const below = grayscale[(y + 1) * width + dx];
          const gradient = Math.abs(above - below);
          edgeStrength += gradient;
        }

        // Normalize by width of ROI
        edgeStrength /= roiXEnd - roiXStart;

        if (edgeStrength > maxEdgeStrength) {
          maxEdgeStrength = edgeStrength;
          bestEdgeY = y;
        }
      }

      // If we found a strong edge, use it
      if (bestEdgeY !== null && maxEdgeStrength > 15) {
        bestLineY = bestEdgeY;
      }
    }

    // Calculate and store score if we found a suitable position
    if (bestLineY !== null) {
      const percentage = yToPercentage(bestLineY);
      scores[topic] = Math.round(percentage * 10) / 10; // Round to 1 decimal place

      // Mark detected point on debug image
      debugCtx.fillStyle = "red";
      debugCtx.beginPath();
      debugCtx.arc(x, bestLineY, 5, 0, 2 * Math.PI);
      debugCtx.fill();
      debugCtx.fillStyle = "black";
      debugCtx.fillText(`${percentage.toFixed(1)}%`, x + 10, bestLineY);

      debugPoints.push({ x, y: bestLineY, score: percentage });
    } else {
      console.log(`Could not detect score line for ${topic}`);
      scores[topic] = null; // No fallback, return null for missing data
    }
  }

  // Save debug image
  const debugImageUrl = debugCanvas.toDataURL("image/png");

  return { scores, debugImageUrl };
};

// New function to preprocess and resize the image to optimal dimensions
async function preprocessImage(
  imageElement,
  dimensions = { width: 2550, height: 1650 }
) {
  // Get target dimensions from parameter or use defaults
  const targetWidth = dimensions.width;
  const targetHeight = dimensions.height;

  // Create a temporary canvas for resizing
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // Set the canvas to the target dimensions
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;

  // Use better quality interpolation for resizing
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";

  // Draw the original image scaled to target dimensions
  tempCtx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);

  // Create a new image with the resized dimensions
  return new Promise((resolve) => {
    const resizedImage = new Image();
    resizedImage.onload = () => resolve(resizedImage);
    resizedImage.src = tempCanvas.toDataURL("image/png");
  });
}

// Enhanced grayscale function with better handling of color information
function createGrayscaleArray(data, width, height) {
  const grayscale = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Improved grayscale formula that better preserves line features
      grayscale[y * width + x] = Math.round(
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      );
    }
  }

  return grayscale;
}

// Enhanced contrast function with adaptive local contrast enhancement
function enhanceContrast(grayscale, width, height) {
  // Find min and max values
  let min = 255;
  let max = 0;

  for (let i = 0; i < grayscale.length; i++) {
    if (grayscale[i] < min) min = grayscale[i];
    if (grayscale[i] > max) max = grayscale[i];
  }

  // Apply contrast enhancement with gamma correction
  const range = max - min;
  if (range === 0) return grayscale;

  const enhanced = new Uint8Array(grayscale.length);
  const gamma = 0.7; // Slightly stronger gamma correction for better visibility

  for (let i = 0; i < grayscale.length; i++) {
    // Normalize, apply gamma, then scale back to 0-255
    const normalized = (grayscale[i] - min) / range;
    enhanced[i] = Math.round(Math.pow(normalized, gamma) * 255);
  }

  // Optional: Apply local contrast enhancement for areas with low contrast
  const windowSize = 15;
  const localEnhanced = adaptiveThreshold(
    enhanced,
    width,
    height,
    windowSize,
    5
  );

  // Blend original enhanced with adaptive threshold result
  for (let i = 0; i < enhanced.length; i++) {
    // Only enhance dark features to preserve potential line markers
    if (enhanced[i] < 128) {
      enhanced[i] = Math.min(enhanced[i], localEnhanced[i]);
    }
  }

  return enhanced;
}

// Improved adaptive threshold function
function adaptiveThreshold(grayscale, width, height, windowSize = 15, C = 5) {
  const result = new Uint8Array(grayscale.length);
  const halfWindow = Math.floor(windowSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Compute local mean with integral image approach for efficiency
      let sum = 0;
      let count = 0;

      // Use a smaller window for efficiency
      for (
        let wy = Math.max(0, y - halfWindow);
        wy <= Math.min(height - 1, y + halfWindow);
        wy++
      ) {
        for (
          let wx = Math.max(0, x - halfWindow);
          wx <= Math.min(width - 1, x + halfWindow);
          wx++
        ) {
          sum += grayscale[wy * width + wx];
          count++;
        }
      }

      const mean = sum / count;
      const pixel = grayscale[y * width + x];

      // Apply threshold: if pixel is C units less than local mean, it's foreground
      result[y * width + x] = pixel < mean - C ? 0 : 255;
    }
  }

  return result;
}





export function analyzeTextFromImageForCfaL3(image) {
  const imageUrl = URL.createObjectURL(image);

  return Tesseract.recognize(imageUrl, "eng")
    .then(({ data: { text } }) => {
      URL.revokeObjectURL(imageUrl);

      const cleanedText = text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // console.log("cleanedText", cleanedText);
      const words = cleanedText.split(" ");

      const fuse = new Fuse(words, {
        includeScore: true,
        threshold: 0.4,
      });



      const congratsFound = fuse.search("congratulation").length > 0;
      const cfaFound = fuse.search("cfa").length > 0;
      const levelFound = fuse.search("level").length > 0;

      const monthRegex = "(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)";

      const examRegex = new RegExp(`\\b${monthRegex}\\s+(20\\d{2})\\s+level\\s+([il]{1,3})\\s+cfa\\b`);


      const examMatch = cleanedText.match(examRegex);
      // console.log("congratsFound", congratsFound);
      // console.log("cfaFound", cfaFound);
      // console.log("levelFound", levelFound)
      // console.log("examMatch", examMatch);

      if (examMatch && congratsFound && cfaFound && levelFound) {
        const year = parseInt(examMatch[2]);
        let month = examMatch[1]; // exact textual month
        month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase(); // Capitalize first letter

        const rawLevel = examMatch[3];
        const level = rawLevel.length; // Simply count length to determine level

        return {
          result: "pass",
          year,
          month,
          level
        };
      } else {
        return "Provide original CFA Level 3 result image";
      }
    })
    .catch((err) => {
      console.error("OCR error:", err);
      return "error";
    });
}
