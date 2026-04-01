import { extractCourseId } from "./courseData.js";
import { matchesExamMonth } from "./helpers.js";
import { analyzeExamScore } from "./imageProcessing.js";
import { analyzeExamScore2 } from "./imageProcessing2.js";
import { useProcessPdfCfa } from "./useProcessPdf.js";

const backendURL = "http://localhost:5002/api";
const DAUTH = "45454545";
const failedResponses = [];

function convertToSubjectArray(data) {
  return Object.entries(data).map(([subject, marks]) => ({
    subject,
    marks,
  }));
}

const fetchCourseData = async () => {
  try {
    const response = await fetch(`${backendURL}/platform/platformcourse`, {
      method: "GET",
      headers: {
        dauth: DAUTH,
      },
    });
    if (response.ok) {
      const jsonData = await response.json();
      return { data: jsonData };
    }
  } catch (error) {
    console.error("Error fetching course data:", error);
  }
  return { data: [] };
};

const sendDataToBackend = async (data, file, userId, courseResponse) => {
  let courseIdTemp = null;
  try {
    const apiFormData = new FormData();
    const courseId = extractCourseId(data.summary, courseResponse);
    courseIdTemp = courseId;
    // data.scores.score = data.summary.score;
    // console.log(data.scores);

    const finalData = convertToSubjectArray(data.scores);
    finalData.push({
      score: data.summary.score,
    });

    const dataForApi = {
      enrollmentId: data.summary.cfaId,
      marks: finalData,
      isPass: data.summary.mininumPassingScore <= data.summary.score,
      score: data.summary.score,
      courseId: courseId,
    };
    apiFormData.append("courseId", dataForApi.courseId);
    apiFormData.append("score", dataForApi.score);
    apiFormData.append("marks", JSON.stringify(dataForApi.marks));
    apiFormData.append("isPass", dataForApi.isPass);
    apiFormData.append("formId", 3);
    apiFormData.append("userId", userId);
    apiFormData.append("enrollmentId", dataForApi.enrollmentId);
    apiFormData.append("attachment", file);

    const response = await fetch(`${backendURL}/user/result-analysis-seed`, {
      method: "POST",
      headers: {
        // Authorization: `Bearer ${token}`,
        dauth: DAUTH,
      },
      body: apiFormData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
  } catch (error) {
    console.error("Error sending data to backend:", error);
    const failedUser = {
      userId,
      data,
      courseId: courseIdTemp,
    };
    console.log("Failed User:", failedUser);
    failedResponses.push(failedUser);
  }
};

const getCfaAnalysis = async (userId, link, file, courseResponse) => {
  const { page1Image, page2Image, summary, error } = await useProcessPdfCfa(
    file
  );

  const { level, examDetails, extractSubject } = summary;

  console.log("sumaary : ", summary);
  console.log("pdf link : ", link);
  console.log("user id : ", userId);

  let imageElement = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = page2Image;
  });

  let scores, debugImageUrl;

  if (matchesExamMonth(examDetails)) {
    ({ scores } = await analyzeExamScore2(
      imageElement,
      Number(level),
      extractSubject
    ));
  } else {
    // Otherwise, call analyzeExamScore
    ({ scores } = await analyzeExamScore(
      imageElement,
      level,
      examDetails,
      extractSubject
    ));
  }

  await sendDataToBackend({ summary, scores }, link, userId, courseResponse);
  return { summary, scores };
};

const callWithWebFile = async (userId, fileUrl, courseResponse) => {
  try {
    // Fetch the file from the URL
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the file as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Extract filename from URL or use a default
    const fileName = fileUrl.split("/").pop() || "document.pdf";

    // Create File object
    const file = new File([arrayBuffer], fileName, {
      type: "application/pdf",
      lastModified: Date.now(),
    });

    // Call your function
    return await getCfaAnalysis(userId, fileUrl, file, courseResponse);
  } catch (error) {
    console.error("Error fetching file:", error);
  }
};

const processExcelAndFetch = async (file) => {
  const resultsArray = [];
  const courseResponse = await fetchCourseData();
  const tempFile = file;
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Skip header row if any, adjust index accordingly
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    const id = row[0];
    // await setTimeout(async () => {
    try {
      if (!row[2]) {
        console.warn(`Row ${i + 1}: column 3 is empty, skipping.`);
        continue;
      }
      const linksJson = JSON.parse(row[2]);

      for (const fileObj of linksJson) {
        if (fileObj.type === "application/pdf" && fileObj.link) {
          const result = await callWithWebFile(id, fileObj.link, courseResponse);

          resultsArray.push({
            id,
            result,
          });
        }
      }
    } catch (err) {
      console.error(`Error processing row ${i + 1}:`, err);
    }
    // }, [3000]);
  }

  return resultsArray;
};

// document.getElementById("runButton").addEventListener("click", async function() {
//     console.log("Button clicked, starting analysis...");
//     const fileUrl = 'https://del1.vultrobjects.com/crmaswinibajaj/CRM/resultAnalysis/7d6095fd-0b4f-4ad6-b0ac-878a64f4fb1e_10.pdf';
//     await callWithWebFile(fileUrl);
//   // Place any logic you want to run here
// });
// document
//   .getElementById("fileInput")
//   .addEventListener("change", async function (event) {
//     const file = event.target.files[0];

//     if (file) {
//       const resultArray = await processExcelAndFetch(file);
//       console.log("Result Array:", resultArray);
//     }
//   });

document
  .getElementById("fileInput")
  .addEventListener("change", async function (event) {
    const file = event.target.files[0];
    const loader = document.getElementById("loader");

    if (file) {
      loader.style.display = "block"; // Show loader
      try {
        const resultArray = await processExcelAndFetch(file);
        console.log("Result Array:", resultArray);
        console.log("Failed responses:", failedResponses);
      } catch (error) {
        console.error("Error processing file:", error);
      } finally {
        loader.style.display = "none"; // Hide loader
      }
    }
  });
