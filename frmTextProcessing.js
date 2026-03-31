export const analyzeFRMResultText = (text) => {
  console.log("Analyzing FRM result text...", text);

  const scores = {};

  const topics1 = [
    "Foundations of Risk Management",
    "Quantitative Analysis",
    "Financial Markets and Products",
    "Valuation and Risk Models",
  ];
  const topics2 = [
    "Market Risk Measurement and Management",
    "Credit Risk Measurement and Management",
    "Operational Risk and Resiliency",
    "Liquidity and Treasury Risk Measurement and Management",
    "Risk Management and Investment Management",
    "Current Issues in Financial Markets",
  ];

  const validateResult = () => {
    const paasPhraseForFRM = [
      "score did not meet",
      "regret to inform",
      "Congratulations! You passed",
    ];
  };

  // Map Roman numerals to numbers
  const romanToNumber = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
  };

  // Extract level
  const matchLevel = text.match(/FRM Exam Part (\w+)/i);
  const level = matchLevel
    ? romanToNumber[matchLevel[1].toUpperCase()] || null
    : null;

  // Extract exam date
  const examDateMatch = text.match(/Exam\s*Date\s*:\s*([A-Za-z0-9,\-\s]+)/i);
  let examDate = examDateMatch ? examDateMatch[1] : null;
  examDate = examDate.split(" ").splice(0, 2);

  const garpIdMatch = text.match(/GARP ID:\s*(\d+)/);
  const garpId = garpIdMatch ? garpIdMatch[1] : null;

  // Extract name (appears between "Results" and "GARP ID")
  const nameMatch = text.match(/FRM Exam Part \w+ Results\s*([\s\S]*?)\n/i);
  const name = nameMatch ? nameMatch[1].trim() : null;

  const summary = {
    level,
    examDetails: examDate + " FRM Part " + String(level),
    garpId,
    name,
    course: "FRM Part " + level,
    result: "",
  };

  // Normalize whitespaces once outside the loop
  const normalizedText = text.replace(/\s+/g, " ");
  // console.log(normalizedText);
  const topics = level === 1 ? topics1 : topics2;
  topics.forEach((topic, index) => {
    const nextTopic = topics[index + 1];
    let chunk;

    if (nextTopic) {
      // Split from this topic to the next topic
      const regex = new RegExp(`${topic}(.*?)${nextTopic}`, "is");
      const match = normalizedText.match(regex);
      chunk = match ? match[1] : "";
    } else {
      // For the last topic, get everything till the end
      const regex = new RegExp(`${topic}(.*)`, "is");
      const match = normalizedText.match(regex);
      chunk = match ? match[1] : "";
    }

    const scoreMatch = chunk.match(
      /You scored in the (\d{1,3})\s*(?:st|nd|rd|th)?\s*-\s*(\d{1,3})\s*(?:st|nd|rd|th)? percentile/i
    );

    if (scoreMatch && scoreMatch[1] && scoreMatch[2]) {
      scores[topic] = Number(scoreMatch[1]) + "-" + Number(scoreMatch[2]);
    } else {
      scores[topic] = null;
    }

    // console.log(topic, "→", scores[topic]);
  });

  // let totalScore = 0;
  // Object.keys(scores).forEach((topic) => {
  //   if (Number(scores[topic]?.split("-")[0]) <= 25) {
  //     totalScore += -2;
  //   } else if (Number(scores[topic]?.split("-")[0]) <= 50) {
  //     totalScore += -1;
  //   } else if (Number(scores[topic]?.split("-")[0]) <= 75) {
  //     totalScore += 1;
  //   } else {
  //     totalScore += 2;
  //   }
  // });

  // summary.result = totalScore >= 0 ? "Pass" : "Fail";

  return {
    scoreResults: scores,
    summary,
  };
};
