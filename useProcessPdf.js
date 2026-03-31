
const useProcessPdfFrm = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = pdf.numPages;
  let fullText = "";

  // Extract text from all pages (or relevant pages if the structure is consistent)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // console.log(textContent);
    fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
  }
  if (!checkResultValidity(fullText, "FRM")) {
    return { error: "invalid result ,please provide original FRM result" };
  }

  return { processedContent: fullText };
};
const useProcessPdfCfa = async (file) => {
  // console.log("processing pdf");
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  // console.log("processing pdf");
  const pageCount = pdf.numPages;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();

  let fullText = textContent.items.map((item) => item.str).join(" ") + "\n";

  if (!checkResultValidity(fullText, "CFA")) {
    return { error: "invalid result ,please provide original CFA result" };
  }
  const summary = extractCFAResults(fullText);

  // Always try to get both pages if available
  const getPageImage = async (pageNum) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas.toDataURL("image/png");
  };
  const page1Image = await getPageImage(1);
  let page2Image = null;
  if (pageCount >= 2) {
    page2Image = await getPageImage(2);
  }
  return { page1Image, page2Image, summary };
};

function extractCFAResults(text) {
  // Extract exam details

  const examMatch = text.match(
    /Exam:\s+([\d]{4}\s+[A-Za-z]+\s+Level\s+[I|II|III]+\s+CFA\s+Exam)/i
  );
  const examDetails = examMatch ? examMatch[1] : null;

  const match = examDetails.match(/Level\s+([I]{1,3}|\d)/i);

  let level = null;

  if (match) {
    const value = match[1].toUpperCase();
    const romanToNumber = { I: 1, II: 2, III: 3 };

    level = romanToNumber[value] || parseInt(value);
  }

  // Extract candidate's score
  const scoreMatch = text.match(/Your Score:\s+(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

  // Extract minimum passing score
  const mpsMatch = text.match(/Minimum Passing Score \(MPS\)[:\s]*(\d+)/i);
  const minimumPassingScore = mpsMatch ? parseInt(mpsMatch[1]) : null;

  // Extract candidate name
  const nameMatch = text.match(/Name:\s+([^\n]+)/i);
  let name = nameMatch ? nameMatch[1].trim() : null;
  name = name?.split(" ")?.splice(0, 2)?.join(" ");

  // Extract CFA ID
  const idMatch = text.match(/CFA Institute ID:\s+(\d+)/i);
  const cfaId = idMatch ? idMatch[1] : null;

  return {
    name,
    cfaId,
    examDetails,
    score,
    minimumPassingScore,
    level,
    course: "CFA Level " + level,
  };
}
const requiredPhrasesFrm = [
  "frm exam", // Heading or reference to the exam
  // GARP ID (unique to FRM)
  "exam date", // Exam date
  "percentile range", // Quartile/percentile performance,
  // Topic section
];
const requiredPhrasesCfa = [
  "cfa program exam results", // heading
  "name:", // candidate name
  "exam:", // exam session
  "result", // result status
  //                    // or "did not pass"
  "your score", // candidate's score
  "minimum passing score", // MPS
  // page footer
];

function checkResultValidity(pdfText, examType) {

  // Convert to lower case for loose matching

  const text = pdfText.toLowerCase();

  // Looser patterns, not requiring exact colons or spacing
  const requiredPhrases =
    examType === "CFA" ? requiredPhrasesCfa : requiredPhrasesFrm;
  let count = 0;
  for (const phrase of requiredPhrases) {
    if (text.includes(phrase)) {
      // For debugging:
      // console.log(`Missing phrase: ${phrase}`);
      count++;
    }
  }

  const minCount = examType === "CFA" ? 3 : 0;
  if (count > minCount) return true;
  else return false;
}

export {useProcessPdfCfa}
